import os
from flask import Flask
from app.routes.shop import shop_bp

base_dir = os.path.abspath(os.path.dirname(__file__))
app_dir = os.path.join(base_dir, 'app')

app = Flask(
    __name__,
    template_folder=os.path.join(app_dir, 'templates'),
    static_folder=os.path.join(app_dir, 'static')
)

app.register_blueprint(shop_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)