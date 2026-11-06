import os

from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'clave_fallback_seguridad')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'milo_shop.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False