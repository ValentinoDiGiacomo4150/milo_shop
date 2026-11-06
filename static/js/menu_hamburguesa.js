/* Menú desplegable (hamburguesa) para tablets y celulares.
   Para cambiar desde qué ancho aparece, cambiar ANCHO_MAXIMO. */
(() => {
    const ANCHO_MAXIMO = 900;

    const estilos = `
    .btn-hamburguesa { display: none; }

    @media (max-width: ${ANCHO_MAXIMO}px) {
        .encabezado {
            grid-template-columns: auto 1fr;
            gap: 16px;
            padding-left: 20px;
            padding-right: 20px;
        }

        .btn-hamburguesa {
            display: inline-flex;
            flex-direction: column;
            justify-content: center;
            gap: 5px;
            width: 40px;
            height: 40px;
            padding: 0 8px;
            border: none;
            background: none;
            cursor: pointer;
        }

        .btn-hamburguesa span {
            display: block;
            height: 2px;
            background-color: #000;
            border-radius: 2px;
            transition: transform .2s, opacity .2s;
        }

        .btn-hamburguesa[aria-expanded="true"] span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .btn-hamburguesa[aria-expanded="true"] span:nth-child(2) { opacity: 0; }
        .btn-hamburguesa[aria-expanded="true"] span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* el menú se esconde y baja como lista debajo del header */
        .encabezado .menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            flex-direction: column;
            gap: 0;
            padding: 8px 20px 16px;
            background-color: var(--rosa-claro);
            border-top: 1px solid rgba(0, 0, 0, 0.12);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
            font-size: 18px;
        }

        .encabezado .menu.abierto { display: flex; }

        .encabezado .menu a {
            padding: 12px 4px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .encabezado .menu a:last-child { border-bottom: none; }
    }`;

    document.addEventListener('DOMContentLoaded', () => {
        const encabezado = document.querySelector('.encabezado');
        const menu = encabezado && encabezado.querySelector('.menu');
        if (!menu) return;

        // en el admin el header no tiene íconos: se crea el contenedor para el botón
        let iconos = encabezado.querySelector('.iconos');
        if (!iconos) {
            iconos = document.createElement('div');
            iconos.className = 'iconos';
            encabezado.appendChild(iconos);
        }

        const hoja = document.createElement('style');
        hoja.textContent = estilos;
        document.head.appendChild(hoja);

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn-hamburguesa';
        boton.setAttribute('aria-label', 'Abrir menú');
        boton.setAttribute('aria-expanded', 'false');
        boton.innerHTML = '<span></span><span></span><span></span>';
        iconos.appendChild(boton);

        const cambiar = (abrir) => {
            menu.classList.toggle('abierto', abrir);
            boton.setAttribute('aria-expanded', String(abrir));
            boton.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
        };

        boton.addEventListener('click', () => cambiar(!menu.classList.contains('abierto')));
        menu.addEventListener('click', (e) => { if (e.target.closest('a')) cambiar(false); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cambiar(false); });
        window.addEventListener('resize', () => { if (window.innerWidth > ANCHO_MAXIMO) cambiar(false); });
    });
})();