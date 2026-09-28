"""Shared Flask extension instances used by the application factory."""

from typing import Any


import cloudinary
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

cors: CORS = CORS()
db: SQLAlchemy = SQLAlchemy()
migrate: Migrate = Migrate()
jwt: JWTManager = JWTManager()
limiter: Limiter = Limiter(key_func=get_remote_address)


def configure_cloudinary(app: Any) -> Any:
    """Configure Cloudinary credentials from the Flask application settings."""

    cloudinary.config(
        cloud_name=app.config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=app.config.get('CLOUDINARY_API_KEY'),
        api_secret=app.config.get('CLOUDINARY_API_SECRET'),
        secure=True,
    )
