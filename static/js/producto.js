const urlParams = new URLSearchParams(location.search);
let idParam = urlParams.get('id') || '';
let id = idParam.trim().toLowerCase();

// Diagnóstico en consola para ver qué está llegando
console.log("ID recibido en la URL:", id);
console.log("Claves disponibles en PRODUCTOS:", Object.keys(PRODUCTOS));

let producto = PRODUCTOS[id];

// MAPA DE COMPATIBILIDAD por si llegan IDs numéricos antiguos de la BD
const mapaLegacy = { '1': 'fresco-m', '2': 'seco-s' };
if (!producto && mapaLegacy[id]) {
    id = mapaLegacy[id];
    producto = PRODUCTOS[id];
}

// RESPALDO DE EMERGENCIA: Si sigue sin encontrarse, tomamos el primer producto disponible para que no rompa la vista
if (!producto) {
    const keys = Object.keys(PRODUCTOS);
    if (keys.length > 0) {
        id = keys[0];
        producto = PRODUCTOS[id];
        console.warn("Aviso: ID no exacto. Cargando producto por defecto:", id);
    }
}

const $ = sel => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', () => {
    const contenedorPP = $('.pp');
    if (!producto) {
        if (contenedorPP) {
            contenedorPP.innerHTML = '<p>Producto no encontrado. <a href="/productos">Volver a productos</a></p>';
        }
        return;
    }

    const tituloEl = $('#titulo');
    if (tituloEl) tituloEl.textContent = producto.nombre;
    document.title = `${producto.nombre} | Milo Mayne`;

    if (producto.whatsapp) {
        iniciarWhatsapp();
    } else {
        iniciarCompra();
    }
});

/* ---------- Productos por WhatsApp ---------- */
function iniciarWhatsapp() {
    const formCompra = $('#form-compra');
    const precioEl = $('#precio');
    const bloqueWhatsapp = $('#bloque-whatsapp');
    const detallesEl = $('#detalles');
    const btnWhatsapp = $('#btn-whatsapp');

    if (formCompra) formCompra.hidden = true;
    if (precioEl) {
        precioEl.textContent = producto.precio
            ? 'Desde $' + producto.precio.toLocaleString('es-AR')
            : 'Precio a consultar';
    }
    if (bloqueWhatsapp) bloqueWhatsapp.hidden = false;
    if (detallesEl) {
        detallesEl.innerHTML = `
            <p>Consultá disponibilidad y presupuesto con el florista.</p>
            <p class="pp-nota">${NOTA_GENERAL}</p>
        `;
    }

    const mensaje = `¡Hola Milo! Consulto por el ${producto.nombre}. Mi nombre es: `;
    if (btnWhatsapp) {
        btnWhatsapp.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
    }
}

/* ---------- Productos con carrito ---------- */
function iniciarCompra() {
    const claves = Object.keys(producto.variantes || {});
    let claveActual = claves.length > 0 ? claves[0] : 'unica';

    const contenedorColores = $('#colores');
    if (contenedorColores && producto.colores) {
        contenedorColores.innerHTML = producto.colores.map(c => `
            <label class="pp-color">
                <input type="checkbox" name="color" value="${c}"> ${c}
            </label>
        `).join('');
    }

    const bloqueCalidad = $('#bloque-calidad');
    const contenedorCalidades = $('#calidades');
    if (claves.length > 1 && bloqueCalidad && contenedorCalidades) {
        bloqueCalidad.hidden = false;
        contenedorCalidades.innerHTML = claves.map((k, i) => `
            <label class="pp-calidad">
                <input type="radio" name="calidad" value="${k}" ${i === 0 ? 'checked' : ''}>
                <span>${producto.variantes[k].etiqueta}</span>
            </label>
        `).join('');
    }

    function mostrarVariante() {
        const v = producto.variantes[claveActual] || { precio: 0, intro: '', flores: [] };
        const precioEl = $('#precio');
        const detallesEl = $('#detalles');
        if (precioEl) precioEl.textContent = '$' + (v.precio ? v.precio.toLocaleString('es-AR') : '0');
        if (detallesEl) {
            detallesEl.innerHTML = `
                <p>${v.intro || ''}</p>
                <ul>${(v.flores || []).map(f => `<li>${f}</li>`).join('')}</ul>
                <p><strong>Importante:</strong> la variedad puede cambiar según la disponibilidad.</p>
                <p class="pp-nota">${NOTA_GENERAL}</p>
            `;
        }
    }

    function validar() {
        const checksColor = document.querySelectorAll('input[name="color"]:checked');
        const btnAgregar = $('#btn-agregar');
        const avisoColor = $('#aviso-color');

        const requiereColor = producto.colores && producto.colores.length > 0;
        const hayColor = !requiereColor || checksColor.length > 0;

        if (btnAgregar) btnAgregar.disabled = !hayColor;
        if (avisoColor) avisoColor.hidden = hayColor;
    }

    document.querySelectorAll('input[name="calidad"]').forEach(r => {
        r.addEventListener('change', () => {
            claveActual = r.value;
            mostrarVariante();
        });
    });

    if (contenedorColores) {
        contenedorColores.addEventListener('change', validar);
    }

    const btnMenos = $('#menos');
    const btnMas = $('#mas');
    const inputCantidad = $('#cantidad');

    if (btnMenos && inputCantidad) {
        btnMenos.onclick = () => { inputCantidad.value = Math.max(1, Number(inputCantidad.value) - 1); };
    }
    if (btnMas && inputCantidad) {
        btnMas.onclick = () => { inputCantidad.value = Number(inputCantidad.value) + 1; };
    }

    const formCompra = $('#form-compra');
    if (formCompra) {
        formCompra.addEventListener('submit', () => {
            let inputProductoId = $('#input-producto-id');
            if (!inputProductoId) {
                inputProductoId = document.createElement('input');
                inputProductoId.type = 'hidden';
                inputProductoId.name = 'producto_id';
                inputProductoId.id = 'input-producto-id';
                formCompra.appendChild(inputProductoId);
            }
            inputProductoId.value = id;

            let inputVariante = $('#input-variante');
            if (!inputVariante) {
                inputVariante = document.createElement('input');
                inputVariante.type = 'hidden';
                inputVariante.name = 'variante';
                inputVariante.id = 'input-variante';
                formCompra.appendChild(inputVariante);
            }
            inputVariante.value = claveActual;
        });
    }

    mostrarVariante();
    validar();
}