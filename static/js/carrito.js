document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-carrito");
  if (!lista) return;

  const subtotalEl = document.getElementById("subtotal");
  const adicionalesEl = document.getElementById("adicionales");
  const envioEl = document.getElementById("envio");
  const totalEl = document.getElementById("total");
  const opcionesEnvio = document.querySelectorAll('input[name="envio"]');
  const btnPagar = document.querySelector(".pagar");
  const btnVaciar = document.getElementById("vaciar");

  let items = [];
  try {
    items = window.ITEMS_SERVER || [];
  } catch (e) {
    items = [];
  }

  const formatear = (n) =>
    "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const esc = (t) =>
    String(t ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  function htmlItem(it) {
    // Obtenemos los datos del producto (respaldando con lo que viene del servidor o el diccionario local)
    const prodData = (typeof PRODUCTOS !== "undefined"
      ? PRODUCTOS[it.producto_id]
      : null) || { variantes: { unica: { precio: it.precio_unitario || 0 } } };

    // Si el servidor ya mandó el subtotal o precio unitario calculado, lo usamos con prioridad; si no, buscamos en el diccionario
    const precioUnitario =
      it.precio_unitario !== undefined
        ? it.precio_unitario
        : prodData.variantes
          ? Object.values(prodData.variantes)[0].precio
          : 0;
    const subtotalItem =
      it.subtotal !== undefined ? it.subtotal : precioUnitario * it.cantidad;
    const nombreProd = it.nombre || prodData.nombre || it.producto_id;
    const varianteProd = it.variante || "única";
    const colorProd = it.color || "No especificado";
    const dedicatoriaProd = it.dedicatoria || "Sin dedicatoria";

    return `
        <article class="carrito-producto" data-id="${it.id}" style="padding: 15px; border-bottom: 1px solid #eee; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="producto-info" style="width: 100%;">
                <h2 style="margin: 0 0 5px 0; font-size: 1.2em;">${esc(nombreProd)}</h2>
                <p style="margin: 2px 0; font-size: 0.9em; color: #555;"><strong>Variante:</strong> ${esc(varianteProd)}</p>
                <p style="margin: 2px 0; font-size: 0.9em; color: #555;">🎨 <strong>Colores:</strong> ${esc(colorProd)}</p>
                <p style="margin: 2px 0; font-size: 0.9em; color: #555;">✉️ <strong>Dedicatoria:</strong> "${esc(dedicatoriaProd)}"</p>
                <p class="Precio" style="margin: 5px 0; font-weight: bold; color: #27ae60;">Subtotal: <strong>${formatear(subtotalItem)}</strong></p>

                <label style="font-size: 0.85em; display: block; margin-top: 8px;">Cantidad</label>
                <div class="cantidad" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
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

                <form action="/carrito/eliminar/${it.id}" method="POST" style="display:inline; margin-top: 8px; display: block;">
                    <button type="submit" class="eliminar" aria-label="Eliminar" style="cursor: pointer; background: #e74c3c; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.85em;"><i class="bi bi-trash-fill"></i> Eliminar</button>
                </form>
            </div>
        </article>`;
  }

  function render() {
    if (items.length === 0) {
      lista.innerHTML =
        '<p class="carrito-vacio" style="text-align: center; padding: 20px; color: #666;">Tu carrito está vacío</p>';
    } else {
      lista.innerHTML = items.map(htmlItem).join("");
    }

    const envioElegido = document.querySelector('input[name="envio"]:checked');
    const vacio = items.length === 0;
    if (btnVaciar) btnVaciar.hidden = vacio;
    const costoEnvio =
      vacio || !envioElegido ? 0 : Number(envioElegido.dataset.costo);

    // Calculamos el subtotal general de manera robusta combinando servidor y cliente
    const subtotal = items.reduce((s, it) => {
      if (it.subtotal !== undefined) return s + it.subtotal;
      const prodData =
        typeof PRODUCTOS !== "undefined" ? PRODUCTOS[it.producto_id] : null;
      const pUnit =
        prodData && prodData.variantes
          ? Object.values(prodData.variantes)[0].precio
          : it.precio_unitario || 0;
      return s + pUnit * it.cantidad;
    }, 0);

    const adicionales = 0;

    if (subtotalEl) subtotalEl.textContent = formatear(subtotal);
    if (adicionalesEl) adicionalesEl.textContent = formatear(adicionales);
    if (envioEl) envioEl.textContent = formatear(costoEnvio);
    if (totalEl)
      totalEl.textContent = formatear(subtotal + adicionales + costoEnvio);

    if (btnPagar) btnPagar.disabled = vacio;
  }

  opcionesEnvio.forEach((o) => o.addEventListener("change", render));

  if (btnVaciar) {
    btnVaciar.addEventListener("click", (e) => {
      e.preventDefault();
      fetch("/carrito/vaciar", { method: "POST" }).then(() => {
        items = [];
        render();
        if (typeof actualizarContadorCarrito === "function") {
          actualizarContadorCarrito();
        }
        location.reload();
      });
    });
  }
  document.getElementById("btn-pagar").addEventListener("click", async () => {
    try {
      const response = await fetch("/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: "Remera o producto seleccionado",
          cantidad: 1,
          precio: 5000.0, // Reemplaza por el precio real del producto/carrito
        }),
      });

      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point; // Redirige a la pasarela de pago oficial
      } else {
        alert("Hubo un error al iniciar el pago.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
  document.getElementById("btn-cotizar").addEventListener("click", async () => {
    const cp = document.getElementById("codigo-postal").value;
    const resultadoP = document.getElementById("resultado-envio");

    if (!cp) {
      resultadoP.innerText = "Por favor, ingresa un código postal.";
      return;
    }

    try {
      const response = await fetch("/api/cotizar-envio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo_postal: cp }),
      });

      const data = await response.json();

      if (data.success) {
        resultadoP.innerHTML = `<strong>${data.servicio}</strong><br>Costo: $${data.costo.toLocaleString("es-AR")}<br>Demora: ${data.tiempo_estimado}`;

        // Aquí puedes sumar el costo al total general de la compra en el DOM
        // actualizarTotalConEnvio(data.costo);
      } else {
        resultadoP.innerText = data.error || "No se pudo calcular el envío.";
      }
    } catch (error) {
      console.error("Error de red:", error);
      resultadoP.innerText = "Error al conectar con el servidor.";
    }
  });

  render();
});
