from flask import Blueprint, render_template

# Creamos el Blueprint para las rutas del cliente
shop_bp = Blueprint("shop", __name__)


@shop_bp.route("/")
@shop_bp.route("/index")
def index():
    return render_template("shop/index.html")


@shop_bp.route("/productos")
def productos():
    return render_template("shop/productos.html")


@shop_bp.route("/producto")
def producto():
    return render_template("shop/producto.html")


@shop_bp.route("/carrito")
def carrito():
    return render_template("shop/carrito.html")


@shop_bp.route("/contacto")
def contacto():
    return render_template("shop/contacto.html")


@shop_bp.route("/cuenta")
def cuenta():
    return render_template("shop/usuario.html")


@shop_bp.route("/quien-soy")
def quien_soy():
    return render_template("shop/quien_soy.html")


@shop_bp.route("/habilidades")
def habilidades():
    return render_template("shop/habilidades.html")
