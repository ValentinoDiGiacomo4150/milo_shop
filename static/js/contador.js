function actualizarContadorCarrito() {
    const contador = document.querySelector('.contador-carrito');
    if (!contador) return;

    // Respetamos el número inyectado por Flask desde la base de datos
    const total = parseInt(contador.textContent.trim()) || 0;

    contador.textContent = total > 99 ? '99+' : total;
    contador.hidden = total === 0;
}

document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);function actualizarContadorCarrito() {
    const contador = document.querySelector('.contador-carrito');
    if (!contador) return;

    // Respetamos el número inyectado por Flask desde la base de datos
    const total = parseInt(contador.textContent.trim()) || 0;

    contador.textContent = total > 99 ? '99+' : total;
    contador.hidden = total === 0;
}

document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);