import pytest

from .. import create_app
from ..extensions import db


@pytest.fixture()
def app():
  application = create_app(
    {
      'TESTING': True,
      'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
      'JWT_SECRET_KEY': 'test-secret',
      'CLOUDINARY_CLOUD_NAME': 'demo',
      'CLOUDINARY_API_KEY': 'demo-key',
      'CLOUDINARY_API_SECRET': 'demo-secret',
    }
  )

  with application.app_context():
    db.create_all()

  yield application

  with application.app_context():
    db.session.remove()
    db.drop_all()


@pytest.fixture()
def client(app):
  return app.test_client()
