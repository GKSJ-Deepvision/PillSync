import os

import firebase_admin
from firebase_admin import credentials


def initialize_firebase():
    if firebase_admin._apps:
        return firebase_admin.get_app()

    credentials_path = os.environ.get("FIREBASE_CREDENTIALS_PATH")

    if not credentials_path:
        raise RuntimeError(
            "FIREBASE_CREDENTIALS_PATH environment variable is not set."
        )

    cred = credentials.Certificate(credentials_path)

    return firebase_admin.initialize_app(cred)