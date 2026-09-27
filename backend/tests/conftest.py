import os
import secrets

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User

os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql://postgres@localhost:5432/pillsync_test",
    ),
)

os.environ.setdefault(
    "TEST_USER_PASSWORD",
    secrets.token_urlsafe(24),
)


def reset_test_user_password(username: str) -> None:
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.username == username).first()

        if user:
            user.hashed_password = hash_password(os.environ["TEST_USER_PASSWORD"])
            db.commit()
    finally:
        db.close()
