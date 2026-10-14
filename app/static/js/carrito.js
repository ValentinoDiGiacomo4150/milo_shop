document.addEventListener('DOMContentLoaded', () => {

    const producto = document.querySelector('.carrito-producto');
    if (!producto) return;

    /* ---------- Datos ---------- */
    const precioUnitario = Number(producto.dataset.precio);
    const adicionalesUnitario = Number(producto.dataset.adicionales);
    let cantidad = 1;
    let vacio = false;

    /* ---------- Elementos ---------- */
    const precioEl = producto.querySelector('.Precio strong') || producto.querySelector('.Precio');
    const cantidadEl = producto.querySelector('.cantidad span');
    const [btnMenos, btnMas] = producto.querySelectorAll('.cantidad button');
    const btnEliminar = producto.querySelector('.eliminar');

    const subtotalEl = document.getElementById('subtotal');
    const adicionalesEl = document.getElementById('adicionales');
    const envioEl = document.getElementById('envio');
    const totalEl = document.getElementById('total');
    const opcionesEnvio = document.querySelectorAll('input[name="envio"]');
    const btnPagar = document.querySelector('.pagar');

    /* ---------- Formato: 30200 -> $30.200 ---------- */
    const formatear = (numero) =>
        '$' + String(numero).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    /* ---------- Actualizar pantalla ---------- */
    function actualizar() {
        const envioElegido = document.querySelector('input[name="envio"]:checked');
        const costoEnvio = vacio || !envioElegido ? 0 : Number(envioElegido.dataset.costo);

        const subtotal = vacio ? 0 : precioUnitario * cantidad;
        const adicionales = vacio ? 0 : adicionalesUnitario * cantidad;
        const total = subtotal + adicionales + costoEnvio;

        if (!vacio) {
            cantidadEl.textContent = cantidad;
            precioEl.textContent = formatear(subtotal);
        }

        subtotalEl.textContent = formatear(subtotal);
        adicionalesEl.textContent = formatear(adicionales);
        envioEl.textContent = formatear(costoEnvio);
        totalEl.textContent = formatear(total);

        btnPagar.disabled = vacio;
    }

    /* ---------- Cantidad ---------- */
    btnMenos.addEventListener('click', () => {
        if (cantidad > 1) {
            cantidad--;
            actualizar();
        }
    });

    btnMas.addEventListener('click', () => {
        if (cantidad < 99) {
            cantidad++;
            actualizar();
        }
    });

    /* ---------- Eliminar producto ---------- */
    btnEliminar.addEventListener('click', () => {
        const contenedor = producto.parentElement;
        producto.remove();

        const mensaje = document.createElement('p');
        mensaje.className = 'carrito-vacio';
        mensaje.textContent = 'Tu carrito está vacío';
        contenedor.appendChild(mensaje);

        vacio = true;
        actualizar();
    });

    /* ---------- Cambiar tipo de envío ---------- */
    opcionesEnvio.forEach((opcion) => {
        opcion.addEventListener('change', actualizar);
    });

    /* ---------- Inicio ---------- */
    actualizar();
});