"""Integração entre microsserviços por eventos (Apache Kafka).

Padrão usado: *transactional outbox* + réplicas locais.

1. Produtor: quando um dado muda, um trigger do PostgreSQL grava o evento na
   tabela ``outbox_eventos`` do próprio serviço, na MESMA transação da
   alteração (o evento nunca se perde nem é publicado sem o dado existir) e
   avisa com ``pg_notify('outbox')``.
2. Relay: uma thread de cada serviço produtor escuta esse aviso (LISTEN) e
   publica os eventos pendentes no Kafka em tempo real.
3. Consumidor: uma thread de cada serviço interessado lê os tópicos (consumer
   group próprio) e atualiza tabelas de réplica locais (``*_replica``). O
   offset só é confirmado depois de gravar no banco (entrega "pelo menos uma
   vez"); as gravações são idempotentes (upsert do estado completo).

Tópicos (chave = id da entidade, ``cleanup.policy=compact`` para guardar o
último estado de cada entidade):

    wellflix.identidade.usuarios    usuario.atualizado / usuario.removido
    wellflix.catalogo.categorias    categoria.atualizada / categoria.removida
    wellflix.catalogo.videos        video.atualizado / video.removido
    wellflix.profissionais.perfis   perfil.atualizado / perfil.removido

Configuração (variáveis de ambiente):

    KAFKA_BOOTSTRAP_SERVERS   ex.: localhost:9092 (sem ela, a integração fica desligada)
    KAFKA_SECURITY_PROTOCOL   ex.: SASL_SSL (Kafka gerenciado)
    KAFKA_SASL_MECHANISM      ex.: PLAIN ou SCRAM-SHA-256
    KAFKA_SASL_USERNAME / KAFKA_SASL_PASSWORD
    KAFKA_TOPIC_REPLICATION   fator de replicação ao criar tópicos (padrão 1)
"""

import json
import logging
import os
import threading
from collections.abc import Callable

from fastapi import FastAPI

from backend.services.shared.database import connect, resolve_schema

log = logging.getLogger("wellflix.eventos")

TOPICS = [
    "wellflix.identidade.usuarios",
    "wellflix.catalogo.categorias",
    "wellflix.catalogo.videos",
    "wellflix.profissionais.perfis",
]

# Um manipulador recebe (cursor do banco, evento) e grava a réplica.
Handler = Callable[[object, dict], None]


def kafka_config() -> dict | None:
    servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "").strip()
    if not servers:
        return None
    config = {"bootstrap.servers": servers}
    optional = {
        "security.protocol": "KAFKA_SECURITY_PROTOCOL",
        "sasl.mechanism": "KAFKA_SASL_MECHANISM",
        "sasl.username": "KAFKA_SASL_USERNAME",
        "sasl.password": "KAFKA_SASL_PASSWORD",
    }
    for key, env in optional.items():
        if os.getenv(env):
            config[key] = os.environ[env]
    return config


def ensure_topics(config: dict) -> None:
    from confluent_kafka.admin import AdminClient, NewTopic

    replication = int(os.getenv("KAFKA_TOPIC_REPLICATION", "1"))
    admin = AdminClient(config)
    existing = set(admin.list_topics(timeout=10).topics)
    missing = [
        NewTopic(topic, num_partitions=1, replication_factor=replication, config={"cleanup.policy": "compact"})
        for topic in TOPICS if topic not in existing
    ]
    if not missing:
        return
    for topic, future in admin.create_topics(missing).items():
        try:
            future.result()
            log.info("Tópico criado: %s", topic)
        except Exception as error:  # tópico criado por outro serviço ao mesmo tempo
            log.info("Tópico %s não criado: %s", topic, error)


# --- Produtor: relay do outbox ---------------------------------------------


def _publish_pending(conn, producer) -> int:
    """Publica os eventos pendentes do outbox e os marca como publicados."""
    with conn.transaction():
        rows = conn.execute(
            "SELECT id, topico, chave, tipo, payload FROM outbox_eventos"
            " WHERE publicado_em IS NULL ORDER BY id LIMIT 500 FOR UPDATE SKIP LOCKED"
        ).fetchall()
        if not rows:
            return 0
        errors: list = []
        for row in rows:
            value = json.dumps({"id_evento": row["id"], "tipo": row["tipo"], "dados": row["payload"]}, default=str)
            producer.produce(
                row["topico"], key=row["chave"], value=value.encode(),
                on_delivery=lambda err, _msg: err and errors.append(err),
            )
        producer.flush(15)
        if errors:
            raise RuntimeError(f"Falha ao publicar no Kafka: {errors[0]}")
        conn.execute(
            "UPDATE outbox_eventos SET publicado_em = now() WHERE id = ANY(%s)",
            ([row["id"] for row in rows],),
        )
    return len(rows)


def _relay_loop(schema: str, config: dict, stop: threading.Event) -> None:
    from confluent_kafka import Producer

    producer = Producer({**config, "enable.idempotence": True, "acks": "all"})
    while not stop.is_set():
        try:
            with connect(schema, autocommit=True) as conn:
                conn.execute("LISTEN outbox")
                while not stop.is_set():
                    while _publish_pending(conn, producer):
                        pass
                    # Acorda assim que um trigger avisar (tempo real) ou a cada 5 s.
                    for _ in conn.notifies(timeout=5, stop_after=1):
                        pass
        except Exception:
            log.exception("Relay do outbox (%s) falhou; tentando de novo em 5 s", schema)
            stop.wait(5)


# --- Consumidor: réplicas locais -------------------------------------------


def _consumer_loop(service: str, schema: str, config: dict, handlers: dict[str, Handler], stop: threading.Event) -> None:
    from confluent_kafka import Consumer, KafkaError

    consumer = Consumer({
        **config,
        "group.id": f"wellflix-{service}",
        "auto.offset.reset": "earliest",
        "enable.auto.commit": False,
    })
    consumer.subscribe(sorted({topic for topic in handlers_topics(handlers)}))
    try:
        while not stop.is_set():
            message = consumer.poll(1.0)
            if message is None:
                continue
            if message.error():
                if message.error().code() != KafkaError._PARTITION_EOF:
                    log.warning("Kafka (%s): %s", service, message.error())
                continue
            try:
                event = json.loads(message.value())
                handler = handlers.get(event["tipo"])
                if handler:
                    with connect(schema) as conn, conn.cursor() as cur:
                        handler(cur, event["dados"])
                consumer.commit(message=message, asynchronous=False)
            except Exception:
                log.exception("Falha ao processar evento de %s; será reprocessado", message.topic())
                consumer.seek(message)  # volta para reprocessar a mesma mensagem
                stop.wait(5)
    finally:
        consumer.close()


def handlers_topics(handlers: dict[str, Handler]) -> set[str]:
    prefix = {
        "usuario": "wellflix.identidade.usuarios",
        "categoria": "wellflix.catalogo.categorias",
        "video": "wellflix.catalogo.videos",
        "perfil": "wellflix.profissionais.perfis",
    }
    return {prefix[name.split(".")[0]] for name in handlers}


# --- Ligação com o FastAPI -------------------------------------------------


def start_event_workers(app: FastAPI, service: str, *, produces: bool, handlers: dict[str, Handler] | None = None) -> None:
    """Liga o relay (se o serviço produz eventos) e o consumidor (se tem réplicas)."""
    stop = threading.Event()

    def startup() -> None:
        config = kafka_config()
        if config is None:
            log.warning("KAFKA_BOOTSTRAP_SERVERS não configurada: eventos ficam no outbox e as réplicas não são atualizadas.")
            return
        if os.getenv("EVENTOS_DESLIGADOS") == "1":
            return
        schema = resolve_schema(service)
        try:
            ensure_topics(config)
        except Exception:
            log.exception("Não foi possível verificar/criar os tópicos do Kafka")
        if produces:
            threading.Thread(target=_relay_loop, args=(schema, config, stop), name=f"relay-{service}", daemon=True).start()
        if handlers:
            threading.Thread(target=_consumer_loop, args=(service, schema, config, handlers, stop), name=f"consumidor-{service}", daemon=True).start()

    app.router.add_event_handler("startup", startup)
    app.router.add_event_handler("shutdown", stop.set)


# --- Manipuladores reutilizados por mais de um serviço ---------------------


def upsert_usuario(cur, dados: dict) -> None:
    cur.execute(
        "INSERT INTO usuarios_replica (id, nome_completo, papeis, atualizado_em) VALUES (%s, %s, %s, now())"
        " ON CONFLICT (id) DO UPDATE SET nome_completo = EXCLUDED.nome_completo, papeis = EXCLUDED.papeis, atualizado_em = now()",
        (dados["id"], dados["nome_completo"], dados.get("papeis", [])),
    )


def delete_usuario(cur, dados: dict) -> None:
    cur.execute("DELETE FROM usuarios_replica WHERE id = %s", (dados["id"],))


def upsert_categoria(cur, dados: dict) -> None:
    cur.execute(
        "INSERT INTO categorias_replica (id, nome, atualizado_em) VALUES (%s, %s, now())"
        " ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, atualizado_em = now()",
        (dados["id"], dados["nome"]),
    )


def delete_categoria(cur, dados: dict) -> None:
    cur.execute("DELETE FROM categorias_replica WHERE id = %s", (dados["id"],))


USUARIO_HANDLERS: dict[str, Handler] = {
    "usuario.atualizado": upsert_usuario,
    "usuario.removido": delete_usuario,
}
CATEGORIA_HANDLERS: dict[str, Handler] = {
    "categoria.atualizada": upsert_categoria,
    "categoria.removida": delete_categoria,
}
