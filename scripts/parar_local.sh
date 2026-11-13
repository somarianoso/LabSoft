#!/usr/bin/env bash
# Encerra os quatro serviços iniciados por scripts/rodar_local.sh.
# PostgreSQL e Kafka continuam no Docker (docker compose down para parar).
cd "$(dirname "$0")/.."
if [ -f logs/pids ]; then
  xargs -r kill < logs/pids 2>/dev/null || true
  rm -f logs/pids
fi
echo "Serviços encerrados."
