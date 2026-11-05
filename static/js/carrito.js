document.addEventListener('DOMContentLoaded', () => {
    const lista = document.getElementById('lista-carrito');
    if (!lista) return;

    const subtotalEl = document.getElementById('subtotal');
    const adicionalesEl = document.getElementById('adicionales');
    const envioEl = document.getElementById('envio');
    const totalEl = document.getElementById('total');
    const opcionesEnvio = document.querySelectorAll('input[name="envio"]');
    const btnPagar = document.querySelector('.pagar');
    const btnVaciar = document.getElementById('vaciar');

    let items = [];
    try {
        items = window.ITEMS_SERVER || [];
    } catch (e) {
        items = [];
    }

    const formatear = n => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    const esc = t => String(t ?? '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function htmlItem(it) {
        const prodData = PRODUCTOS[it.producto_id] || { nombre: it.producto_id, variantes: { unica: { precio: 0 } } };
        const precioUnitario = prodData.variantes ? Object.values(prodData.variantes)[0].precio : 0;
        const nombreProd = prodData.nombre || it.producto_id;

        return `
        <article class="carrito-producto" data-id="${it.id}">
            <div class="producto-imagen placeholder"></div>
            <div class="producto-info">
                <h2>${esc(nombreProd)}</h2>
                <p class="Precio"><strong>${formatear(precioUnitario * it.cantidad)}</strong></p>
                <label>Cantidad</label>
                <div class="cantidad" style="display: flex; align-items: center; gap: 8px;">
                    <form action="/carrito/actualizar/${it.id}" method="POST" style="display:inline;">
                        <input type="hidden" name="cantidad" value="${it.cantidad - 1}">
                        <button type="submit" style="padding: 2px 8px; cursor: pointer;">-</button>
                    </form>
                    <span>${it.cantidad}</span>
                    <form action="/carrito/actualizar/${it.id}" method="POST" style="display:inline;">
                        <input type="hidden" name="cantidad" value="${it.cantidad + 1}">
                        <button type="submit" style="padding: 2px 8px; cursor: pointer;">+</button>
                    </form>
                </div>
                <form action="/carrito/eliminar/${it.id}" method="POST" style="display:inline; margin-top: 5px;">
                    <button type="submit" class="eliminar" aria-label="Eliminar" style="cursor: pointer;"><i class="bi bi-trash-fill"></i></button>
                </form>
            </div>
        </article>`;
    }

    function render() {
        if (items.length === 0) {
            lista.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío</p>';
        } else {
            lista.innerHTML = items.map(htmlItem).join('');
        }

        const envioElegido = document.querySelector('input[name="envio"]:checked');
        const vacio = items.length === 0;
        if (btnVaciar) btnVaciar.hidden = vacio;
        const costoEnvio = vacio || !envioElegido ? 0 : Number(envioElegido.dataset.costo);

        const subtotal = items.reduce((s, it) => {
            const prodData = PRODUCTOS[it.producto_id];
            const pUnit = prodData && prodData.variantes ? Object.values(prodData.variantes)[0].precio : 0;
            return s + pUnit * it.cantidad;
        }, 0);

        const adicionales = 0;

        subtotalEl.textContent = formatear(subtotal);
        adicionalesEl.textContent = formatear(adicionales);
        envioEl.textContent = formatear(costoEnvio);
        totalEl.textContent = formatear(subtotal + adicionales + costoEnvio);

        if (btnPagar) btnPagar.disabled = vacio;
    }

    opcionesEnvio.forEach(o => o.addEventListener('change', render));

    if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
            fetch('/carrito/vaciar', { method: 'POST' })
                .then(() => {
                    items = [];
                    render();
                    if (typeof actualizarContadorCarrito === 'function') {
                        actualizarContadorCarrito();
                    }
                    location.reload();
                });
        });
    }

    render();
});