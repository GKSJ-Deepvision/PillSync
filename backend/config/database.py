from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.engine import URL

DATABASE_URL = URL.create(
    "postgresql+psycopg",
    username="postgres",
    password="sonu@7860",
    host="localhost",
    port=5432,
    database="pillsync",
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()