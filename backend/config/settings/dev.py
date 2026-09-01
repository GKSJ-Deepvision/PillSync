from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "pillsync",
        "USER": "pillsync",
        "PASSWORD": "pillsync",
        "HOST": "localhost",
        "PORT": "5432",
    }
}
