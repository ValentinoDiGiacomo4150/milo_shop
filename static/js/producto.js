const id = new URLSearchParams(location.search).get('id');
const producto = PRODUCTOS[id];

const $ = sel => document.querySelector(sel);

if (!producto) {
    $('.pp').innerHTML = '<p>Producto no encontrado. <a href="/productos">Volver a productos</a></p>';
} else {
    $('#titulo').textContent = producto.nombre;
    document.title = `${producto.nombre} | Milo Mayne`;

    if (producto.whatsapp) {
        iniciarWhatsapp();
    } else {
        iniciarCompra();
    }
}

/* ---------- Productos por WhatsApp ---------- */
/* ---------- Productos por WhatsApp ---------- */
function iniciarWhatsapp() {
    $('#form-compra').hidden = true;
    $('#precio').textContent = producto.precio
    ? 'Desde $' + producto.precio.toLocaleString('es-AR')
    : 'Precio a consultar';
    $('#bloque-whatsapp').hidden = false;
    $('#detalles').innerHTML = `
        <p>Consultá disponibilidad y presupuesto con el florista.</p>
        <p class="pp-nota">${NOTA_GENERAL}</p>
    `;

    // CAMBIÁS SOLO ESTA LÍNEA CON EL NUEVO TEXTO:
    const mensaje = `¡Hola Milo! Consulto por el ${producto.nombre}. Mi nombre es: `;

    // ESTA LÍNEA DEJALA TAL CUAL ESTÁ:
    $('#btn-whatsapp').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

/* ---------- Productos con carrito (Conectado a Flask / SQLite) ---------- */
function iniciarCompra() {
    const claves = Object.keys(producto.variantes);
    let claveActual = claves[0];

    // Colores (checkboxes: se puede elegir más de uno)
    $('#colores').innerHTML = producto.colores.map(c => `
        <label class="pp-color">
            <input type="checkbox" name="color" value="${c}"> ${c}
        </label>
    `).join('');

    // Calidad (solo si hay más de una variante)
    if (claves.length > 1) {
        $('#bloque-calidad').hidden = false;
        $('#calidades').innerHTML = claves.map((k, i) => `
            <label class="pp-calidad">
                <input type="radio" name="calidad" value="${k}" ${i === 0 ? 'checked' : ''}>
                <span>${producto.variantes[k].etiqueta}</span>
            </label>
        `).join('');
    }

    function mostrarVariante() {
        const v = producto.variantes[claveActual];
        $('#precio').textContent = '$' + v.precio.toLocaleString('es-AR');
        $('#detalles').innerHTML = `
            <p>${v.intro}</p>
            <ul>${v.flores.map(f => `<li>${f}</li>`).join('')}</ul>
            <p><strong>Importante:</strong> la variedad puede cambiar según la disponibilidad.</p>
            <p class="pp-nota">${NOTA_GENERAL}</p>
        `;
    }

    function validar() {
        const hayColor = document.querySelectorAll('input[name="color"]:checked').length > 0;
        $('#btn-agregar').disabled = !hayColor;
        $('#aviso-color').hidden = hayColor;
    }

    // Cambiar calidad → cambia descripción y precio
    document.querySelectorAll('input[name="calidad"]').forEach(r => {
        r.addEventListener('change', () => { claveActual = r.value; mostrarVariante(); });
    });

    // Cambiar colores → habilita o deshabilita el botón
    $('#colores').addEventListener('change', validar);

    // Cantidad
    $('#menos').onclick = () => { const c = $('#cantidad'); c.value = Math.max(1, c.value - 1); };
    $('#mas').onclick   = () => { const c = $('#cantidad'); c.value = Number(c.value) + 1; };

    // Enviar (Inyecta los datos y permite que el formulario viaje por POST al servidor Flask)
    $('#form-compra').addEventListener('submit', e => {
        // No usamos preventDefault para que el formulario se envíe de verdad al servidor.

        // 1. Inyectamos el ID del producto (ej: "fresco-s") para Flask
        let inputProductoId = $('#input-producto-id');
        if (!inputProductoId) {
            inputProductoId = document.createElement('input');
            inputProductoId.type = 'hidden';
            inputProductoId.name = 'producto_id';
            inputProductoId.id = 'input-producto-id';
            $('#form-compra').appendChild(inputProductoId);
        }
        inputProductoId.value = id;

        // 2. Inyectamos la variante seleccionada (ej: "estacion" o "premium")
        let inputVariante = $('#input-variante');
        if (!inputVariante) {
            inputVariante = document.createElement('input');
            inputVariante.type = 'hidden';
            inputVariante.name = 'variante';
            inputVariante.id = 'input-variante';
            $('#form-compra').appendChild(inputVariante);
        }
        inputVariante.value = claveActual;
    });

    mostrarVariante();
    validar();
}