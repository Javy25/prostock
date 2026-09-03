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
                <td colspan="6" class="text-center py-4 text-muted">
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
                <img src="${item.imagen}" width="50" height="50" class="rounded object-fit-cover me-2" alt="${item.nombre}">
                <span class="fw-bold">${item.nombre}</span>
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

    alert('¡Compra realizada con éxito! Se ha enviado el detalle a su correo.');
    localStorage.removeItem('carrito');
    window.location.href = 'index.html';
}