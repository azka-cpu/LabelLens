from sqlmodel import SQLModel, create_engine, Session
from app.config import get_settings

settings = get_settings()

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG and settings.ENVIRONMENT == "development",
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)


def init_db() -> None:
    from app.models import user, product, scan_history, shopping_list  # noqa

    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
