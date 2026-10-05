#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 || ${2:-} != --yes ]]; then
  echo 'Usage: restore_database.sh /absolute/path/to/backup.dump --yes' >&2
  echo 'The --yes flag confirms replacement of the target database contents.' >&2
  exit 2
fi

BACKUP_FILE=$1
[[ $BACKUP_FILE = /* ]] || { echo 'Use an absolute backup path.' >&2; exit 1; }
[[ -f $BACKUP_FILE ]] || { echo Backup not found: $BACKUP_FILE >&2; exit 1; }

ROOT_DIR=$(cd $(dirname ${BASH_SOURCE[0]})/../.. && pwd)
ENV_FILE=${ENV_FILE:-${ROOT_DIR}/.env.production}
COMPOSE_FILE=${COMPOSE_FILE:-${ROOT_DIR}/docker-compose.production.yml}

[[ -f $ENV_FILE ]] || { echo Missing $ENV_FILE >&2; exit 1; }

set -a
source $ENV_FILE
set +a

: ${POSTGRES_DB:?POSTGRES_DB is required}
: ${POSTGRES_USER:?POSTGRES_USER is required}

if [[ -f ${BACKUP_FILE}.sha256 ]]; then
  sha256sum --check ${BACKUP_FILE}.sha256
fi

echo Restoring $POSTGRES_DB from $BACKUP_FILE...
docker_cli() {
  if command -v docker.exe >/dev/null 2>&1; then
    docker.exe $@
  elif command -v docker >/dev/null 2>&1; then
    docker $@
  else
    '/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe' $@
  fi
}

docker_cli compose --env-file $ENV_FILE -f $COMPOSE_FILE exec -T postgres pg_restore --clean --if-exists --no-owner --no-privileges --username $POSTGRES_USER --dbname $POSTGRES_DB < $BACKUP_FILE

echo 'Restore complete. Run the smoke tests before accepting the database.'
