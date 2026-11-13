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

Além dos eventos de domínio, todo serviço publica um *heartbeat* operacional
em ``wellflix.operacional.heartbeat`` (a cada ``HEARTBEAT_INTERVALO_SEGUNDOS``,
padrão 30) e escuta o dos outros. Assim cada serviço sabe, só pelo broker,
quais outros estão vivos (ver ``/status``), e os logs mostram a comunicação por
publicação acontecendo mesmo sem ação de usuário.

Configuração (variáveis de ambiente):

    KAFKA_BOOTSTRAP_SERVERS   ex.: localhost:9092 (sem ela, a integração fica desligada)
    KAFKA_SECURITY_PROTOCOL   ex.: SASL_SSL ou SSL (Kafka gerenciado)
    KAFKA_SASL_MECHANISM      ex.: PLAIN ou SCRAM-SHA-256
    KAFKA_SASL_USERNAME / KAFKA_SASL_PASSWORD
    KAFKA_SSL_CA_PEM          conteúdo do certificado da CA (ex.: ca.pem do Aiven)
    KAFKA_SSL_CERT_PEM / KAFKA_SSL_KEY_PEM   certificado e chave do cliente
                              (autenticação por certificado, padrão do Aiven)
    KAFKA_TOPIC_REPLICATION   fator de replicação ao criar tópicos (padrão: o do broker)

Os certificados vêm como texto porque o Render não tem arquivos de
configuração: o serviço grava cada um num arquivo temporário na subida.
"""

import json
import logging
import os
import threading
from collections.abc import Callable
from datetime import datetime

from fastapi import FastAPI

from backend.services.shared.database import connect, resolve_schema
from backend.services.shared.observabilidade import ESTADO, INSTANCIA, agora, request_id

log = logging.getLogger("wellflix.eventos")
log_hb = logging.getLogger("wellflix.heartbeat")
TOPICO_HEARTBEAT = "wellflix.operacional.heartbeat"

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
    pems = {
        "ssl.ca.location": "KAFKA_SSL_CA_PEM",
        "ssl.certificate.location": "KAFKA_SSL_CERT_PEM",
        "ssl.key.location": "KAFKA_SSL_KEY_PEM",
    }
    for key, env in pems.items():
        if os.getenv(env, "").strip():
            config[key] = _pem_file(env, os.environ[env])
    return config


def _pem_file(name: str, content: str) -> str:
    """Grava um certificado recebido por variável de ambiente e devolve o caminho."""
    import tempfile

    # Painéis às vezes guardam quebras de linha como "\n" literal.
    content = content.strip().replace("\\n", "\n") + "\n"
    path = os.path.join(tempfile.gettempdir(), f"wellflix-{name.lower()}.pem")
    with open(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w", encoding="utf-8") as file:
        file.write(content)
    return path


def ensure_topics(config: dict) -> None:
    from confluent_kafka.admin import AdminClient, NewTopic

    replication = int(os.getenv("KAFKA_TOPIC_REPLICATION", "-1"))  # -1 = padrão do broker
    admin = AdminClient(config)
    existing = set(admin.list_topics(timeout=10).topics)
    ESTADO.broker.update(conectado=True, erro=None)
    log.info("Broker Kafka conectado (%s); %d tópicos existentes", config["bootstrap.servers"], len(existing))
    missing = [
        NewTopic(topic, num_partitions=1, replication_factor=replication, config={"cleanup.policy": "compact"})
        for topic in TOPICS if topic not in existing
    ]
    if TOPICO_HEARTBEAT not in existing:
        # Heartbeat é operacional: não precisa guardar histórico.
        missing.append(NewTopic(TOPICO_HEARTBEAT, num_partitions=1, replication_factor=replication,
                                config={"cleanup.policy": "delete", "retention.ms": "3600000"}))
    if not missing:
        return
    retry = []
    for topic, future in admin.create_topics(missing).items():
        try:
            future.result()
            log.info("Tópico criado: %s", topic)
        except Exception as error:
            if "TOPIC_ALREADY_EXISTS" in str(error):  # outro serviço criou ao mesmo tempo
                continue
            # Planos gratuitos (ex.: Aiven) podem recusar configurações de tópico:
            # tenta de novo só com o padrão do broker.
            log.warning("Tópico %s não criado com configuração própria (%s); tentando com o padrão do broker", topic, error)
            retry.append(NewTopic(topic, num_partitions=1, replication_factor=replication))
    for topic, future in (admin.create_topics(retry).items() if retry else []):
        try:
            future.result()
            log.info("Tópico criado (padrão do broker): %s", topic)
        except Exception as error:
            if "TOPIC_ALREADY_EXISTS" not in str(error):
                log.error("Tópico %s não pôde ser criado: %s. Crie-o no painel do broker.", topic, error)


# --- Produtor: relay do outbox ---------------------------------------------


def _publish_pending(conn, producer, service: str) -> int:
    """Publica os eventos pendentes do outbox e os marca como publicados."""
    with conn.transaction():
        rows = conn.execute(
            "SELECT id, topico, chave, tipo, payload, criado_em, correlacao FROM outbox_eventos"
            " WHERE publicado_em IS NULL ORDER BY id LIMIT 500 FOR UPDATE SKIP LOCKED"
        ).fetchall()
        if not rows:
            return 0
        errors: list = []
        for row in rows:
            value = json.dumps({
                "id_evento": row["id"], "tipo": row["tipo"], "dados": row["payload"],
                "origem": service, "criado_em": row["criado_em"].isoformat(),
                "publicado_em": agora().isoformat(), "correlacao": row["correlacao"],
            }, default=str)
            producer.produce(
                row["topico"], key=row["chave"], value=value.encode(),
                headers={"origem": service, "correlacao": row["correlacao"] or ""},
                on_delivery=lambda err, _msg: err and errors.append(err),
            )
        producer.flush(15)
        if errors:
            raise RuntimeError(f"Falha ao publicar no Kafka: {errors[0]}")
        for row in rows:  # o broker já confirmou a entrega (acks=all)
            token = request_id.set(row["correlacao"] or "-")
            log.info("PUBLICADO %s -> %s (chave=%s, id_evento=%s)", row["tipo"], row["topico"], row["chave"], row["id"])
            ESTADO.registrar("publicados", tipo=row["tipo"], topico=row["topico"], chave=row["chave"], id_evento=row["id"])
            request_id.reset(token)
        conn.execute(
            "UPDATE outbox_eventos SET publicado_em = now() WHERE id = ANY(%s)",
            ([row["id"] for row in rows],),
        )
    return len(rows)


def _relay_loop(service: str, schema: str, config: dict, stop: threading.Event) -> None:
    from confluent_kafka import Producer

    producer = Producer({**config, "enable.idempotence": True, "acks": "all"})
    log.info("Relay do outbox iniciado (LISTEN outbox no schema %s)", schema)
    while not stop.is_set():
        try:
            with connect(schema, autocommit=True) as conn:
                conn.execute("LISTEN outbox")
                while not stop.is_set():
                    while _publish_pending(conn, producer, service):
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
    topics = sorted(handlers_topics(handlers))
    consumer.subscribe(topics)
    log.info("Consumidor iniciado (grupo wellflix-%s) em: %s", service, ", ".join(topics))
    conn = None  # uma conexão reaproveitada entre eventos; refeita se cair
    try:
        while not stop.is_set():
            message = consumer.poll(1.0)
            if message is None:
                continue
            if message.error():
                if message.error().code() != KafkaError._PARTITION_EOF:
                    log.warning("Kafka (%s): %s", service, message.error())
                continue
            token = None
            try:
                event = json.loads(message.value())
                token = request_id.set(event.get("correlacao") or "-")
                handler = handlers.get(event["tipo"])
                if handler:
                    if conn is None or conn.closed:
                        conn = connect(schema)
                    with conn.transaction(), conn.cursor() as cur:
                        handler(cur, event["dados"])
                    origem = event.get("origem", "?")
                    atraso = _atraso_ms(event.get("publicado_em"))
                    log.info("CONSUMIDO %s de %s (%s, id_evento=%s, %s ms após a publicação) -> %s",
                             event["tipo"], origem, message.topic(), event.get("id_evento"), atraso, handler.__name__)
                    ESTADO.registrar("consumidos", tipo=event["tipo"], origem=origem, topico=message.topic(),
                                     id_evento=event.get("id_evento"), atraso_ms=atraso)
                consumer.commit(message=message, asynchronous=False)
            except Exception:
                log.exception("Falha ao processar evento de %s; será reprocessado", message.topic())
                if conn is not None:
                    conn.close()
                    conn = None
                consumer.seek(message)  # volta para reprocessar a mesma mensagem
                stop.wait(5)
            finally:
                if token is not None:
                    request_id.reset(token)
    finally:
        if conn is not None:
            conn.close()
        consumer.close()


def _atraso_ms(iso: str | None) -> int | None:
    if not iso:
        return None
    try:
        return round((agora() - datetime.fromisoformat(iso)).total_seconds() * 1000)
    except ValueError:
        return None


# --- Heartbeat operacional ---------------------------------------------------


def _outbox_pendentes(schema: str) -> int | None:
    try:
        with connect(schema, connect_timeout=5) as conn:
            row = conn.execute(
                "SELECT CASE WHEN to_regclass('outbox_eventos') IS NULL THEN NULL"
                " ELSE (SELECT count(*) FROM outbox_eventos WHERE publicado_em IS NULL) END AS n"
            ).fetchone()
            return row["n"]
    except Exception:
        return None


def _heartbeat_sender(service: str, schema: str, config: dict, stop: threading.Event) -> None:
    from confluent_kafka import Producer

    intervalo = float(os.getenv("HEARTBEAT_INTERVALO_SEGUNDOS", "30"))
    producer = Producer(config)
    while not stop.is_set():
        ESTADO.heartbeat_seq += 1
        batida = {
            "servico": service, "instancia": INSTANCIA, "seq": ESTADO.heartbeat_seq,
            "enviado_em": agora().isoformat(), "outbox_pendentes": _outbox_pendentes(schema),
        }
        errors: list = []
        producer.produce(TOPICO_HEARTBEAT, key=service, value=json.dumps(batida).encode(),
                         on_delivery=lambda err, _msg: err and errors.append(err))
        producer.flush(10)
        if errors:
            ESTADO.broker.update(conectado=False, erro=str(errors[0]))
            log_hb.warning("HEARTBEAT #%d não publicado: %s", batida["seq"], errors[0])
        else:
            ESTADO.broker.update(conectado=True, erro=None)
            log_hb.info("HEARTBEAT enviado #%d -> %s (outbox pendentes: %s)", batida["seq"], TOPICO_HEARTBEAT, batida["outbox_pendentes"])
        stop.wait(intervalo)


def _heartbeat_listener(service: str, config: dict, stop: threading.Event) -> None:
    from confluent_kafka import OFFSET_END, Consumer, TopicPartition

    # Sem consumer group: cada instância lê todos os heartbeats a partir de agora.
    consumer = Consumer({**config, "group.id": f"wellflix-{service}-hb", "enable.auto.commit": False})
    consumer.assign([TopicPartition(TOPICO_HEARTBEAT, 0, OFFSET_END)])
    try:
        while not stop.is_set():
            message = consumer.poll(1.0)
            if message is None or message.error():
                continue
            try:
                batida = json.loads(message.value())
            except ValueError:
                continue
            origem = batida.get("servico")
            if origem == service:
                continue
            atraso = _atraso_ms(batida.get("enviado_em"))
            ESTADO.heartbeats[origem] = {
                "seq": batida.get("seq"), "instancia": batida.get("instancia"),
                "outbox_pendentes": batida.get("outbox_pendentes"), "atraso_ms": atraso, "recebido_em": agora(),
            }
            log_hb.info("HEARTBEAT recebido de %s #%s (atraso %s ms, outbox pendentes: %s)",
                        origem, batida.get("seq"), atraso, batida.get("outbox_pendentes"))
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
        ESTADO.broker.update(configurado=True, servidores=config["bootstrap.servers"])
        schema = resolve_schema(service)
        try:
            ensure_topics(config)
        except Exception as error:
            ESTADO.broker.update(conectado=False, erro=type(error).__name__)
            log.exception("Não foi possível verificar/criar os tópicos do Kafka")
        workers = [(_heartbeat_sender, (service, schema, config, stop), "heartbeat"),
                   (_heartbeat_listener, (service, config, stop), "heartbeat-escuta")]
        if produces:
            workers.append((_relay_loop, (service, schema, config, stop), "relay"))
        if handlers:
            workers.append((_consumer_loop, (service, schema, config, handlers, stop), "consumidor"))
        for target, args, name in workers:
            threading.Thread(target=target, args=args, name=f"{name}-{service}", daemon=True).start()

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
