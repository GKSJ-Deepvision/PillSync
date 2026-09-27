import os
import secrets

import pytest

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

os.environ.setdefault(
    "TEST_CAREGIVER_PASSWORD",
    secrets.token_urlsafe(24),
)

os.environ.setdefault(
    "TEST_ADMIN_PASSWORD",
    secrets.token_urlsafe(24),
)


def seed_test_users() -> None:
    db = SessionLocal()

    users = [
        (
            "vaishnavi",
            "vaishnavi@example.com",
            "patient",
            os.environ["TEST_USER_PASSWORD"],
        ),
        (
            "caregiver_test",
            "caregiver@test.com",
            "caregiver",
            os.environ["TEST_CAREGIVER_PASSWORD"],
        ),
        (
            "admin_test",
            "admin@test.com",
            "admin",
            os.environ["TEST_ADMIN_PASSWORD"],
        ),
    ]

    try:
        for username, email, role, password in users:
            user = db.query(User).filter(User.username == username).first()

            if user is None:
                user = User(
                    username=username,
                    email=email,
                    hashed_password=hash_password(password),
                    role=role,
                    is_active=True,
                )
                db.add(user)
            else:
                user.email = email
                user.hashed_password = hash_password(password)
                user.role = role
                user.is_active = True

        db.commit()
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def initialize_test_users():
    seed_test_users()


def reset_test_user_password(username: str) -> None:
    password_map = {
        "vaishnavi": os.environ["TEST_USER_PASSWORD"],
        "caregiver_test": os.environ["TEST_CAREGIVER_PASSWORD"],
        "admin_test": os.environ["TEST_ADMIN_PASSWORD"],
    }

    password = password_map.get(username, os.environ["TEST_USER_PASSWORD"])

    db = SessionLocal()

    try:
        user = db.query(User).filter(User.username == username).first()

        if user:
            user.hashed_password = hash_password(password)
            db.commit()
    finally:
        db.close()
