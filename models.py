from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

# Instancia única de la base de datos para todo el proyecto
db = SQLAlchemy()


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(120), unique=True, nullable=False)
    clave_hash = db.Column(db.String(256), nullable=False)
    es_admin = db.Column(db.Boolean, default=False)

    # Campos para verificación y recuperación de contraseña
    verificado = db.Column(db.Boolean, default=False)
    token_verificacion = db.Column(db.String(100), nullable=True)
    token_recuperacion = db.Column(db.String(100), nullable=True)
    token_expiracion = db.Column(db.DateTime, nullable=True)

    carrito = db.relationship(
        "ItemCarrito", backref="usuario", lazy=True, cascade="all, delete-orphan"
    )
    pedidos = db.relationship("Pedido", backref="usuario", lazy=True)

    def __repr__(self):
        return f"<Usuario {self.nombre}>"


class Producto(db.Model):
    __tablename__ = "productos"

    id = db.Column(db.String(50), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    precio_ars = db.Column(db.Numeric(10, 2), nullable=False)
    precio_usd = db.Column(db.Numeric(10, 2), nullable=False)
    stock = db.Column(db.Integer, default=0)
    activo = db.Column(db.Boolean, default=True)
    imagen = db.Column(db.String(255), nullable=True)  # <-- Añadido

    def __repr__(self):
        return f"<Producto {self.nombre}>"


class ItemCarrito(db.Model):
    __tablename__ = "items_carrito"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    producto_id = db.Column(
        db.String(50), db.ForeignKey("productos.id"), nullable=False
    )
    cantidad = db.Column(db.Integer, nullable=False, default=1)

    # --- MEJORAS NUEVAS (Conservando lo anterior) ---
    variante = db.Column(db.String(50), default="unica")  # Ej: estacion, premium, etc.
    color = db.Column(db.String(150), nullable=True)       # Almacena los colores elegidos
    dedicatoria = db.Column(db.Text, nullable=True)        # Almacena la carta de dedicación

    producto = db.relationship("Producto")


class Pedido(db.Model):
    __tablename__ = "pedidos"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    estado = db.Column(db.String(50), default="Pendiente")

    total_ars = db.Column(db.Numeric(10, 2), nullable=False)
    total_usd = db.Column(db.Numeric(10, 2), nullable=False)

    codigo_postal = db.Column(db.String(10), nullable=False)
    direccion_envio = db.Column(db.String(255), nullable=False)
    metodo_envio = db.Column(db.String(50), nullable=False)
    metodo_pago = db.Column(db.String(50), nullable=False)

    detalles = db.relationship(
        "DetallePedido", backref="pedido", lazy=True, cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Pedido #{self.id} Usuario ID: {self.usuario_id}>"


class DetallePedido(db.Model):
    __tablename__ = "detalles_pedido"

    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id"), nullable=False)

    # CORREGIDO: Coincide con Producto.id en String(50)
    producto_id = db.Column(
        db.String(50), db.ForeignKey("productos.id"), nullable=False
    )

    cantidad = db.Column(db.Integer, nullable=False)

    precio_unitario_ars = db.Column(db.Numeric(10, 2), nullable=False)
    precio_unitario_usd = db.Column(db.Numeric(10, 2), nullable=False)

    producto = db.relationship("Producto")

    def __repr__(self):
        return f"<DetallePedido Pedido:{self.pedido_id} Prod:{self.producto_id}>"


class CorreoPrueba(db.Model):
    __tablename__ = "correos_prueba"

    id = db.Column(db.Integer, primary_key=True)
    correo_destino = db.Column(db.String(120), nullable=False)
    asunto = db.Column(db.String(200), nullable=False)
    cuerpo = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(300), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<CorreoPrueba Para:{self.correo_destino}>"


class Color(db.Model):
    __tablename__ = "colores"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)

class ConfiguracionInicio(db.Model):
    __tablename__ = 'configuracion_inicio'
    id = db.Column(db.Integer, primary_key=True)
    banner = db.Column(db.String(255), default='images/imagenes-main/promo-flores-amarillas.png')
    mostrar_banner = db.Column(db.Boolean, default=True)
    eleccion_1 = db.Column(db.String(50), db.ForeignKey('productos.id'), nullable=True)
    eleccion_2 = db.Column(db.String(50), db.ForeignKey('productos.id'), nullable=True)
    eleccion_3 = db.Column(db.String(50), db.ForeignKey('productos.id'), nullable=True)