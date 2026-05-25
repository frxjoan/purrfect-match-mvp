import os


def _database_url():
  database_url = os.getenv('DATABASE_URL')

  if database_url and database_url.startswith('postgres://'):
    return database_url.replace('postgres://', 'postgresql://', 1)

  return database_url


class Config:
  SQLALCHEMY_DATABASE_URI = _database_url()
  SQLALCHEMY_TRACK_MODIFICATIONS = False
  JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
  CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
  CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
  CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
  JSON_SORT_KEYS = False


def get_config():
  return Config
