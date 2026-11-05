from app import db


class Producto(db.Model):
    __tablename__ = "productos"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    precio_ars = db.Column(db.Numeric(10, 2), nullable=False)
    precio_usd = db.Column(db.Numeric(10, 2), nullable=False)
    stock = db.Column(db.Integer, default=0)
    activo = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f"<Producto {self.nombre}>"