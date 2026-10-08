from config import Config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Inicializamos la instancia de la base de datos
db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Conectamos SQLAlchemy a la app de Flask
    db.init_app(app)

    # Registro de Blueprints (Rutas)
    from app.routes.shop import shop_bp

    app.register_blueprint(shop_bp)

    return app