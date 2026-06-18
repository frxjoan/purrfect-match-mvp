from .admin import admin_bp
from .auth import auth_bp
from .breeders import breeders_bp
from .conversations import conversations_bp
from .health import health_bp
from .listings import listings_bp
from .messages import messages_bp
from .reviews import reviews_bp
from .users import users_bp


def register_blueprints(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(breeders_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(admin_bp)
