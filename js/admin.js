document.addEventListener('DOMContentLoaded', () => {
    verificarRolAdmin();

    if (document.getElementById('tabla-admin-productos')) {
        listarProductosAdmin();
    }
    if (document.getElementById('form-producto-admin')) {
        configurarFormularioProducto();
    }
    if (document.getElementById('tabla-admin-usuarios')) {
        listarUsuariosAdmin();
    }
});

function verificarRolAdmin() {
    const activo = JSON.parse(localStorage.getItem('usuarioActivo'));
    // En caso de estar en una subcarpeta como /admin/
    if (!activo || activo.rol !== 'ADMIN') {
        alert('Acceso restringido solo para Administradores.');
        window.location.href = '../login.html';
    }
}

// 1. Mantenedor de Productos (admin/productos-listar.html)
function listarProductosAdmin() {
    const tbody = document.getElementById('tabla-admin-productos');
    const productos = JSON.parse(localStorage.getItem('productos_db')) || [];
    tbody.innerHTML = '';

    productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.codigo}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>$${p.precio.toLocaleString('es-CL')}</td>
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
        
        const nuevoProd = {
            id: prodId ? Number(prodId) : Date.now(),
            codigo: document.getElementById('prod-codigo').value.trim(),
            nombre: document.getElementById('prod-nombre').value.trim(),
            categoria: document.getElementById('prod-categoria').value,
            precio: Number(document.getElementById('prod-precio').value),
            stock: Number(document.getElementById('prod-stock').value),
            imagenes: document.getElementById('prod-imagenes').value.split('\n').map(imagen => imagen.trim()).filter(Boolean)
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
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td><span class="badge ${u.rol === 'ADMIN' ? 'bg-danger' : 'bg-secondary'}">${u.rol}</span></td>
            <td>
                <a href="usuario-form.html?id=${u.id}" class="btn btn-sm btn-warning"><i class="bi bi-pencil"></i></a>
                <button onclick="eliminarUsuarioAdmin(${u.id})" class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function eliminarUsuarioAdmin(id) {
    if (!confirm('¿Seguro de eliminar este usuario?')) return;
    let usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
    usuarios = usuarios.filter(u => u.id !== id);
    localStorage.setItem('usuarios_db', JSON.stringify(usuarios));
    listarUsuariosAdmin();
}