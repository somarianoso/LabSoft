#!/usr/bin/env bash
# Sobe o WellFlix inteiro localmente e grava os logs de cada microsserviço.
#
#   scripts/rodar_local.sh          # infraestrutura + migrations/seed + 4 serviços
#   scripts/parar_local.sh          # encerra os serviços (o Docker continua)
#
# Requisitos: Docker, Python 3.10+ com as dependências de
# backend/services/<servico>/requirements.txt (são as mesmas nos quatro).
# Use PYTHON=/caminho/do/python para escolher o interpretador.
#
# Logs: logs/<servico>.log (um por serviço). Para acompanhar ao vivo:
#   tail -f logs/*.log

set -euo pipefail
cd "$(dirname "$0")/.."

PYTHON="${PYTHON:-python3}"
mkdir -p logs

export DATABASE_URL="${DATABASE_URL:-postgresql://wellflix:wellflix@localhost:5432/wellflix}"
export KAFKA_BOOTSTRAP_SERVERS="${KAFKA_BOOTSTRAP_SERVERS:-localhost:9092}"
export AUTH_TOKEN_SECRET="${AUTH_TOKEN_SECRET:-segredo-local-de-desenvolvimento-wellflix-123456}"
export FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:5173}"
export HEARTBEAT_INTERVALO_SEGUNDOS="${HEARTBEAT_INTERVALO_SEGUNDOS:-10}"

echo "==> Subindo PostgreSQL e Kafka (docker compose)"
docker compose up -d --wait

echo "==> Migrations e dados de demonstração (um schema por serviço)"
"$PYTHON" -m backend.services.shared.migrate todos --seed-demo --confirm-demo-database

declare -A PORTAS=([identidade]=8001 [conta]=8002 [profissionais]=8003 [catalogo]=8004)
: > logs/pids
for servico in identidade conta profissionais catalogo; do
  porta=${PORTAS[$servico]}
  echo "==> Iniciando $servico na porta $porta (logs/$servico.log)"
  "$PYTHON" -m uvicorn "backend.services.$servico.main:app" --port "$porta" --no-access-log \
    > "logs/$servico.log" 2>&1 &
  echo $! >> logs/pids
done

for servico in identidade conta profissionais catalogo; do
  porta=${PORTAS[$servico]}
  for _ in $(seq 1 60); do
    curl -sf "http://localhost:$porta/health" > /dev/null && break
    sleep 0.5
  done
  echo "    $servico: $(curl -s "http://localhost:$porta/health")"
done

echo
echo "Serviços no ar. Próximos passos:"
echo "  $PYTHON scripts/demo_integracao.py   # executa o fluxo entre os serviços"
echo "  tail -f logs/*.log                     # acompanha publicação, consumo, REST e heartbeats"
echo "  curl localhost:8001/status             # estado operacional (troque a porta: 8001 a 8004)"
