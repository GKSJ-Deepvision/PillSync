#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

# Install production dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations and collect static files
python manage.py migrate --no-input
python manage.py collectstatic --no-input
