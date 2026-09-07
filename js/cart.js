document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tabla-carrito')) {
        renderizarCarrito();
    }
});

function renderizarCarrito() {
    const tbody = document.getElementById('tabla-carrito');
    const totalEl = document.getElementById('carrito-total');
    const subtotalEl = document.getElementById('carrito-subtotal');
    const ivaEl = document.getElementById('carrito-iva');
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    tbody.innerHTML = '';

    if (carrito.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    El carrito está vacío. <a href="productos.html">Ver productos</a>
                </td>
            </tr>`;
        if (subtotalEl) subtotalEl.textContent = '$0';
        if (ivaEl) ivaEl.textContent = '$0';
        if (totalEl) totalEl.textContent = '$0';
        return;
    }

    let subtotal = 0;

    carrito.forEach((item, index) => {
        const itemTotal = item.precio * item.cantidad;
        subtotal += itemTotal;

        const tr = document.createElement('tr');
        tr.className = 'align-middle';
        tr.innerHTML = `
            <td>
                <img src="${escaparHTML(item.imagen)}" width="50" height="50" class="rounded object-fit-cover me-2" alt="${escaparHTML(item.nombre)}">
                <span class="fw-bold">${escaparHTML(item.nombre)}</span>
            </td>
            <td>$${item.precio.toLocaleString('es-CL')}</td>
            <td>
                <div class="input-group input-group-sm" style="width: 110px;">
                    <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <span class="form-control text-center">${item.cantidad}</span>
                    <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${index}, 1)">+</button>
                </div>
            </td>
            <td class="fw-bold">$${itemTotal.toLocaleString('es-CL')}</td>
            <td>
                <button onclick="eliminarDelCarrito(${index})" class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const iva = Math.round(subtotal * 0.19);
    const total = subtotal + iva;

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-CL')}`;
    if (ivaEl) ivaEl.textContent = `$${iva.toLocaleString('es-CL')}`;
    if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CL')}`;
}

function cambiarCantidad(index, cambio) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const item = carrito[index];
    if (!item) return;
    const productos = JSON.parse(localStorage.getItem('productos_db')) || [];
    const producto = productos.find(itemProducto => itemProducto.id === item.id);
    if (cambio > 0 && (!producto || item.cantidad >= producto.stock)) {
        alert(`Solo hay ${producto?.stock || 0} unidades disponibles.`);
        return;
    }
    carrito[index].cantidad += cambio;

    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
    if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
}

function eliminarDelCarrito(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
    if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
}

function vaciarCarrito() {
    if (confirm('¿Deseas vaciar todo el carrito?')) {
        localStorage.removeItem('carrito');
        renderizarCarrito();
        if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
    }
}

function procesarCompra() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        alert('El carrito está vacío.');
        return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
    if (!usuario) {
        alert('Debes iniciar sesión para finalizar tu compra.');
        window.location.href = 'login.html';
        return;
    }

    const productos = JSON.parse(localStorage.getItem('productos_db')) || [];
    const productoPorId = new Map(productos.map(producto => [producto.id, producto]));
    const sinStock = carrito.find(item => {
        const producto = productoPorId.get(item.id);
        return !producto || producto.stock < item.cantidad;
    });
    if (sinStock) {
        alert(`No hay stock suficiente para "${sinStock.nombre}".`);
        return;
    }

    carrito.forEach(item => {
        productoPorId.get(item.id).stock -= item.cantidad;
    });
    const subtotal = carrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
    const pedido = {
        id: Date.now(),
        usuarioId: usuario.id,
        fecha: new Date().toLocaleDateString('es-CL'),
        total: subtotal + Math.round(subtotal * 0.19),
        estado: 'Confirmado',
        items: carrito
    };
    const pedidos = JSON.parse(localStorage.getItem('pedidos_db')) || [];
    pedidos.push(pedido);
    localStorage.setItem('productos_db', JSON.stringify(productos));
    localStorage.setItem('pedidos_db', JSON.stringify(pedidos));

    alert('¡Compra realizada con éxito! Puedes revisar el pedido en tu perfil.');
    localStorage.removeItem('carrito');
    window.location.href = 'index.html';
}