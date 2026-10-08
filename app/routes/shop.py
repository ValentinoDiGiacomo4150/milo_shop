from flask import Blueprint

# Creamos el Blueprint para las rutas del cliente
shop_bp = Blueprint("shop", __name__)


@shop_bp.route("/")
def index():
    return "<h1>Servidor iniciado correctamente</h1><p>E-commerce en marcha.</p>"