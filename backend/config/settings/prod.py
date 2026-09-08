import os

from .base import *  # noqa: F403

DEBUG = False
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")
