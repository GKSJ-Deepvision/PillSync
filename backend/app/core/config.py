from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PillSync API"
    app_version: str = "0.1.0"
    environment: str = "development"

    database_url: str = (
        "postgresql://username:password@localhost:5432/pillsync"
    )

    jwt_secret_key: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Notification settings
    notification_enabled: bool = False
    notification_default_channel: str = "push"

    fcm_enabled: bool = False
    twilio_enabled: bool = False
    sendgrid_enabled: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()