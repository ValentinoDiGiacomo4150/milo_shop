document.addEventListener('DOMContentLoaded', async () => {

    // -------------------------------------------------------------
    // 1. VERIFICAR SESIÓN ACTUAL (Para el Header, Punto Verde y Menú)
    // -------------------------------------------------------------
    try {
        const res = await fetch('/api/sesion-actual');
        const data = await res.json();

        const puntoVerde = document.getElementById('punto-verde');
        const dropdown = document.getElementById('dropdown-cuenta');
        const iconoLink = document.getElementById('icono-cuenta-link');

        if (data.autenticado) {
            if (puntoVerde) puntoVerde.style.display = 'block';

            const elNombre = document.getElementById('dropdown-nombre');
            const elCorreo = document.getElementById('dropdown-correo');

            if (elNombre) elNombre.textContent = `Hola "${data.nombre}"`;
            if (elCorreo) elCorreo.textContent = data.correo;

            if (iconoLink && dropdown) {
                iconoLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                });
            }

            const btnCerrar = document.getElementById('btn-cerrar-sesion');
            if (btnCerrar) {
                btnCerrar.addEventListener('click', async () => {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/';
                });
            }
        }
    } catch (e) {
        console.error("Error al verificar la sesión:", e);
    }

    // -------------------------------------------------------------
    // 2. INTERCEPTAR FORMULARIO DE LOGIN
    // -------------------------------------------------------------
    const formLogin = document.querySelector('form[action="/login"]');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que recargue la página de forma tradicional
            const formData = new FormData(formLogin);

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    body: formData
                });
                const resultado = await response.json();

                let caja = formLogin.querySelector('.mensaje-aviso');
                if (!caja) {
                    caja = document.createElement('div');
                    caja.className = 'mensaje-aviso';
                    const btnSubmit = formLogin.querySelector('button[type="submit"]');
                    if (btnSubmit) btnSubmit.before(caja);
                }

                if (response.ok && resultado.success) {
                    caja.style.color = '#155724';
                    caja.style.background = '#d4edda';
                    caja.style.padding = '10px';
                    caja.style.marginBottom = '10px';
                    caja.style.borderRadius = '5px';
                    caja.textContent = resultado.message;

                    // Redirigir al inicio después de 1 segundo para ver la sesión activa
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    // Mantiene el aviso de error visible en pantalla
                    caja.style.color = '#721c24';
                    caja.style.background = '#f8d7da';
                    caja.style.padding = '10px';
                    caja.style.marginBottom = '10px';
                    caja.style.borderRadius = '5px';
                    caja.textContent = resultado.message || 'Error al iniciar sesión.';

                    // Borra automáticamente el campo de contraseña por seguridad y comodidad
                    const inputClave = formLogin.querySelector('input[type="password"]');
                    if (inputClave) {
                        inputClave.value = '';
                        inputClave.focus(); // Coloca el cursor listo para escribir de nuevo
                    }
                }
            } catch (err) {
                console.error("Error en petición de login:", err);
            }
        });
    }

    // -------------------------------------------------------------
    // 3. INTERCEPTAR FORMULARIO DE REGISTRO
    // -------------------------------------------------------------
    const formReg = document.querySelector('form[action="/registro"]');
    if (formReg) {
        formReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formReg);

            try {
                const response = await fetch('/api/registro', {
                    method: 'POST',
                    body: formData
                });
                const resultado = await response.json();

                let caja = formReg.querySelector('.mensaje-aviso');
                if (!caja) {
                    caja = document.createElement('div');
                    caja.className = 'mensaje-aviso';
                    const btnSubmit = formReg.querySelector('button[type="submit"]');
                    if (btnSubmit) btnSubmit.before(caja);
                }

                if (response.ok && resultado.success) {
                    caja.style.color = '#155724';
                    caja.style.background = '#d4edda';
                    caja.style.padding = '10px';
                    caja.style.marginBottom = '10px';
                    caja.style.borderRadius = '5px';
                    caja.textContent = resultado.message;
                    formReg.reset();
                } else {
                    caja.style.color = '#721c24';
                    caja.style.background = '#f8d7da';
                    caja.style.padding = '10px';
                    caja.style.marginBottom = '10px';
                    caja.style.borderRadius = '5px';
                    caja.textContent = resultado.message || 'Error en el registro.';
                }
            } catch (err) {
                console.error("Error en petición de registro:", err);
            }
        });
    }

    // -------------------------------------------------------------
    // 4. LÓGICA PARA MOSTRAR / OCULTAR CONTRASEÑA (OJO INTERACTIVO)
    // -------------------------------------------------------------
    function configurarOjoPassword(idInput, idBoton) {
        const input = document.getElementById(idInput);
        const boton = document.getElementById(idBoton);

        if (!input || !boton) return;

        // SVG Ojo Abierto (Muestra la contraseña)
        const svgAbierto = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>`;

        // SVG Ojo Cerrado / Tachado (Oculta la contraseña)
        const svgCerrado = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>`;

        boton.addEventListener('click', () => {
            const esPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', esPassword ? 'text' : 'password');
            // Si estaba en password, al pasar a text mostramos el SVG abierto (para volver a ocultar)
            boton.innerHTML = esPassword ? svgAbierto : svgCerrado;
        });
    }

    // Inicializar para los campos de login y registro de forma segura
    configurarOjoPassword('login-clave', 'toggle-login-clave');
    configurarOjoPassword('registro-clave', 'toggle-registro-clave');
});