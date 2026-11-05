(() => {
    const USUARIOS_KEY = 'milomayne_usuarios';
    const SESION_KEY = 'milomayne_sesion';

    const leerUsuarios = () => {
        try { return JSON.parse(localStorage.getItem(USUARIOS_KEY)) || []; }
        catch { return []; }
    };
    const guardarUsuarios = (lista) =>
        localStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));

    async function hash(texto) {
        const datos = new TextEncoder().encode(texto);
        const buf = await crypto.subtle.digest('SHA-256', datos);
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function obtenerSesion() {
        try {
            return JSON.parse(sessionStorage.getItem(SESION_KEY))
                || JSON.parse(localStorage.getItem(SESION_KEY));
        } catch { return null; }
    }

    function guardarSesion(usuario, recordar) {
        const dato = JSON.stringify({ usuario });
        sessionStorage.removeItem(SESION_KEY);
        localStorage.removeItem(SESION_KEY);
        (recordar ? localStorage : sessionStorage).setItem(SESION_KEY, dato);
    }

    function cerrarSesion() {
        sessionStorage.removeItem(SESION_KEY);
        localStorage.removeItem(SESION_KEY);
        window.location.href = '/';
    }

    function mostrarError(form, mensaje) {
        let caja = form.querySelector('.mensaje-error');
        if (!caja) {
            caja = document.createElement('p');
            caja.className = 'mensaje-error';
            form.querySelector('button[type="submit"]').before(caja);
        }
        caja.textContent = mensaje;
    }

    function mostrarNombreEnHeader() {
        const sesion = obtenerSesion();
        const iconos = document.querySelector('.iconos');
        if (!sesion || !iconos) return;

        const enlaceCuenta = iconos.querySelector('a[href="/cuenta"]');
        if (!enlaceCuenta) return;

        const nombre = document.createElement('span');
        nombre.className = 'nombre-usuario';
        nombre.textContent = sesion.usuario;

        const salir = document.createElement('button');
        salir.type = 'button';
        salir.className = 'btn-salir';
        salir.textContent = 'Salir';
        salir.addEventListener('click', cerrarSesion);

        enlaceCuenta.after(nombre, salir);
    }

   
    function iniciarLogin() {
        const form = document.querySelector('form[action="/login"]');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const entrada = form.usuario.value.trim().toLowerCase();
            const clave = await hash(form.clave.value);

            const encontrado = leerUsuarios().find(u =>
                (u.usuario.toLowerCase() === entrada || u.correo.toLowerCase() === entrada)
                && u.clave === clave
            );

            if (!encontrado) {
                mostrarError(form, 'Usuario o contraseña incorrectos.');
                return;
            }

            guardarSesion(encontrado.usuario, form.recordar.checked);
            window.location.href = '/'; // inicio
        });
    }

   
    function iniciarRegistro() {
        const form = document.querySelector('form[action="/registro"]');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usuario = form.usuario.value.trim();
            const correo = form.correo.value.trim();
            const clave = form.clave.value;

            if (clave.length < 6) {
                mostrarError(form, 'La contraseña debe tener al menos 6 caracteres.');
                return;
            }

            const usuarios = leerUsuarios();
            const existe = usuarios.some(u =>
                u.usuario.toLowerCase() === usuario.toLowerCase()
                || u.correo.toLowerCase() === correo.toLowerCase()
            );
            if (existe) {
                mostrarError(form, 'Ese usuario o correo ya está registrado.');
                return;
            }

            usuarios.push({ usuario, correo, clave: await hash(clave) });
            guardarUsuarios(usuarios);

            guardarSesion(usuario, false); 
            window.location.href = '/';
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        mostrarNombreEnHeader();
        iniciarLogin();
        iniciarRegistro();
    });
})();