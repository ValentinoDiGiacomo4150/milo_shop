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
        items = JSON.parse(localStorage.getItem('carrito') || '[]');
    } catch (e) {
        items = [];
    }

    const formatear = n => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // evita que lo que escribe el cliente se interprete como HTML
    const esc = t => String(t ?? '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const guardar = () => {
        localStorage.setItem('carrito', JSON.stringify(items));
        if (typeof actualizarContadorCarrito === 'function') {
            actualizarContadorCarrito();   // actualiza el numerito del header
        }
    };

    function htmlItem(it) {
        return `
        <article class="carrito-producto" data-uid="${it.uid}">
            <div class="producto-imagen placeholder"></div>
            <div class="producto-info">
                <h2>${esc(it.nombre)}</h2>
                ${it.calidad ? `<p>${esc(it.calidad)}</p>` : ''}
                ${it.talle ? `<p><strong>Tamaño:</strong> ${esc(it.talle)}</p>` : ''}
                <p><strong>Color:</strong> ${esc(it.colores.join(', '))}</p>
                ${it.dedicatoria ? `<p><strong>Dedicatoria:</strong> ${esc(it.dedicatoria)}</p>` : ''}
                ${it.adicionales ? `<p><strong>Adicionales:</strong> ${esc(it.adicionales)}</p>` : ''}
                <p class="Precio"><strong>${formatear(it.precioUnitario * it.cantidad)}</strong></p>
                <label>Cantidad</label>
                <div class="cantidad">
                    <button data-accion="menos">-</button>
                    <span>${it.cantidad}</span>
                    <button data-accion="mas">+</button>
                </div>
                <button class="eliminar" data-accion="eliminar" aria-label="Eliminar"><i class="bi bi-trash-fill"></i></button>
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

        const subtotal = items.reduce((s, it) => s + it.precioUnitario * it.cantidad, 0);
        const adicionales = items.reduce((s, it) => s + (it.adicionalesPrecio || 0) * it.cantidad, 0);

        subtotalEl.textContent = formatear(subtotal);
        adicionalesEl.textContent = formatear(adicionales);
        envioEl.textContent = formatear(costoEnvio);
        totalEl.textContent = formatear(subtotal + adicionales + costoEnvio);

        btnPagar.disabled = vacio;
    }

    // un solo listener para todos los botones de todas las tarjetas
    lista.addEventListener('click', e => {
        const boton = e.target.closest('[data-accion]');
        if (!boton) return;

        const uid = Number(boton.closest('.carrito-producto').dataset.uid);
        const item = items.find(it => it.uid === uid);
        if (!item) return;

        if (boton.dataset.accion === 'mas' && item.cantidad < 99) item.cantidad++;
        if (boton.dataset.accion === 'menos' && item.cantidad > 1) item.cantidad--;
        if (boton.dataset.accion === 'eliminar') items = items.filter(it => it.uid !== uid);

        guardar();
        render();
    });

    opcionesEnvio.forEach(o => o.addEventListener('change', render));

    if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
            items = [];
            guardar();
            render();
        });
    }

    render();
});