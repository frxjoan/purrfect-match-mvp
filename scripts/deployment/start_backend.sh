#!/usr/bin/env sh

set -eu

workers=${GUNICORN_WORKERS:-2}
timeout=${GUNICORN_TIMEOUT:-60}
port=${PORT:-5000}

echo 'Applying database migrations...'
flask --app run.py db upgrade

echo 'Starting Gunicorn...'
exec gunicorn --bind 0.0.0.0:${port} --workers ${workers} --timeout ${timeout} --access-logfile - --error-logfile - run:app
