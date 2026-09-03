document.addEventListener('DOMContentLoaded', () => {
    cargarRegionesYComunas();
    configurarFormularioRegistro();
    configurarFormularioLogin();
});

// Carga cascada de Región y Comuna leyendo data/regiones.json
async function cargarRegionesYComunas() {
    const selectRegion = document.getElementById('select-region');
    const selectComuna = document.getElementById('select-comuna');

    if (!selectRegion || !selectComuna) return;

    try {
        const res = await fetch('data/regiones.json');
        const regionesData = await res.json();

        selectRegion.innerHTML = '<option value="">Seleccione una región...</option>';
        regionesData.forEach(reg => {
            const opt = document.createElement('option');
            opt.value = reg.region;
            opt.textContent = reg.region;
            selectRegion.appendChild(opt);
        });

        selectRegion.addEventListener('change', (e) => {
            const regionSeleccionada = e.target.value;
            selectComuna.innerHTML = '<option value="">Seleccione una comuna...</option>';
            selectComuna.disabled = !regionSeleccionada;

            const regionEncontrada = regionesData.find(r => r.region === regionSeleccionada);
            if (regionEncontrada) {
                regionEncontrada.comunas.forEach(com => {
                    const opt = document.createElement('option');
                    opt.value = com;
                    opt.textContent = com;
                    selectComuna.appendChild(opt);
                });
            }
        });
    } catch (e) {
        console.error('Error cargando regiones.json:', e);
    }
}

function configurarFormularioRegistro() {
    const form = document.getElementById('form-registro');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const region = document.getElementById('select-region')?.value || '';
        const comuna = document.getElementById('select-comuna')?.value || '';

        // Reglas de Validación Duoc/Profesor/Gmail y Contraseña
        const dominiosPermitidos = ['@duoc.cl', '@profesor.duoc.cl', '@gmail.com'];
        const esDominioValido = dominiosPermitidos.some(d => email.endsWith(d));

        if (!esDominioValido) {
            mostrarMensajeAlert('El correo debe terminar en @duoc.cl, @profesor.duoc.cl o @gmail.com', 'danger');
            return;
        }

        if (password.length < 4 || password.length > 10) {
            mostrarMensajeAlert('La contraseña debe tener entre 4 y 10 caracteres.', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            mostrarMensajeAlert('Las contraseñas no coinciden.', 'danger');
            return;
        }

        const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
        if (usuarios.some(u => u.email === email)) {
            mostrarMensajeAlert('El correo ya está registrado.', 'info');
            return;
        }

        const nuevoUsuario = {
            id: Date.now(),
            nombre,
            email,
            password,
            region,
            comuna,
            rol: 'CLIENTE'
        };

        usuarios.push(nuevoUsuario);
        localStorage.setItem('usuarios_db', JSON.stringify(usuarios));

        mostrarMensajeAlert('¡Cuenta creada con éxito! Redirigiendo al login...', 'success');
        setTimeout(() => window.location.href = 'login.html', 1500);
    });
}

function configurarFormularioLogin() {
    const form = document.getElementById('form-login');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-pass').value;

        // Usuario Administrador por defecto si no existe ninguno
        if (email === 'admin@duoc.cl' && password === 'admin123') {
            const adminUser = { id: 999, nombre: 'Administrador Prostock', email, rol: 'ADMIN' };
            localStorage.setItem('usuarioActivo', JSON.stringify(adminUser));
            window.location.href = 'admin/index.html';
            return;
        }

        const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
        const usuarioValido = usuarios.find(u => u.email === email && u.password === password);

        if (usuarioValido) {
            localStorage.setItem('usuarioActivo', JSON.stringify(usuarioValido));
            window.location.href = usuarioValido.rol === 'ADMIN' ? 'admin/index.html' : 'index.html';
        } else {
            mostrarMensajeAlert('Credenciales inválidas. Inténtalo nuevamente.', 'danger');
        }
    });
}

function mostrarMensajeAlert(msg, tipo) {
    const container = document.getElementById('alert-container');
    if (container) {
        container.innerHTML = `<div class="alert alert-${tipo} alert-dismissible fade show">${msg}</div>`;
    }
}