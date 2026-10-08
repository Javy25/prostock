let productosGlobales = [];
// Esperar a que cargue el HTML
document.addEventListener('DOMContentLoaded', () => {
    asegurarAdministradorInicial();
    actualizarContadorCarrito();
    verificarEstadoSesion();
    configurarPerfil();

    if (document.getElementById('productos-container')) {
        cargarProductos();
    }
});

// Crear administrador inicial
function asegurarAdministradorInicial() {
    const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
    if (usuarios.some(usuario => usuario.email === 'admin@duoc.cl')) return;

    usuarios.push({
        id: 999,
        nombre: 'Administrador Prostock',
        email: 'admin@duoc.cl',
        password: 'admin123',
        rol: 'ADMIN'
    });
    localStorage.setItem('usuarios_db', JSON.stringify(usuarios));
}


//Evitar HTML peligroso
function escaparHTML(valor) {
    const elemento = document.createElement('div');
    elemento.textContent = String(valor ?? '');
    return elemento.innerHTML;
}


// Calcular precio con IVA
function calcularPrecioConIva(precioNeto) {
    return Math.round(Number(precioNeto) * 1.19);
}

function configurarPerfil() {
    const nombreEl = document.getElementById('perfil-nombre');
    if (!nombreEl) return;

    const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    const nombre = usuario.nombre || 'Usuario';
    const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();
    nombreEl.textContent = nombre;
    document.getElementById('perfil-iniciales').textContent = iniciales || 'US';
    document.getElementById('perfil-rol').textContent = usuario.rol === 'ADMIN' ? 'Administrador' : 'Cliente registrado';
    document.getElementById('perfil-email').textContent = usuario.email || 'No registrado';
    document.getElementById('perfil-run').textContent = usuario.run || 'No registrado';
    document.getElementById('perfil-region').textContent = usuario.region || 'No registrada';
    document.getElementById('perfil-comuna').textContent = usuario.comuna || 'No registrada';
    document.getElementById('perfil-direccion').textContent = usuario.direccion || 'No registrada';

    const pedidos = (JSON.parse(localStorage.getItem('pedidos_db')) || []).filter(pedido => pedido.usuarioId === usuario.id);
    const tbody = document.getElementById('perfil-pedidos');
    tbody.innerHTML = pedidos.length ? pedidos.map(pedido => `
        <tr>
            <td>#${escaparHTML(pedido.id)}</td>
            <td>${escaparHTML(pedido.fecha)}</td>
            <td>$${Number(pedido.total).toLocaleString('es-CL')}</td>
            <td><span class="badge bg-success">${escaparHTML(pedido.estado)}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="4" class="text-center text-muted py-4">Aún no tienes compras registradas.</td></tr>';
}

// Inicializa productos_db desde JSON una sola vez y luego usa el inventario local.
async function cargarProductos() {
    const productosGuardados = localStorage.getItem('productos_db');
    if (productosGuardados) {
        productosGlobales = JSON.parse(productosGuardados);
        renderizarCatalogo(productosGlobales);
        renderizarPatrocinados(productosGlobales.slice(0, 8));
        configurarCategoriasInicio();
        configurarFiltrosYBuscador();
        return;
    }

    try {
        const res = await fetch('data/productos.json');
        if (!res.ok) throw new Error('No se pudo cargar data/productos.json');
        productosGlobales = await res.json();
    } catch (e) {
        productosGlobales = JSON.parse(localStorage.getItem('productos_db')) || [
            { id: 1, codigo: "PRI-101", nombre: "Resma Papel A4 75g", categoria: "Papelería y Oficina", precio: 3990, stock: 150, imagen: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&q=80" },
            { id: 2, codigo: "PRI-102", nombre: "Lápiz Pasta Azul (12u)", categoria: "Escolar", precio: 2490, stock: 80, imagen: "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=500&q=80" },
            { id: 3, codigo: "PRI-103", nombre: "Corchetera Metálica Uso Rudo", categoria:"Papelería y Oficina", precio:  5990, stock: 80, imagen: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80" }
        ];
    }
    
    localStorage.setItem('productos_db', JSON.stringify(productosGlobales));

    renderizarCatalogo(productosGlobales);
    renderizarPatrocinados(productosGlobales.slice(0, 8));
    configurarCategoriasInicio();
    configurarFiltrosYBuscador();
}

function configurarCategoriasInicio() {
    const tabs = document.getElementById('home-category-tabs');
    if (!tabs) return;

    const categorias = [...new Set(productosGlobales.map(producto => producto.categoria))];
    const mostrarCategoria = categoria => {
        renderizarCatalogo(productosGlobales.filter(producto => producto.categoria === categoria));
        const filtroCategoria = document.getElementById('filtro-categoria');
        if (filtroCategoria) filtroCategoria.value = categoria;
        tabs.querySelectorAll('button').forEach(tab => tab.classList.toggle('active', tab.dataset.category === categoria));
    };

    tabs.innerHTML = categorias.map((categoria, indice) => `
        <button type="button" class="home-category-tab${indice === 0 ? ' active' : ''}" data-category="${escaparHTML(categoria)}" role="tab" aria-selected="${indice === 0}">${escaparHTML(categoria)}</button>
    `).join('');
    tabs.addEventListener('click', evento => {
        const tab = evento.target.closest('button');
        if (tab) mostrarCategoria(tab.dataset.category);
    });
    mostrarCategoria(categorias[0]);
}

function renderizarPatrocinados(lista) {
    const container = document.getElementById('sponsored-container');
    if (!container) return;

    container.innerHTML = lista.map(producto => `
        <article class="sponsored-card">
            <a href="detalle-producto.html?id=${producto.id}" class="sponsored-image-link">
                <img src="${escaparHTML(producto.imagen)}" alt="${escaparHTML(producto.nombre)}">
            </a>
            <div class="sponsored-card-body">
                <span class="sponsored-category">${escaparHTML(producto.categoria)}</span>
                <h3><a href="detalle-producto.html?id=${Number(producto.id)}">${escaparHTML(producto.nombre)}</a></h3>
                <strong>$${calcularPrecioConIva(producto.precio).toLocaleString('es-CL')} IVA incl.</strong>
                <span class="sponsored-provider">Prostock</span>
            </div>
        </article>
    `).join('');

    const desplazar = direccion => container.scrollBy({ left: direccion * 300, behavior: 'smooth' });
    document.getElementById('sponsored-prev')?.addEventListener('click', () => desplazar(-1));
    document.getElementById('sponsored-next')?.addEventListener('click', () => desplazar(1));
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
        div.className = 'col-sm-6 col-lg-4 col-xl-3 mb-4';
        div.innerHTML = `
            <div class="card h-100 shadow-sm border-0 product-card" role="link" tabindex="0" onclick="window.location.href='detalle-producto.html?id=${Number(prod.id)}'" onkeydown="if (event.key === 'Enter') window.location.href='detalle-producto.html?id=${Number(prod.id)}'">
                <img src="${escaparHTML(prod.imagen)}" class="card-img-top" alt="${escaparHTML(prod.nombre)}" style="height: 180px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <small class="text-muted fw-bold">CÓD: ${escaparHTML(prod.codigo)}</small>
                    <h6 class="card-title fw-bold my-1">${escaparHTML(prod.nombre)}</h6>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="fs-5 fw-bold text-primary">$${calcularPrecioConIva(prod.precio).toLocaleString('es-CL')} <small class="fs-6 fw-normal">IVA incl.</small></span>
                    </div>
                    <button onclick="event.stopPropagation(); agregarAlCarrito(${prod.id})" class="btn btn-danger btn-sm w-100 mt-2">
                        <i class="bi bi-cart-plus me-1"></i> Agregar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function agregarAlCarrito(id) {
    const productosDisponibles = productosGlobales.length
        ? productosGlobales
        : JSON.parse(localStorage.getItem('productos_db')) || [];
    const producto = productosDisponibles.find(p => p.id === id);
    if (!producto) return;

    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const itemExistente = carrito.find(i => i.id === id);

    if (producto.stock <= 0) {
        alert('Este producto no tiene stock disponible.');
        return;
    }
    if (itemExistente && itemExistente.cantidad >= producto.stock) {
        alert(`Solo hay ${producto.stock} unidades disponibles.`);
        return;
    }

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
                    <i class="bi bi-person-circle"></i> ${escaparHTML(usuarioActivo.nombre)}
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
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (!inputBuscar && !filtroCategoria) return;

    if (filtroCategoria) {
        const categorias = [...new Set(productosGlobales.map(producto => producto.categoria))].sort();
        categorias.forEach(categoria => {
            const opcion = document.createElement('option');
            opcion.value = categoria;
            opcion.textContent = categoria;
            filtroCategoria.appendChild(opcion);
        });
        const categoriaActiva = document.querySelector('#home-category-tabs .active');
        if (categoriaActiva) filtroCategoria.value = categoriaActiva.dataset.category;
    }

    const aplicarFiltros = () => {
        const texto = inputBuscar ? inputBuscar.value.toLowerCase() : '';
        const categoria = filtroCategoria ? filtroCategoria.value : '';
        const filtrados = productosGlobales.filter(p => 
            (p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto)) &&
            (!categoria || p.categoria === categoria)
        );
        renderizarCatalogo(filtrados);
    };

    if (inputBuscar) inputBuscar.addEventListener('input', aplicarFiltros);
    if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);
}

document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('#filter-buttons .btn');
    const blogItems = document.querySelectorAll('.blog-item');
    const searchInput = document.getElementById('blog-search');

    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const categoriaSeleccionada = button.getAttribute('data-filter');

                blogItems.forEach(tarjeta => {
                    const categoriaTarjeta = tarjeta.getAttribute('data-category');

                    if (categoriaSeleccionada === 'all' || categoriaTarjeta === categoriaSeleccionada) {
                        tarjeta.style.display = 'block';
                    } else {
                        tarjeta.style.display = 'none';
                    }
                });
            });
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const busqueda = e.target.value.toLowerCase().trim();

            blogItems.forEach(item => {
                const titulo = item.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const texto = item.querySelector('.card-text')?.textContent.toLowerCase() || '';

                if (titulo.includes(busqueda) || texto.includes(busqueda)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}); 
