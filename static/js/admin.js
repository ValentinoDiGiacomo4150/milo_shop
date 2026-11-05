// 1) Pedir confirmación antes de quitar un color
document.querySelectorAll('.admin-color-fila form').forEach(form => {
    form.addEventListener('submit', e => {
        const nombre = form.closest('.admin-color-fila').querySelector('span').textContent;
        if (!confirm(`¿Quitar el color "${nombre}"?`)) e.preventDefault();
    });
});

// 2) Mostrar la foto o el banner elegido antes de guardar
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', () => {
        const archivo = input.files[0];
        if (!archivo) return;

        const url = URL.createObjectURL(archivo);
        const bloque = input.closest('.admin-bloque');
        const banner = bloque.querySelector('.admin-banner-actual');
        const foto = bloque.querySelector('.admin-foto');

        if (banner) {
            banner.src = url;
        } else if (foto) {
            foto.innerHTML = `<img src="${url}" alt="Vista previa">`;
        }
    });
});

// 3) Los interruptores de la lista se guardan solos al tocarlos
document.querySelectorAll('[data-autoenviar]').forEach(check => {
    check.addEventListener('change', () => check.form.submit());
});

// 4) Filtrar pedidos por estado
const filtros = document.querySelectorAll('.admin-filtro');
filtros.forEach(boton => {
    boton.addEventListener('click', () => {
        filtros.forEach(b => b.classList.toggle('activo', b === boton));
        const estado = boton.dataset.filtro;
        let visibles = 0;
        document.querySelectorAll('.admin-pedido').forEach(p => {
            const ver = estado === 'todos' || p.dataset.estado === estado;
            p.hidden = !ver;
            if (ver) visibles++;
        });
        const vacio = document.querySelector('.admin-vacio');
        if (vacio) vacio.hidden = visibles > 0;
    });
});