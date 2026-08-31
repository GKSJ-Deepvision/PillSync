#!/bin/sh
# Docker entrypoint for the backend container.
#
# Waits for Postgres to accept connections, applies any pending Alembic
# migrations, then hands off to the container's CMD (uvicorn) via `exec` so
# it becomes PID 1 and receives signals correctly.
set -e

host="${POSTGRES_HOST:-db}"
port="${POSTGRES_PORT:-5432}"

echo "entrypoint: waiting for postgres at ${host}:${port}..."
attempt=0
max_attempts=30
until python -c "import socket; s = socket.create_connection(('${host}', ${port}), timeout=2); s.close()" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ "${attempt}" -ge "${max_attempts}" ]; then
        echo "entrypoint: postgres never became reachable after ${max_attempts} attempts, giving up." >&2
        exit 1
    fi
    sleep 1
done
echo "entrypoint: postgres is reachable."

echo "entrypoint: applying alembic migrations..."
alembic upgrade head

echo "entrypoint: starting: $*"
exec "$@"
