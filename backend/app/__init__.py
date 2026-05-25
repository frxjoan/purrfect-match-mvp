from flask import Flask

from . import models
from .config.settings import get_config
from .extensions import configure_cloudinary, cors, db, jwt, migrate
from .routes import register_blueprints


def create_app(test_config=None):
  app = Flask(__name__)
  app.config.from_object(get_config())

  if test_config:
    app.config.update(test_config)

  configure_cloudinary(app)
  db.init_app(app)
  migrate.init_app(app, db)
  jwt.init_app(app)
  cors.init_app(app, resources={r'/api/*': {'origins': '*'}})
  register_blueprints(app)

  return app
