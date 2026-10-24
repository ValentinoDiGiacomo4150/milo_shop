import os
from flask import Flask, redirect, render_template, request, url_for

# Obtenemos la ruta exacta donde está guardado este archivo main.py
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Configuramos Flask con rutas absolutas infalibles
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static')
)
app.secret_key = os.environ.get('SECRET_KEY', 'milo_mayne_secret_key_2026')

@app.route('/')
def inicio():
    return render_template('shop/index.html')

@app.route('/productos')
def productos():
    """ Catálogo general de productos (productos.html) """
    return render_template('shop/productos.html')


@app.route('/producto')
def detalle_producto():
    """ Detalle individual del producto (producto.html) """
    return render_template('shop/producto.html')


@app.route('/quien-soy')
def quien_soy():
    """ Página 'Quién soy?' (quien_soy.html) """
    return render_template('shop/quien_soy.html')


@app.route('/que-puedo-hacer')
def habilidades():
    """ Página 'Qué puedo hacer / Mis Habilidades' (habilidades.html) """
    return render_template('shop/habilidades.html')


@app.route('/contacto')
def contacto():
    """ Página de Contacto (contacto.html) """
    return render_template('shop/contacto.html')


@app.route('/carrito')
def carrito():
    """ Carrito de Compras (carrito.html) """
    return render_template('shop/carrito.html')


@app.route('/cuenta')
@app.route('/login')
def cuenta():
    """ Formulario de inicio de sesión y registro (usuario.html) """
    return render_template('shop/usuario.html')


# -------------------------------------------------------------
# RUTAS PARA MANEJAR FORMULARIOS (LOGIN Y REGISTRO)
# -------------------------------------------------------------

@app.route('/login', methods=['POST'])
def procesar_login():
    usuario = request.form.get('usuario')
    clave = request.form.get('clave')
    print(f"Intento de login para el usuario: {usuario} con clave: {clave}")
    return redirect(url_for('inicio'))


@app.route('/registro', methods=['POST'])
def procesar_registro():
    usuario = request.form.get('usuario')
    correo = request.form.get('correo')
    clave = request.form.get('clave')
    print(f"Registro exitoso para: {usuario} ({correo}) con clave: {clave}")
    return redirect(url_for('cuenta'))


# -------------------------------------------------------------
# CONTROL DE ERRORES
# -------------------------------------------------------------

@app.errorhandler(404)
def pagina_no_encontrada(e):
    return redirect(url_for('inicio'))


if __name__ == '__main__':
    app.run(debug=True, port=5000)