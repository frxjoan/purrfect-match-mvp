"""Environment-driven configuration classes for Flask, SQLAlchemy, JWT, and Cloudinary."""

from datetime import timedelta
from typing import Any


import os

from dotenv import load_dotenv

load_dotenv()


def _cors_origins() -> tuple[str, ...]:
    """Build a deduplicated CORS allowlist from explicit environment values."""

    configured_origins = os.getenv("CORS_ORIGINS", "").split(",")
    configured_origins.append(os.getenv("FRONTEND_URL", ""))

    return tuple(dict.fromkeys(
        origin.strip()
        for origin in configured_origins
        if origin.strip()
    ))


def _database_url() -> str | None:
    """Build the SQLAlchemy database URL from environment variables."""

    database_url: str | None = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/purrfect_match',
    )

    if database_url and database_url.startswith('postgres://'):
        return database_url.replace('postgres://', 'postgresql://', 1)

    return database_url


class Config:
    """Base configuration shared by all Flask environments."""
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', "change-me")
    JWT_TOKEN_LOCATION = ("headers",)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_CSRF_IN_COOKIES = False
    JWT_CSRF_METHODS = ("POST", "PUT", "PATCH", "DELETE")
    JWT_REFRESH_COOKIE_PATH = "/api/v1/auth"
    JWT_REFRESH_CSRF_COOKIE_PATH = "/"
    JWT_COOKIE_SAMESITE = "Lax"
    JWT_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False
    CORS_ORIGINS = _cors_origins()
    MAX_CONTENT_LENGTH = 42 * 1024 * 1024
    RATELIMIT_ENABLED = True
    RATELIMIT_HEADERS_ENABLED = True
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    SECURITY_HSTS_ENABLED = False
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    """Development configuration with debugging enabled."""
    DEBUG = True
    CORS_ORIGINS = Config.CORS_ORIGINS or (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    )


class TestingConfig(Config):
    """Testing configuration using the test database URL."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "sqlite:///:memory:",
    )
    RATELIMIT_ENABLED = False


class ProductionConfig(Config):
    """Production configuration with debugging disabled."""
    DEBUG = False
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True
    SECURITY_HSTS_ENABLED = True


def get_config() -> type[Config]:
    """Return the configuration class for the current Flask environment."""
    env: str = os.getenv("FLASK_ENV", "development")

    if env == "production":
        return ProductionConfig

    if env == "testing":
        return TestingConfig

    return DevelopmentConfig
