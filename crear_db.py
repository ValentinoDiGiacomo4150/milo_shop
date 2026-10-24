from app import create_app, db
from app.models import Producto  # noqa: F401

app = create_app()

with app.app_context():
    db.create_all()
    print("¡Tablas creadas correctamente en la base de datos!")