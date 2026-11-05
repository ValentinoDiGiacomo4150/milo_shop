from flask import Blueprint, redirect, render_template, request, session, url_for

from models import Producto, db

# Creamos el Blueprint para el panel de administración
admin_bp = Blueprint('admin_bp', __name__, url_prefix='/admin')

# Filtro de seguridad: Verifica que el usuario logueado sea administrador
@admin_bp.before_request
def verificar_permisos_admin():
    if not session.get("es_admin"):
        return redirect(url_for('cuenta'))

@admin_bp.route('/')
def dashboard_admin():
    # Redirige por defecto a la sección de productos
    return redirect(url_for('admin_bp.listar_productos'))

@admin_bp.route('/productos')
def listar_productos():
    productos = Producto.query.all()
    return render_template('admin/productos_admin.html', productos=productos)

@admin_bp.route('/producto/nuevo', methods=['GET', 'POST'])
@admin_bp.route('/producto/editar/<int:id>', methods=['GET', 'POST'])
def editar_producto(id=None):
    producto = Producto.query.get_or_404(id) if id else None

    if request.method == 'POST':
        # Recogemos los datos del formulario de flores
        precio_estacion = request.form.get('precio_estacion')
        descripcion_estacion = request.form.get('descripcion_estacion')
        precio_premium = request.form.get('precio_premium')
        descripcion_premium = request.form.get('descripcion_premium')
        activo = bool(request.form.get('visible'))

        # Si tu modelo tiene estos campos, los actualizamos:
        if producto:
            producto.precio_ars = precio_estacion # O el campo de precio que corresponda
            producto.descripcion = descripcion_estacion
            producto.activo = activo
        else:
            # Crear nuevo producto
            nuevo_prod = Producto(
                nombre="Ramo de flores frescas - M",
                descripcion=descripcion_estacion,
                precio_ars=precio_estacion if precio_estacion else 0,
                precio_usd=0,
                stock=10,
                activo=activo
            )
            db.session.add(nuevo_prod)

        db.session.commit()
        return redirect(url_for('admin_bp.listar_productos'))

    return render_template('admin/producto_editar.html', producto=producto)

# --- RUTAS DE COLORES Y BANNER QUE FALTABAN O DABAN 404 ---
@admin_bp.route('/colores')
def gestionar_colores():
    return render_template('admin/colores.html')

@admin_bp.route('/banner')
def gestionar_banner():
    return render_template('admin/banner.html')

@admin_bp.route("/productos")
def listar_productos():
    productos = Producto.query.all()
    return render_template("admin/productos_admin.html", productos=productos)