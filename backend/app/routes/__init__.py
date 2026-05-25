from .admin import admin_bp
from .auth import auth_bp
from .breeders import breeders_bp
from .conversations import conversations_bp
from .health import health_bp
from .listings import listings_bp
from .users import users_bp


def register_blueprints(app):
  for blueprint in [
    health_bp,
    auth_bp,
    users_bp,
    breeders_bp,
    listings_bp,
    conversations_bp,
    admin_bp,
  ]:
    app.register_blueprint(blueprint)
