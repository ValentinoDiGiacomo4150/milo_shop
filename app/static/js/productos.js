document.querySelectorAll('.carrusel').forEach(carrusel => {
    const pista = carrusel.querySelector('.carrusel-pista');
    const prev = carrusel.querySelector('.prev');
    const next = carrusel.querySelector('.next');

    if (!prev || !next) return;   // carruseles sin flechas (coronas)

    // cuánto desplazar: el ancho de una tarjeta + el espacio entre tarjetas
    const paso = () => {
        const tarjeta = pista.querySelector('.producto');
        const gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
        return tarjeta.offsetWidth + gap;
    };

    prev.addEventListener('click', () => {
        pista.scrollBy({ left: -paso(), behavior: 'smooth' });
    });

    next.addEventListener('click', () => {
        pista.scrollBy({ left: paso(), behavior: 'smooth' });
    });
});