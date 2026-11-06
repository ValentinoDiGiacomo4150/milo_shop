import os

from flask import (
    Blueprint,
    current_app,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.utils import secure_filename

from models import Color, ConfiguracionInicio, Pedido, Producto, db

# Configuración del Blueprint para el panel de administración
admin_bp = Blueprint("admin_bp", __name__, url_prefix="/admin")

# Carpeta segura para almacenar las imágenes subidas
UPLOAD_FOLDER = "static/images/uploads"


# ==========================================
# 1. SEGURIDAD REAL (Bloqueo de administradores)
# ==========================================
@admin_bp.before_request
def verificar_permisos_admin():
    if not session.get("user_id") or not session.get("es_admin"):
        flash("Acceso denegado. Se requieren permisos de administrador.", "error")
        return redirect(url_for("cuenta"))


# ==========================================
# 2. PANEL PRINCIPAL Y GESTIÓN DE PRODUCTOS
# ==========================================
@admin_bp.route("/")
def dashboard_admin():
    return redirect(url_for("admin_bp.listar_productos"))


@admin_bp.route("/productos")
def listar_productos():
    productos = Producto.query.all()
    return render_template("admin/productos_admin.html", productos=productos)


@admin_bp.route("/producto/nuevo", methods=["GET", "POST"])
@admin_bp.route("/producto/editar/<string:id>", methods=["GET", "POST"])
def editar_producto(id=None):
    producto = Producto.query.get_or_404(id) if id else None
    colores_disponibles = Color.query.all()

    if request.method == "POST":
        nombre = request.form.get("nombre", "").strip()
        precio_ars = request.form.get("precio_ars")
        precio_usd = request.form.get("precio_usd")
        stock = request.form.get("stock")
        descripcion = request.form.get("descripcion", "").strip()
        activo = bool(request.form.get("visible"))

        # CAPTURA CLAVE DE LOS COLORES SELECCIONADOS
        colores_seleccionados = request.form.getlist("colores")
        colores_texto = ", ".join(colores_seleccionados) if colores_seleccionados else ""

        # Procesamiento seguro de la imagen
        imagen_nombre = (
            producto.imagen if producto and hasattr(producto, "imagen") else None
        )
        if "foto" in request.files:
            file = request.files["foto"]
            if file and file.filename != "":
                filename = secure_filename(file.filename)
                upload_path = os.path.join(current_app.root_path, UPLOAD_FOLDER)
                os.makedirs(upload_path, exist_ok=True)
                file.save(os.path.join(upload_path, filename))
                imagen_nombre = f"images/uploads/{filename}"

        if producto:
            producto.nombre = nombre if nombre else producto.nombre
            producto.precio_ars = (
                float(precio_ars) if precio_ars else producto.precio_ars
            )
            producto.precio_usd = (
                float(precio_usd) if precio_usd else producto.precio_usd
            )
            producto.stock = int(stock) if stock else producto.stock
            producto.descripcion = descripcion
            producto.activo = activo
            producto.colores = colores_texto  # <--- GUARDAMOS LOS COLORES AL EDITAR
            if hasattr(producto, "imagen"):
                producto.imagen = imagen_nombre
        else:
            if not nombre:
                flash("El nombre del producto es obligatorio.", "error")
                return render_template(
                    "admin/producto_editar.html",
                    producto=producto,
                    colores_disponibles=colores_disponibles,
                )

            nuevo_id = (
                nombre.lower()
                .replace(" ", "-")
                .replace("á", "a")
                .replace("é", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ú", "u")
            )

            base_id = nuevo_id
            contador = 1
            while Producto.query.get(nuevo_id):
                nuevo_id = f"{base_id}-{contador}"
                contador += 1

            nuevo_prod = Producto(
                id=nuevo_id,
                nombre=nombre,
                descripcion=descripcion,
                precio_ars=float(precio_ars) if precio_ars else 0.0,
                precio_usd=float(precio_usd) if precio_usd else 0.0,
                stock=int(stock) if stock else 0,
                activo=activo,
                imagen=imagen_nombre,
                colores=colores_texto,  # <--- GUARDAMOS LOS COLORES AL CREAR
            )
            db.session.add(nuevo_prod)

        db.session.commit()
        flash("Producto guardado correctamente.", "success")
        return redirect(url_for("admin_bp.listar_productos"))

    return render_template(
        "admin/producto_editar.html",
        producto=producto,
        colores_disponibles=colores_disponibles,
    )


@admin_bp.route("/producto/eliminar/<string:id>", methods=["POST"])
def eliminar_producto(id):
    producto = Producto.query.get_or_404(id)
    db.session.delete(producto)
    db.session.commit()
    flash("Producto eliminado correctamente.", "success")
    return redirect(url_for("admin_bp.listar_productos"))


@admin_bp.route("/producto/toggle/<string:id>", methods=["POST"])
def toggle_producto(id):
    producto = Producto.query.get_or_404(id)
    producto.activo = not producto.activo
    db.session.commit()
    return redirect(url_for("admin_bp.listar_productos"))


# ==========================================
# 3. SEGUIMIENTO DE COMPRAS Y PEDIDOS
# ==========================================
@admin_bp.route("/pedidos", methods=["GET", "POST"])
def gestionar_pedidos():
    if request.method == "POST":
        pedido_id = request.form.get("pedido_id")
        nuevo_estado = request.form.get("estado")

        pedido = Pedido.query.get(pedido_id) if hasattr(Pedido, 'query') else None
        if pedido:
            pedido.estado = nuevo_estado
            db.session.commit()
            flash(f"Estado del pedido #{pedido_id} actualizado.", "success")

        return redirect(url_for("admin_bp.gestionar_pedidos"))

    pedidos = Pedido.query.order_by(Pedido.fecha.desc()).all() if hasattr(Pedido, 'query') else []
    return render_template("admin/pedidos.html", pedidos=pedidos)


# ==========================================
# 4. GESTIÓN DE COLORES
# ==========================================
@admin_bp.route("/colores", methods=["GET", "POST"])
def gestionar_colores():
    if request.method == "POST":
        accion = request.form.get("accion")
        if accion == "agregar":
            nombre_color = request.form.get("nombre", "").strip()
            if nombre_color:
                existe = Color.query.filter_by(nombre=nombre_color).first()
                if not existe:
                    nuevo_color = Color(nombre=nombre_color)
                    db.session.add(nuevo_color)
                    db.session.commit()
                    flash("Color agregado correctamente.", "success")
                else:
                    flash("Ese color ya existe en la lista.", "error")
        elif accion == "quitar":
            color_id = request.form.get("color_id")
            color = Color.query.get(color_id)
            if color:
                db.session.delete(color)
                db.session.commit()
                flash("Color eliminado correctamente.", "success")
        return redirect(url_for("admin_bp.gestionar_colores"))

    colores = Color.query.all()
    return render_template("admin/colores.html", colores=colores)


# ==========================================
# 5. GESTIÓN DE INICIO Y BANNERS
# ==========================================
@admin_bp.route("/inicio", methods=["GET", "POST"])
def gestionar_inicio():
    # Obtenemos o creamos la configuración global de inicio (ID 1)
    config = ConfiguracionInicio.query.get(1)
    if not config:
        config = ConfiguracionInicio(id=1)
        db.session.add(config)
        db.session.commit()

    productos = Producto.query.all()

    if request.method == "POST":
        config.mostrar_banner = bool(request.form.get("mostrar"))
        config.eleccion_1 = request.form.get("eleccion_1") or None
        config.eleccion_2 = request.form.get("eleccion_2") or None
        config.eleccion_3 = request.form.get("eleccion_3") or None

        # Procesar la subida del nuevo banner
        if "banner" in request.files:
            banner_file = request.files["banner"]
            if banner_file and banner_file.filename != "":
                filename = secure_filename(banner_file.filename)
                upload_path = os.path.join(current_app.root_path, UPLOAD_FOLDER)
                os.makedirs(upload_path, exist_ok=True)
                banner_file.save(os.path.join(upload_path, filename))
                config.banner = f"images/uploads/{filename}"

        db.session.commit()
        flash("Cambios de la página de inicio guardados correctamente.", "success")
        return redirect(url_for("admin_bp.gestionar_inicio"))

    return render_template("admin/inicio.html", productos=productos, config=config)