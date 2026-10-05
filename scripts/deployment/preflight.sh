#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd $(dirname ${BASH_SOURCE[0]})/../.. && pwd)
ENV_FILE=${ENV_FILE:-${ROOT_DIR}/.env.production}
COMPOSE_FILE=${COMPOSE_FILE:-${ROOT_DIR}/docker-compose.production.yml}
RUN_TESTS=1

if [[ ${1:-} == --configuration-only ]]; then
  RUN_TESTS=0
elif [[ -n ${1:-} ]]; then
  echo 'Usage: ENV_FILE=.env.production preflight.sh [--configuration-only]' >&2
  exit 2
fi

fail() {
  echo ERROR: $* >&2
  exit 1
}

docker_cli() {
  if command -v docker.exe >/dev/null 2>&1; then
    docker.exe $@
  elif command -v docker >/dev/null 2>&1; then
    docker $@
  elif [[ -x '/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe' ]]; then
    '/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe' $@
  else
    fail 'Docker is not installed.'
  fi
}

docker_cli compose version >/dev/null 2>&1 || fail 'Docker Compose is unavailable.'
[[ -f $ENV_FILE ]] || fail Missing environment file: $ENV_FILE
[[ -f $COMPOSE_FILE ]] || fail Missing Compose file: $COMPOSE_FILE

set -a
source $ENV_FILE
set +a

required_variables=(
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  DATABASE_URL
  JWT_SECRET_KEY
  FRONTEND_URL
  CORS_ORIGINS
  VITE_API_URL
  VITE_SITE_URL
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
)

for variable in ${required_variables[@]}; do
  value=${!variable:-}
  [[ -n $value ]] || fail $variable is missing or empty.

  case $value in
    change-*|replace-*|your-*|*'<'*|*'>'*)
      fail $variable still contains a placeholder value.
      ;;
  esac
done

[[ ${#JWT_SECRET_KEY} -ge 32 ]] || fail 'JWT_SECRET_KEY must contain at least 32 characters.'

echo 'Checking the production Compose configuration...'
docker_cli compose --env-file $ENV_FILE -f $COMPOSE_FILE config --quiet

if [[ $RUN_TESTS -eq 1 ]]; then
  echo 'Running backend tests in the development container...'
  docker_cli compose -f ${ROOT_DIR}/docker-compose.yml exec -T backend pytest app/tests

  echo 'Running frontend checks...'
  docker_cli compose -f ${ROOT_DIR}/docker-compose.yml exec -T frontend npm run lint
  docker_cli compose -f ${ROOT_DIR}/docker-compose.yml exec -T frontend npm run test
  docker_cli compose -f ${ROOT_DIR}/docker-compose.yml exec -T frontend npm run build
fi

echo 'Preflight passed. No deployment was performed.'
