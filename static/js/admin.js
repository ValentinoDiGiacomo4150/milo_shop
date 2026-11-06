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
document.querySelectorAll('input[data-autoenviar]').forEach(check => {
    check.addEventListener('change', () => check.form.submit());
});