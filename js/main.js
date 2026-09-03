let productosGlobales = [];

document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito();
    verificarEstadoSesion();

    if (document.getElementById('productos-container')) {
        cargarProductos();
    }
});

// Carga productos desde /data/productos.json o localStorage
async function cargarProductos() {
    try {
        const res = await fetch('data/productos.json');
        if (!res.ok) throw new Error('No se pudo cargar data/productos.json');
        productosGlobales = await res.json();
    } catch (e) {
        // Fallback a localStorage si ya fue modificado por el Admin
        productosGlobales = JSON.parse(localStorage.getItem('productos_db')) || [
            { id: 1, codigo: "PRI-101", nombre: "Resma Papel A4 75g", categoria: "Papelería y Oficina", precio: 3990, stock: 150, imagen: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&q=80" },
            { id: 2, codigo: "PRI-102", nombre: "Lápiz Pasta Azul (12u)", categoria: "Escolar", precio: 2490, stock: 80, imagen: "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=500&q=80" }
        ];
    }
    
    // Guardar en localStorage para sincronizar con la zona Admin
    if (!localStorage.getItem('productos_db')) {
        localStorage.setItem('productos_db', JSON.stringify(productosGlobales));
    } else {
        productosGlobales = JSON.parse(localStorage.getItem('productos_db'));
    }

    renderizarCatalogo(productosGlobales);
    configurarFiltrosYBuscador();
}

function renderizarCatalogo(lista) {
    const container = document.getElementById('productos-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (lista.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5 text-muted">No hay productos disponibles.</div>';
        return;
    }

    lista.forEach(prod => {
        const div = document.createElement('div');
        div.className = 'col-md-4 col-lg-3 mb-4';
        div.innerHTML = `
            <div class="card h-100 shadow-sm border-0">
                <img src="${prod.imagen}" class="card-img-top" alt="${prod.nombre}" style="height: 180px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <small class="text-muted fw-bold">CÓD: ${prod.codigo}</small>
                    <h6 class="card-title fw-bold my-1">${prod.nombre}</h6>
                    <p class="text-muted small mb-2">${prod.categoria}</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="fs-5 fw-bold text-primary">$${prod.precio.toLocaleString('es-CL')}</span>
                        <a href="detalle-producto.html?id=${prod.id}" class="btn btn-sm btn-outline-primary">Ver Ficha</a>
                    </div>
                    <button onclick="agregarAlCarrito(${prod.id})" class="btn btn-danger btn-sm w-100 mt-2">
                        <i class="bi bi-cart-plus me-1"></i> Agregar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function agregarAlCarrito(id) {
    const producto = productosGlobales.find(p => p.id === id);
    if (!producto) return;

    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const itemExistente = carrito.find(i => i.id === id);

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    alert(`"${producto.nombre}" añadido al carrito.`);
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = total;
}

function verificarEstadoSesion() {
    const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));
    const userContainer = document.getElementById('user-navbar-info');
    
    if (userContainer) {
        if (usuarioActivo) {
            userContainer.innerHTML = `
                <a href="perfil.html" class="text-decoration-none me-2">
                    <i class="bi bi-person-circle"></i> ${usuarioActivo.nombre}
                </a>
                ${usuarioActivo.rol === 'ADMIN' ? '<a href="admin/index.html" class="badge bg-warning text-dark text-decoration-none me-2">Panel Admin</a>' : ''}
                <button onclick="cerrarSesion()" class="btn btn-sm btn-outline-danger">Salir</button>
            `;
        } else {
            userContainer.innerHTML = `
                <a href="login.html" class="btn btn-sm btn-outline-primary me-2">Ingresar</a>
                <a href="registro.html" class="btn btn-sm btn-primary">Registrarse</a>
            `;
        }
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActivo');
    window.location.href = 'index.html';
}

function configurarFiltrosYBuscador() {
    const inputBuscar = document.getElementById('input-buscar');
    if (!inputBuscar) return;

    inputBuscar.addEventListener('input', (e) => {
        const texto = e.target.value.toLowerCase();
        const filtrados = productosGlobales.filter(p => 
            p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto)
        );
        renderizarCatalogo(filtrados);
    });
}