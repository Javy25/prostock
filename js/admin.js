document.addEventListener('DOMContentLoaded', async () => {
    if (!verificarRolAdmin()) return;
    await asegurarProductosIniciales();

    if (document.getElementById('tabla-admin-productos')) {
        listarProductosAdmin();
    }
    if (document.getElementById('form-producto-admin')) {
        configurarFormularioProducto();
    }
    if (document.getElementById('tabla-admin-usuarios')) {
        listarUsuariosAdmin();
    }
    if (document.getElementById('form-usuario-admin')) {
        configurarFormularioUsuario();
    }
    if (document.getElementById('tabla-admin-mensajes')) {
        listarMensajesAdmin();
    }
});

function verificarRolAdmin() {
    const activo = JSON.parse(localStorage.getItem('usuarioActivo'));
    // En caso de estar en una subcarpeta como /admin/
    if (!activo || activo.rol !== 'ADMIN') {
        alert('Acceso restringido solo para Administradores.');
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

async function asegurarProductosIniciales() {
    if (localStorage.getItem('productos_db')) return;

    try {
        const respuesta = await fetch('../data/productos.json');
        if (!respuesta.ok) throw new Error('No se pudieron cargar los productos iniciales.');
        localStorage.setItem('productos_db', JSON.stringify(await respuesta.json()));
    } catch (error) {
        console.error(error);
    }
}

function escaparHTML(valor) {
    const elemento = document.createElement('div');
    elemento.textContent = String(valor ?? '');
    return elemento.innerHTML;
}

    function calcularPrecioConIva(precioNeto) {
        return Math.round(Number(precioNeto) * 1.19);
    }

// 1. Mantenedor de Productos (admin/productos-listar.html)
function listarProductosAdmin() {
    const tbody = document.getElementById('tabla-admin-productos');
    const productos = (JSON.parse(localStorage.getItem('productos_db')) || [])
        .sort((productoA, productoB) => Number(productoA.id) - Number(productoB.id));
    tbody.innerHTML = '';

    productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escaparHTML(p.codigo)}</td>
            <td>${escaparHTML(p.nombre)}</td>
            <td>${escaparHTML(p.categoria)}</td>
                <td>$${calcularPrecioConIva(p.precio).toLocaleString('es-CL')} <small>IVA incl.</small></td>
            <td>${p.stock}</td>
            <td>
                <a href="producto-form.html?id=${p.id}" class="btn btn-sm btn-warning"><i class="bi bi-pencil"></i></a>
                <button onclick="eliminarProductoAdmin(${p.id})" class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarProductoAdmin(id) {
    if (!confirm('¿Seguro de eliminar este producto?')) return;
    let productos = JSON.parse(localStorage.getItem('productos_db')) || [];
    productos = productos.filter(p => p.id !== id);
    localStorage.setItem('productos_db', JSON.stringify(productos));
    listarProductosAdmin();
}

// 2. Formulario Crear/Editar Producto (admin/producto-form.html)
function configurarFormularioProducto() {
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('id');
    let productos = JSON.parse(localStorage.getItem('productos_db')) || [];

    if (prodId) {
        const prod = productos.find(p => p.id == prodId);
        if (prod) {
            document.getElementById('prod-codigo').value = prod.codigo;
            document.getElementById('prod-nombre').value = prod.nombre;
            document.getElementById('prod-categoria').value = prod.categoria;
            document.getElementById('prod-precio').value = prod.precio;
            document.getElementById('prod-stock').value = prod.stock;
            document.getElementById('prod-imagenes').value = prod.imagenes?.join('\n') || prod.imagen || '';
        }
    }

    document.getElementById('form-producto-admin').addEventListener('submit', (e) => {
        e.preventDefault();
        const codigo = document.getElementById('prod-codigo').value.trim().toUpperCase();
        const nombre = document.getElementById('prod-nombre').value.trim();
        const precio = Number(document.getElementById('prod-precio').value);
        const stock = Number(document.getElementById('prod-stock').value);
        const imagenes = document.getElementById('prod-imagenes').value.split('\n').map(imagen => imagen.trim()).filter(Boolean);

        if (!codigo || !nombre || precio <= 0 || stock < 0) {
            alert('Ingresa código y nombre, un precio mayor a cero y un stock válido.');
            return;
        }
        if (productos.some(producto => producto.codigo.toUpperCase() === codigo && producto.id != prodId)) {
            alert('Ya existe un producto con ese código.');
            return;
        }
        if (!imagenes.length) {
            alert('Debes ingresar al menos una imagen.');
            return;
        }
        
        const nuevoProd = {
            id: prodId ? Number(prodId) : Date.now(),
            codigo,
            nombre,
            categoria: document.getElementById('prod-categoria').value,
            precio,
            stock,
            imagenes
        };

        nuevoProd.imagen = nuevoProd.imagenes[0] || 'https://via.placeholder.com/150';

        if (prodId) {
            const index = productos.findIndex(p => p.id == prodId);
            productos[index] = nuevoProd;
        } else {
            productos.push(nuevoProd);
        }

        localStorage.setItem('productos_db', JSON.stringify(productos));
        window.location.href = 'productos-listar.html';
    });
}

// 3. Mantenedor de Usuarios (admin/usuarios-listar.html)
function listarUsuariosAdmin() {
    const tbody = document.getElementById('tabla-admin-usuarios');
    const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
    tbody.innerHTML = '';

    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escaparHTML(u.nombre)}</td>
            <td>${escaparHTML(u.email)}</td>
            <td><span class="badge ${u.rol === 'ADMIN' ? 'bg-danger' : 'bg-secondary'}">${escaparHTML(u.rol)}</span></td>
            <td>
                <a href="usuario-form.html?id=${u.id}" class="btn btn-sm btn-warning"><i class="bi bi-pencil"></i></a>
                <button onclick="eliminarUsuarioAdmin(${u.id})" class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarUsuarioAdmin(id) {
    const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));
    if (usuarioActivo?.id === id) {
        alert('No puedes eliminar la cuenta con la que iniciaste sesión.');
        return;
    }
    if (!confirm('¿Seguro de eliminar este usuario?')) return;
    let usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
    usuarios = usuarios.filter(u => u.id !== id);
    localStorage.setItem('usuarios_db', JSON.stringify(usuarios));
    listarUsuariosAdmin();
}

function configurarFormularioUsuario() {
    const params = new URLSearchParams(window.location.search);
    const usuarioId = params.get('id');
    const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
    const usuarioActual = usuarioId ? usuarios.find(usuario => usuario.id == usuarioId) : null;

    if (usuarioId && !usuarioActual) {
        alert('Usuario no encontrado.');
        window.location.href = 'usuarios-listar.html';
        return;
    }

    if (usuarioActual) {
        document.getElementById('usr-nombre').value = usuarioActual.nombre;
        document.getElementById('usr-email').value = usuarioActual.email;
        document.getElementById('usr-rol').value = usuarioActual.rol;
    }

    document.getElementById('form-usuario-admin').addEventListener('submit', evento => {
        evento.preventDefault();
        const email = document.getElementById('usr-email').value.trim().toLowerCase();
        const password = document.getElementById('usr-password').value;
        const confirmPassword = document.getElementById('usr-confirm-password').value;
        const dominiosPermitidos = ['@duoc.cl', '@profesor.duoc.cl', '@gmail.com'];

        if (!dominiosPermitidos.some(dominio => email.endsWith(dominio))) {
            alert('El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com');
            return;
        }
        if (usuarios.some(usuario => usuario.email === email && usuario.id != usuarioId)) {
            alert('El correo ya está registrado.');
            return;
        }
        if (!usuarioActual && !password) {
            alert('Debes definir una contraseña para el nuevo usuario.');
            return;
        }
        if (password && (password.length < 4 || password.length > 10)) {
            alert('La contraseña debe tener entre 4 y 10 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const nuevoUsuario = {
            ...usuarioActual,
            id: usuarioActual?.id || Date.now(),
            nombre: document.getElementById('usr-nombre').value.trim(),
            email,
            rol: document.getElementById('usr-rol').value,
            ...(password ? { password } : {})
        };
        const indice = usuarios.findIndex(usuario => usuario.id == usuarioId);
        if (indice >= 0) usuarios[indice] = nuevoUsuario;
        else usuarios.push(nuevoUsuario);

        localStorage.setItem('usuarios_db', JSON.stringify(usuarios));
        window.location.href = 'usuarios-listar.html';
    });
}

function listarMensajesAdmin() {
    const tbody = document.getElementById('tabla-admin-mensajes');
    const mensajes = JSON.parse(localStorage.getItem('mensajes_contacto_db')) || [];
    tbody.innerHTML = mensajes.length ? mensajes.map(mensaje => `
        <tr>
            <td>${escaparHTML(mensaje.nombre)}</td>
            <td>${escaparHTML(mensaje.email)}</td>
            <td>${escaparHTML(mensaje.asunto)}</td>
            <td>${escaparHTML(mensaje.mensaje)}</td>
            <td>${escaparHTML(mensaje.fecha)}</td>
            <td><span class="badge ${mensaje.atendido ? 'bg-success' : 'bg-warning text-dark'}">${mensaje.atendido ? 'Atendido' : 'Pendiente'}</span></td>
            <td class="text-nowrap">
                <button type="button" class="btn btn-sm btn-outline-success" onclick="alternarEstadoMensaje(${Number(mensaje.id)})" title="Cambiar estado"><i class="bi bi-check2"></i></button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarMensajeAdmin(${Number(mensaje.id)})" title="Eliminar mensaje"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">No hay mensajes de contacto.</td></tr>';
}

function alternarEstadoMensaje(id) {
    const mensajes = JSON.parse(localStorage.getItem('mensajes_contacto_db')) || [];
    const mensaje = mensajes.find(item => item.id === id);
    if (!mensaje) return;
    mensaje.atendido = !mensaje.atendido;
    localStorage.setItem('mensajes_contacto_db', JSON.stringify(mensajes));
    listarMensajesAdmin();
}

function eliminarMensajeAdmin(id) {
    if (!confirm('¿Seguro de eliminar este mensaje?')) return;
    const mensajes = (JSON.parse(localStorage.getItem('mensajes_contacto_db')) || []).filter(mensaje => mensaje.id !== id);
    localStorage.setItem('mensajes_contacto_db', JSON.stringify(mensajes));
    listarMensajesAdmin();
}