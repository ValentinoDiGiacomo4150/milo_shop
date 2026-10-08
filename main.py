import os
from flask import Flask, render_template

base_dir = os.path.abspath(os.path.dirname(__file__))
app_dir = os.path.join(base_dir, 'app')

app = Flask(
    __name__,
    template_folder=os.path.join(app_dir, 'templates'),
    static_folder=os.path.join(app_dir, 'static')
)

@app.route('/')
def home():
    return "Servidor activo. Anda a /quien-soy o /habilidades"

@app.route('/quien-soy')
def quien_soy():
    return render_template('shop/quien_soy.html')

@app.route('/habilidades')
def habilidades():
    return render_template('shop/habilidades.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)