"""Environment-driven configuration classes for Flask, SQLAlchemy, JWT, and Cloudinary."""

from typing import Any


import os

from dotenv import load_dotenv

load_dotenv()


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
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    """Development configuration with debugging enabled."""
    DEBUG = True


class TestingConfig(Config):
    """Testing configuration using the test database URL."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "sqlite:///:memory:",
    )


class ProductionConfig(Config):
    """Production configuration with debugging disabled."""
    DEBUG = False


def get_config() -> type[Config]:
    """Return the configuration class for the current Flask environment."""
    env: str = os.getenv("FLASK_ENV", "development")

    if env == "production":
        return ProductionConfig

    if env == "testing":
        return TestingConfig

    return DevelopmentConfig
