#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd $(dirname ${BASH_SOURCE[0]})/../.. && pwd)
ENV_FILE=${ENV_FILE:-${ROOT_DIR}/.env.production}
COMPOSE_FILE=${COMPOSE_FILE:-${ROOT_DIR}/docker-compose.production.yml}
BACKUP_DIR=${BACKUP_DIR:-${ROOT_DIR}/backups}

[[ -f $ENV_FILE ]] || { echo Missing $ENV_FILE >&2; exit 1; }

set -a
source $ENV_FILE
set +a

: ${POSTGRES_DB:?POSTGRES_DB is required}
: ${POSTGRES_USER:?POSTGRES_USER is required}

mkdir -p $BACKUP_DIR
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_file=${BACKUP_DIR}/purrfect-match-${timestamp}.dump

docker_cli() {
  if command -v docker.exe >/dev/null 2>&1; then
    docker.exe $@
  elif command -v docker >/dev/null 2>&1; then
    docker $@
  else
    '/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe' $@
  fi
}

docker_cli compose --env-file $ENV_FILE -f $COMPOSE_FILE exec -T postgres pg_dump --format=custom --no-owner --no-privileges --username $POSTGRES_USER $POSTGRES_DB > $backup_file

sha256sum $backup_file > ${backup_file}.sha256
echo Backup created: $backup_file
