from flask import Flask

from . import models
from .config.settings import get_config
from .extensions import (
    db,
    migrate,
    jwt,
    cors,
    configure_cloudinary
)
from .routes import register_blueprints


def create_app(test_config=None):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(get_config())

    # Override config for tests
    if test_config:
        app.config.update(test_config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)

    # External services
    configure_cloudinary(app)

    # Register blueprints
    register_blueprints(app)

    return app
