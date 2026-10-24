const id = new URLSearchParams(location.search).get('id');
const producto = PRODUCTOS[id];

const $ = sel => document.querySelector(sel);

if (!producto) {
    $('.pp').innerHTML = '<p>Producto no encontrado. <a href="productos.html">Volver a productos</a></p>';
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

    const mensaje = `Hola! Quiero consultar por: ${producto.nombre}`;
    $('#btn-whatsapp').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

/* ---------- Productos con carrito ---------- */
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

    // Enviar
    $('#form-compra').addEventListener('submit', e => {
        e.preventDefault();
        const v = producto.variantes[claveActual];
        const pedido = {
            id,
            nombre: producto.nombre,
            calidad: v.etiqueta || null,
            colores: [...document.querySelectorAll('input[name="color"]:checked')].map(i => i.value),
            dedicatoria: $('#dedicatoria').value.trim(),
            adicionales: $('#adicionales').value.trim(),
            cantidad: Number($('#cantidad').value),
            precioUnitario: v.precio
        };
        console.log(pedido);   // acá después se guarda en el carrito
    });

    mostrarVariante();
    validar();
}