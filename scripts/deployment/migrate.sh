#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd $(dirname ${BASH_SOURCE[0]})/../.. && pwd)
ENV_FILE=${ENV_FILE:-${ROOT_DIR}/.env.production}
COMPOSE_FILE=${COMPOSE_FILE:-${ROOT_DIR}/docker-compose.production.yml}

docker_cli() {
  if command -v docker.exe >/dev/null 2>&1; then
    docker.exe $@
  elif command -v docker >/dev/null 2>&1; then
    docker $@
  else
    '/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe' $@
  fi
}

docker_cli compose --env-file $ENV_FILE -f $COMPOSE_FILE run --rm backend flask --app run.py db upgrade
