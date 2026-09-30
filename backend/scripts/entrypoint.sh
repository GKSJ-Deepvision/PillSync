#!/bin/sh
# Container entrypoint: get the database ready, then run whatever command was given.
#
#   RUN_MIGRATIONS=true   apply migrations before starting   (web only)
#   SEED_REFERENCE_DATA   load the medicine catalogue if it is empty (web only)
#
# Only the web container should set these. If the worker and beat containers also
# migrated, three processes would race on the same schema change at every deploy.
set -e

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "entrypoint: applying migrations"
    python manage.py migrate --noinput

    if [ "${SEED_REFERENCE_DATA:-true}" = "true" ]; then
        # Idempotent: rows are matched on their natural key and updated in place.
        echo "entrypoint: loading the medicine catalogue"
        python manage.py seed_reference_data
    fi
fi

exec "$@"
