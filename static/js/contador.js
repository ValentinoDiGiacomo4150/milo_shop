function actualizarContadorCarrito() {
    const contador = document.querySelector('.contador-carrito');
    if (!contador) return;

    let items = [];
    try {
        items = JSON.parse(localStorage.getItem('carrito') || '[]');
    } catch (e) {
        items = [];
    }

    const total = items.reduce((suma, it) => suma + it.cantidad, 0);

    contador.textContent = total > 99 ? '99+' : total;
    contador.hidden = total === 0;
}

document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);
window.addEventListener('storage', actualizarContadorCarrito);