from . import base

globals().update({name: value for name, value in vars(base).items() if not name.startswith("_")})

DEBUG = True
ALLOWED_HOSTS = [*base.ALLOWED_HOSTS, "testserver"]
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
