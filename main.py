import os
import secrets
from datetime import UTC, datetime, timedelta

import mercadopago
import requests
from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_mail import Mail, Message
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash

# Asegurate de importar Color desde tu archivo de modelos (ej: from models import Color, Producto)
from admin import admin_bp
from models import ConfiguracionInicio, CorreoPrueba, ItemCarrito, Producto, Usuario, db

# Obtenemos la ruta exacta donde está guardado este archivo main.py
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Configuramos Flask con rutas absolutas infalibles
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
)
app.secret_key = os.environ.get("SECRET_KEY", "milo_mayne_secret_key_2026")

# -------------------------------------------------------------
# CONFIGURACIÓN DE LA BASE DE DATOS SQLITE
# -------------------------------------------------------------
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
    BASE_DIR, "milo_shop.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# -------------------------------------------------------------
# CONFIGURACIÓN DE MERCADO PAGO
# -------------------------------------------------------------

sdk = mercadopago.SDK("APP_USR-815321926402690-110522-b1756261a7e18aa00706e3d21027d890-2968362013")

# -------------------------------------------------------------
# CONFIGURACIÓN DE CORREO ARGENTINO
# -------------------------------------------------------------

# -------------------------------------------------------------
# CONFIGURACIÓN DE FLASK-MAIL (SMTP REAL BREVO)
# -------------------------------------------------------------
app.config["MAIL_SERVER"] = "smtp-relay.brevo.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USE_SSL"] = False
app.config["MAIL_USERNAME"] = "c17884001@smtp-brevo.com"
app.config["MAIL_PASSWORD"] = (
    "xsmtpsib-a49ee5446542d7bbadef8e459823cef0613734438683a6774049b63233e46852-cQ1SQSsacARx2mn5"
)
app.config["MAIL_DEFAULT_SENDER"] = ("Milo Mayne", "digikpo@hotmail.com")

mail = Mail(app)


# -------------------------------------------------------------
# RUTAS DE PÁGINAS GENERALES
# -------------------------------------------------------------
@app.route("/")
def inicio():
    config = ConfiguracionInicio.query.get(1)

    # Recolectamos los productos elegidos en una lista limpia
    elecciones = []
    if config:
        for prod_id in [config.eleccion_1, config.eleccion_2, config.eleccion_3]:
            if prod_id:
                prod = Producto.query.get(prod_id)
                if prod:
                    elecciones.append(prod)

    return render_template(
        "shop/index.html",
        config=config,
        elecciones=elecciones,
    )


@app.route("/productos")
def productos():
    """Catálogo general de productos (productos.html)"""
    productos_activos = Producto.query.filter_by(activo=True).all()
    return render_template("shop/productos.html", productos=productos_activos)


@app.route("/producto")
def detalle_producto():
    """Detalle individual del producto (producto.html)"""
    producto_id = request.args.get("id")
    producto = None
    if producto_id:
        if producto_id.isdigit():
            producto = Producto.query.get(int(producto_id))
        else:
            producto = Producto.query.filter_by(id=producto_id).first()

    cart_count = len(session.get("carrito", []))
    return render_template(
        "shop/producto.html", producto=producto, cart_count=cart_count
    )


@app.route("/quien-soy")
def quien_soy():
    """Página 'Quién soy?' (quien_soy.html)"""
    return render_template("shop/quien_soy.html")


@app.route("/que-puedo-hacer")
def habilidades():
    """Página 'Qué puedo hacer / Mis Habilidades' (habilidades.html)"""
    return render_template("shop/habilidades.html")


@app.route("/contacto")
def contacto():
    """Página de Contacto (contacto.html)"""
    return render_template("shop/contacto.html")


# -------------------------------------------------------------
# FUNCIÓN AUXILIAR: ENVÍO VÍA API HTTP DE BREVO
# -------------------------------------------------------------
def enviar_correo_api_brevo(destinatario, nombre, link_activacion):
    """Envía correos electrónicos directamente mediante la API REST de Brevo.

    Evita bloqueos de puertos SMTP (587/465) y restricciones de IP en entornos
    locales.
    """
    url = "https://api.brevo.com/v3/smtp/email"

    api_key = "xsmtpsib-a49ee5446542d7bbadef8e459823cef0613734438683a6774049b63233e46852-cQ1SQSsacARx2mn5"

    headers = {
        "accept": "application/json",
        "api-key": api_key.strip(),
        "content-type": "application/json",
    }

    payload = {
        "sender": {"name": "Milo Mayne", "email": "digikpo@hotmail.com"},
        "to": [{"email": destinatario}],
        "subject": "¡Bienvenido a Milo Mayne! Activá tu cuenta",
        "htmlContent": f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <h2 style="color: #2c3e50;">¡Hola {nombre}! Gracias por registrarte en Milo Mayne.</h2>
                <p>Para activar tu cuenta y comenzar a comprar, hacé clic en el siguiente botón:</p>
                <p style="margin: 20px 0;">
                    <a href="{link_activacion}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Validar mi cuenta
                    </a>
                </p>
                <p style="font-size: 12px; color: #7f8c8d;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>{link_activacion}</p>
            </div>
        """,
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in [200, 201]:
            print(f"¡Correo enviado exitosamente a {destinatario} por API Brevo!")
            return True
        else:
            print(f"Error de la API de Brevo ({response.status_code}): {response.text}")
            return False
    except Exception as e:  # noqa: BLE001
        print(f"Excepción al conectar con la API de Brevo: {e}")
        return False


# -------------------------------------------------------------
# RUTAS DE AUTENTICACIÓN Y APIS DE SESIÓN
# -------------------------------------------------------------
@app.route("/hacerse-admin/<path:correo>")
def hacerse_admin_por_correo(correo):
    # Búsqueda insensible a mayúsculas/minúsculas
    usuario = Usuario.query.filter(Usuario.correo.ilike(correo.strip())).first()

    if usuario:
        usuario.es_admin = True
        db.session.commit()

        if session.get("user_id") == usuario.id:
            session["es_admin"] = True

        return f"¡Éxito total! El usuario <strong>{usuario.nombre}</strong> ({correo}) ahora es Administrador. Ya podés entrar a <a href='/admin/'>/admin/</a>"

    return (
        f"No se encontró ningún usuario registrado con el correo: <b>{correo}</b>",
        404,
    )


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json() if request.is_json else request.form

    identificador = (
        data.get("usuario")
        or data.get("nombre")
        or data.get("correo")
        or data.get("username")
        or data.get("email")
        or data.get("login")
        or ""
    ).strip()

    clave = data.get("clave") or data.get("password") or ""

    if not identificador or not clave:
        return jsonify({"success": False, "message": "Faltan datos obligatorios."}), 400

    usuario = Usuario.query.filter(
        (Usuario.correo.ilike(identificador))
        | (Usuario.nombre.ilike(identificador))
        | (Usuario.nombre.ilike(f"{identificador}_%"))
    ).first()

    if not usuario:
        return jsonify(
            {
                "success": False,
                "message": "Usuario o correo NO Validos.",
            }
        ), 404

    if not check_password_hash(usuario.clave_hash, clave):
        return jsonify({"success": False, "message": "Contraseña incorrecta."}), 401

    if not usuario.verificado:
        return jsonify(
            {
                "success": False,
                "message": "Debes verificar tu correo antes de iniciar sesión.",
            }
        ), 403

    session["user_id"] = usuario.id
    session["user_name"] = usuario.nombre
    session["user_correo"] = usuario.correo
    session["es_admin"] = usuario.es_admin

    return jsonify(
        {"success": True, "message": f"¡Bienvenido a milo, {usuario.nombre}!"}
    )


@app.route("/api/registro", methods=["POST"])
def api_registro():
    data = request.get_json() if request.is_json else request.form
    correo = (data.get("correo") or "").strip()
    nombre = (data.get("usuario") or data.get("nombre") or "").strip()
    clave = data.get("clave")

    if not correo or not clave:
        return (
            jsonify({"success": False, "message": "Faltan datos obligatorios."}),
            400,
        )

    if not nombre:
        nombre = correo.split("@")[0] if "@" in correo else "Cliente"

    if Usuario.query.filter(Usuario.correo.ilike(correo)).first():
        return (
            jsonify({"success": False, "message": "El correo ya está registrado."}),
            400,
        )

    nombre_base = nombre
    contador = 1
    while Usuario.query.filter(Usuario.nombre.ilike(nombre)).first():
        nombre = f"{nombre_base}_{contador}"
        contador += 1

    token_val = secrets.token_hex(32)
    nuevo_usuario = Usuario(
        nombre=nombre,
        correo=correo,
        clave_hash=generate_password_hash(clave),
        verificado=False,
        token_verificacion=token_val,
    )
    db.session.add(nuevo_usuario)
    db.session.commit()

    link_activacion = url_for("activar_cuenta", token=token_val, _external=True)

    try:
        msg = Message(
            subject="¡Bienvenido a Milo Mayne! Activá tu cuenta",
            recipients=[correo],
        )
        msg.html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <h2 style="color: #2c3e50;">¡Hola {nombre}! Gracias por registrarte en Milo Mayne.</h2>
                <p>Para activar tu cuenta y comenzar a comprar, hacé clic en el siguiente botón:</p>
                <p style="margin: 20px 0;">
                    <a href="{link_activacion}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Validar mi cuenta
                    </a>
                </p>
                <p style="font-size: 12px; color: #7f8c8d;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>{link_activacion}</p>
            </div>
        """
        mail.send(msg)
        print(f"¡Correo enviado con éxito vía SMTP a {correo}!")
    except Exception as e:  # noqa: BLE001
        print(f"Error enviando correo SMTP (Guardando en bandeja de prueba): {e}")
        correo_prueba = CorreoPrueba(
            correo_destino=correo,
            asunto="¡Bienvenido a Milo Mayne! Activá tu cuenta",
            cuerpo=f"Hola {nombre}, hacé clic para activar tu cuenta.",
            link=link_activacion,
        )
        db.session.add(correo_prueba)
        db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Verifique en casilla su correo para validar",
        }
    )


@app.route("/api/debug/usuarios")
def debug_usuarios():
    usuarios = Usuario.query.all()
    return jsonify(
        [
            {
                "id": u.id,
                "nombre": u.nombre,
                "correo": u.correo,
                "verificado": u.verificado,
                "es_admin": u.es_admin,
            }
            for u in usuarios
        ]
    )


@app.route("/activar/<token>")
def activar_cuenta(token):
    usuario = Usuario.query.filter_by(token_verificacion=token).first()
    if not usuario:
        return "Token de activación inválido o expirado.", 400

    usuario.verificado = True
    usuario.token_verificacion = None
    db.session.commit()

    session["user_id"] = usuario.id
    session["user_name"] = usuario.nombre
    session["user_correo"] = usuario.correo
    session["es_admin"] = usuario.es_admin

    return redirect(url_for("cuenta"))


@app.route("/api/sesion-actual")
def sesion_actual():
    if "user_id" in session:
        usuario = db.session.get(Usuario, session["user_id"])
        if usuario:
            return jsonify(
                {
                    "autenticado": True,
                    "nombre": usuario.nombre,
                    "correo": usuario.correo,
                    "es_admin": usuario.es_admin,
                }
            )
    return jsonify({"autenticado": False})


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/cuenta")
@app.route("/login")
def cuenta():
    return render_template("shop/usuario.html")


# -------------------------------------------------------------
# FLUJO DE RECUPERACIÓN DE CONTRASEÑA
# -------------------------------------------------------------
@app.route("/api/recuperar-password", methods=["POST"])
def api_recuperar_password():
    data = request.get_json() if request.is_json else request.form
    correo = data.get("correo")

    usuario = Usuario.query.filter_by(correo=correo).first()
    if not usuario:
        return jsonify(
            {
                "success": True,
                "message": "ERROR: El correo no está registrado por favor considere registrarse.",
            }
        )

    token = secrets.token_hex(32)
    usuario.token_recuperacion = token
    usuario.token_expiracion = datetime.now(UTC) + timedelta(minutes=30)
    db.session.commit()

    link_recuperacion = f"http://127.0.0.1:5000/restablecer/{token}"

    try:
        msg = Message(
            subject="Recuperación de contraseña — Milo Mayne",
            recipients=[usuario.correo],
        )
        msg.html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <h2 style="color: #2c3e50;">Milo Mayne</h2>
                <p>Hola <strong>{usuario.nombre}</strong>,</p>
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                <p style="margin: 20px 0;">
                    <a href="{link_recuperacion}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Restablecer Contraseña
                    </a>
                </p>
                <p style="font-size: 0.85em; color: #7f8c8d;">El enlace expirará en 30 minutos.</p>
            </div>
        """
        mail.send(msg)

        return jsonify(
            {
                "success": True,
                "message": "¡Te enviamos un correo con las instrucciones a tu casilla!",
            }
        )
    except Exception as e:  # noqa: BLE001
        print(f"Error al enviar correo SMTP: {e}")
        return jsonify(
            {
                "success": False,
                "message": "No se pudo enviar el correo. Por favor intentá más tarde.",
            }
        ), 500


@app.route("/api/restablecer/<token>", methods=["POST"])
def api_restablecer_password(token):
    usuario = Usuario.query.filter_by(token_recuperacion=token).first()

    # CORREGIDO: Uso de UTC directamente sin datetime.UTC
    if (
        not usuario
        or not usuario.token_expiracion
        or usuario.token_expiracion < datetime.now(UTC).replace(tzinfo=None)
    ):
        return jsonify(
            {"success": False, "message": "El enlace es inválido o ha expirado."}
        ), 400

    data = request.get_json() if request.is_json else request.form
    nueva_clave = data.get("clave")

    if not nueva_clave or len(nueva_clave) < 6:
        return jsonify(
            {
                "success": False,
                "message": "La contraseña debe tener al menos 6 caracteres.",
            }
        ), 400

    usuario.clave_hash = generate_password_hash(nueva_clave)
    usuario.token_recuperacion = None
    usuario.token_expiracion = None
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "¡Contraseña actualizada con éxito! Ya podés iniciar sesión.",
        }
    )


@app.route("/restablecer/<token>")
def vista_restablecer(token):
    usuario = Usuario.query.filter_by(token_recuperacion=token).first()

    if not usuario:
        return "El enlace de recuperación es inválido.", 400

    # CORREGIDO: Uso de UTC directamente
    usuario.token_expiracion = datetime.now(UTC) + timedelta(minutes=30)
    db.session.commit()

    return render_template("shop/restablecer.html", token=token)


@app.route("/api/mis-correos", methods=["GET"])
def api_mis_correos():
    correos = CorreoPrueba.query.order_by(CorreoPrueba.fecha.desc()).all()
    lista = [
        {
            "id": c.id,
            "correo": c.correo_destino,
            "asunto": c.asunto,
            "cuerpo": c.cuerpo,
            "link": c.link,
            "fecha": c.fecha.strftime("%H:%M:%S"),
        }
        for c in correos
    ]
    return jsonify(lista)


@app.route("/bandeja-prueba")
def vista_bandeja_prueba():
    return render_template("shop/bandeja_prueba.html")


@app.route("/api/limpiar-correos", methods=["POST"])
def api_limpiar_correos():
    CorreoPrueba.query.delete()
    db.session.commit()
    return jsonify({"success": True, "message": "Bandeja de prueba vaciada."})


# -------------------------------------------------------------
# GESTIÓN DEL CARRITO DE COMPRAS
# -------------------------------------------------------------
@app.route("/carrito")
def carrito():
    if "user_id" not in session:
        return redirect(url_for("cuenta"))

    usuario_id = session["user_id"]
    items_db = ItemCarrito.query.filter_by(usuario_id=usuario_id).all()

    items_carrito = []
    total_general = 0.0

    for item in items_db:
        # Relacionamos con la tabla Producto para extraer datos reales y precios
        producto = Producto.query.get(item.producto_id)
        nombre_prod = producto.nombre if producto else "Producto no disponible"

        # Convertimos a float para evitar conflictos de tipos con Decimal
        precio_unitario = (
            float(producto.precio_ars) if producto and producto.precio_ars else 0.0
        )
        imagen_prod = producto.imagen if producto else None

        subtotal = precio_unitario * item.cantidad
        total_general += subtotal

        items_carrito.append(
            {
                "id": item.id,
                "producto_id": item.producto_id,
                "nombre": nombre_prod,
                "variante": getattr(item, "variante", "única"),
                "color": getattr(item, "color", "") or "No especificado",
                "dedicatoria": getattr(item, "dedicatoria", "") or "Sin dedicatoria",
                "cantidad": item.cantidad,
                "precio_unitario": precio_unitario,
                "subtotal": subtotal,
                "imagen": imagen_prod,  # <-- ¡Clave para que la imagen se vea en el carrito!
            }
        )

    # Lista oficial de los 2 puntos de retiro
    puntos_retiro = [
        "Sucursal Centro (Arístides Villanueva 240, Mendoza)",
        "Sucursal Luján de Cuyo (San Martín 1500, Luján de Cuyo)",
    ]

    return render_template(
        "shop/carrito.html",
        items=items_carrito,
        total_general=total_general,
        puntos_retiro=puntos_retiro,
    )


@app.context_processor
def inject_cart_count():
    if "user_id" not in session:
        return {"cart_count": 0}

    usuario_id = session["user_id"]
    total_items = (
        db.session.query(func.sum(ItemCarrito.cantidad))
        .filter_by(usuario_id=usuario_id)
        .scalar()
        or 0
    )
    return {"cart_count": total_items}


@app.route("/carrito/agregar", methods=["POST"])
def agregar_al_carrito():
    if "user_id" not in session:
        return redirect(url_for("cuenta"))

    usuario_id = session["user_id"]
    producto_id = request.form.get("producto_id")
    variante = request.form.get("variante", "única")

    # Capturamos los colores seleccionados (ya sea como lista de checkboxes o texto)
    colores_seleccionados = request.form.getlist("color")
    if not colores_seleccionados:
        color_str = request.form.get("color", "").strip()
    else:
        color_str = ", ".join(colores_seleccionados)

    dedicatoria = request.form.get("dedicatoria", "").strip()

    if not producto_id:
        return redirect(url_for("productos"))

    try:
        cantidad = int(request.form.get("cantidad", 1))
        if cantidad < 1:  # noqa: PLR1730
            cantidad = 1
    except (ValueError, TypeError):
        cantidad = 1

    # Creamos el nuevo ítem con todos los detalles personalizados
    nuevo_item = ItemCarrito(
        usuario_id=usuario_id,
        producto_id=producto_id,
        cantidad=cantidad,
        variante=variante,
        color=color_str,
        dedicatoria=dedicatoria,
    )
    db.session.add(nuevo_item)
    db.session.commit()

    return redirect(url_for("carrito"))


@app.route("/debug/ver-base-datos")
def debug_ver_base_datos():
    if "user_id" not in session:
        return "<h3>No hay sesión activa de usuario. Inicia sesión primero.</h3>"

    usuario_id = session["user_id"]
    items = ItemCarrito.query.filter_by(usuario_id=usuario_id).all()

    html = f"<h2>Diagnóstico de Base de Datos para Usuario ID: {usuario_id}</h2>"
    if not items:
        html += "<p style='color: red;'><b>La base de datos NO tiene ningún producto guardado para este usuario.</b></p>"
    else:
        html += "<table border='1' cellpadding='5'><tr><th>Item ID</th><th>Producto ID</th><th>Variante</th><th>Color</th><th>Dedicatoria</th><th>Cantidad</th></tr>"
        for i in items:
            html += (
                f"<tr><td>{i.id}</td><td>{i.producto_id}</td><td>{getattr(i, 'variante', 'N/A')}</td>"
                f"<td>{getattr(i, 'color', 'N/A')}</td><td>{getattr(i, 'dedicatoria', 'N/A')}</td><td>{i.cantidad}</td></tr>"
            )
        html += "</table>"

    return html


@app.route("/carrito/eliminar/<int:item_id>", methods=["POST"])
def eliminar_del_carrito(item_id):
    if "user_id" not in session:
        return redirect(url_for("cuenta"))

    item = ItemCarrito.query.filter_by(
        id=item_id, usuario_id=session["user_id"]
    ).first_or_404()
    db.session.delete(item)
    db.session.commit()

    return redirect(url_for("carrito"))


@app.route("/carrito/actualizar/<int:item_id>", methods=["POST"])
def actualizar_cantidad_carrito(item_id):
    if "user_id" not in session:
        return redirect(url_for("cuenta"))

    item = ItemCarrito.query.filter_by(
        id=item_id, usuario_id=session["user_id"]
    ).first_or_404()

    try:
        nueva_cantidad = int(request.form.get("cantidad", 1))
    except (ValueError, TypeError):
        nueva_cantidad = 1

    if nueva_cantidad <= 0:
        db.session.delete(item)
    else:
        item.cantidad = nueva_cantidad

    db.session.commit()
    return redirect(url_for("carrito"))


@app.route("/carrito/vaciar", methods=["POST"])
def vaciar_carrito():
    if "user_id" not in session:
        return redirect(url_for("cuenta"))

    ItemCarrito.query.filter_by(usuario_id=session["user_id"]).delete()
    db.session.commit()

    return redirect(url_for("carrito"))

# -------------------------------------------------------------
# CONTROL DE API MERCADO PAGO
# -------------------------------------------------------------
@app.route("/crear-preferencia", methods=["POST"])
def crear_preferencia():
    datos_carrito = request.get_json()

    # Armamos los ítems para Mercado Pago basados en el pedido del usuario
    items_mp = []
    for item in datos_carrito.get("items", []):
        items_mp.append({
            "title": item["nombre"],
            "quantity": int(item["cantidad"]),
            "unit_price": float(item["precio"])
        })

    preference_data = {
        "items": items_mp,
        "back_urls": {
            "success": "http://127.0.0.1:5000/pago/exitoso",
            "failure": "http://127.0.0.1:5000/pago/fallido",
            "pending": "http://127.0.0.1:5000/pago/pendiente"
        },
        "auto_return": "approved",
    }

    # Crear la preferencia en la API de Mercado Pago
    preference_response = sdk.preference().create(preference_data)
    preference = preference_response.get("response")

    if not preference:
        return jsonify({"error": "No se pudo crear la preferencia de pago"}), 400

    # Retornamos el link de pago (init_point) para redirigir al cliente
    return jsonify({
        "init_point": preference["init_point"],
        "preference_id": preference["id"]
    })
@app.route("/pago/exitoso")
def pago_exitoso():
    return "<h1>¡Pago aprobado! Muchas gracias por tu compra en Milo Mayne.</h1><a href='/'>Volver a la tienda</a>"

@app.route("/pago/fallido")
def pago_fallido():
    return "<h1>El pago fue rechazado o cancelado.</h1><a href='/'>Intentar de nuevo</a>"

@app.route("/pago/pendiente")
def pago_pendiente():
    return "<h1>Tu pago está pendiente de acreditación.</h1><a href='/'>Volver a la tienda</a>"
# -------------------------------------------------------------
# CONTROL DE API CORREO ARGENTINO
# -------------------------------------------------------------

@app.route("/api/cotizar-envio", methods=["POST"])
def cotizar_envio():
    data = request.get_json()
    codigo_postal = data.get("codigo_postal", "").strip()

    if not codigo_postal:
        return jsonify({"success": False, "error": "Ingresá un código postal válido."}), 400

    try:
        # Lógica de tarifas de Correo Argentino (ejemplo estándar por zonas)
        # Si el código postal empieza con 5 (ej: Mendoza / Cuyo), se considera envío local/regional.
        # Si empieza con otro número, es nacional.
        if codigo_postal.startswith("5"):
            costo_envio = 4500.0
            zona = "Regional (Cuyo)"
        else:
            costo_envio = 8500.0
            zona = "Nacional (Resto del país)"

        return jsonify({
            "success": True,
            "servicio": "Correo Argentino - Paq. Ar (Clásico)",
            "costo": costo_envio,
            "zona": zona,
            "tiempo_estimado": "3 a 5 días hábiles"
        })
    except Exception as e:  # noqa: BLE001
        return jsonify({"success": False, "error": str(e)}), 500


# -------------------------------------------------------------
# CONTROL DE ERRORES
# -------------------------------------------------------------
@app.errorhandler(404)
def pagina_no_encontrada(e):
    # Si la ruta comienza con /admin/, dejamos que admin.py gestione sus errores
    if request.path.startswith("/admin"):
        return "Página de administración no encontrada", 404
    return redirect(url_for("inicio"))

app.register_blueprint(admin_bp, url_prefix="/admin")

db.init_app(app)

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False) # <--- Agregamos use_reloader=False
