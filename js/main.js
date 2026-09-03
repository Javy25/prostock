/* ==========================================================================
   1. DATOS Y LÓGICA DE REGIONES Y COMUNAS
   ========================================================================== */
const regionesYComunas = [
    {
        region: "Region Metropolitana de Santiago",
        comunas: ["Santiago", "Providencia", "Las Condes", "Maipu", "La Florida", "Puente Alto"]
    },
    {
        region: "Region de Valparaiso",
        comunas: ["Valparaiso", "Viña del Mar", "Quilpue", "Villa Alemana", "San Antonio"]
    },
    {
        region: "Region del Biobio",
        comunas: ["Concepcion", "Talcahuano", "San Pedro de la Paz", "Chiguayante", "Los Angeles"]
    }
];

function cargarRegiones(selectRegionId, selectComunaId) {
    const selectRegion = document.getElementById(selectRegionId);
    const selectComuna = document.getElementById(selectComunaId);

    if (!selectRegion || !selectComuna) return;

    selectRegion.innerHTML = '<option value="">Seleccione region...</option>';
    regionesYComunas.forEach(item => {
        const option = document.createElement("option");
        option.value = item.region;
        option.textContent = item.region;
        selectRegion.appendChild(option);
    });

    selectRegion.addEventListener("change", () => {
        const regionSeleccionada = selectRegion.value;
        selectComuna.innerHTML = '<option value="">Seleccione comuna...</option>';
        
        const objetoRegion = regionesYComunas.find(r => r.region === regionSeleccionada);
        if (objetoRegion) {
            objetoRegion.comunas.forEach(comuna => {
                const option = document.createElement("option");
                option.value = comuna;
                option.textContent = comuna;
                selectComuna.appendChild(option);
            });
        }
    });
}

/* ==========================================================================
   2. VALIDACIONES DE FORMULARIO (RUN, CORREO, CAMPOS)
   ========================================================================== */
function validarRun(run) {
    const cleanRun = run.trim().toUpperCase();
    if (!/^[0-9]{7,8}[0-9K]$/.test(cleanRun)) return false;

    const cuerpo = cleanRun.slice(0, -1);
    const dvIngresado = cleanRun.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i), 10) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    let dvCalculado = resto === 11 ? '0' : resto === 10 ? 'K' : resto.toString();

    return dvIngresado === dvCalculado;
}

function validarCorreo(correo) {
    if (correo.length > 100) return false;
    const dominiosValidos = ["@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];
    return dominiosValidos.some(dominio => correo.toLowerCase().endsWith(dominio));
}

function validarFormularioUsuario(idForm) {
    const form = document.getElementById(idForm);
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const run = document.getElementById("run").value;
        const nombre = document.getElementById("nombre").value;
        const apellidos = document.getElementById("apellidos").value;
        const correo = document.getElementById("correo").value;
        const direccion = document.getElementById("direccion").value;

        if (!validarRun(run)) {
            alert("El RUN ingresado no es valido. Formato requerido: Sin puntos ni guion (ej: 19011022K).");
            return;
        }

        if (nombre.trim() === "" || nombre.length > 50) {
            alert("El nombre es requerido y debe tener un maximo de 50 caracteres.");
            return;
        }

        if (apellidos.trim() === "" || apellidos.length > 100) {
            alert("Los apellidos son requeridos y deben tener un maximo de 100 caracteres.");
            return;
        }

        if (!validarCorreo(correo)) {
            alert("El correo debe pertenecer a @duoc.cl, @profesor.duoc.cl o @gmail.com.");
            return;
        }

        if (direccion.trim() === "" || direccion.length > 300) {
            alert("La direccion es requerida y debe tener un maximo de 300 caracteres.");
            return;
        }

        alert("Registro completado con exito.");
        form.reset();
    });
}

/* ==========================================================================
   3. CATÁLOGO DE PRODUCTOS Y CARRITO DE COMPRAS
   ========================================================================== */
const productosProStock = [
    { id: 1, codigo: "SKU101", nombre: "Caja de Lapices Gel Azul (12u)", categoria: "Escritorio", precio: 4500, stock: 20, stockCritico: 5, imagen: "https://via.placeholder.com/200?text=Lapices+Gel" },
    { id: 2, codigo: "SKU102", nombre: "Resma de Papel Carta 75g", categoria: "Papeleria", precio: 3800, stock: 4, stockCritico: 5, imagen: "https://via.placeholder.com/200?text=Resma+Carta" },
    { id: 3, codigo: "SKU103", nombre: "Mouse Inalambrico Ergonomico", categoria: "Tecnologia", precio: 12990, stock: 15, stockCritico: 2, imagen: "https://via.placeholder.com/200?text=Mouse+Inalambrico" },
    { id: 4, codigo: "SKU104", nombre: "Cuaderno Universitario Espiral", categoria: "Papeleria", precio: 1990, stock: 50, stockCritico: 10, imagen: "https://via.placeholder.com/200?text=Cuaderno" },
    { id: 5, codigo: "SKU105", nombre: "Corchetera Heavy Duty", categoria: "Escritorio", precio: 6490, stock: 8, stockCritico: 3, imagen: "https://via.placeholder.com/200?text=Corchetera" },
    { id: 6, codigo: "SKU106", nombre: "Set Destacadores Pastel (6u)", categoria: "Escritorio", precio: 3290, stock: 2, stockCritico: 5, imagen: "https://via.placeholder.com/200?text=Destacadores" },
    { id: 7, codigo: "SKU107", nombre: "Teclado Mecanico USB", categoria: "Tecnologia", precio: 29990, stock: 10, stockCritico: 3, imagen: "https://via.placeholder.com/200?text=Teclado" },
    { id: 8, codigo: "SKU108", nombre: "Resma Papel Oficio 75g", categoria: "Papeleria", precio: 4200, stock: 18, stockCritico: 5, imagen: "https://via.placeholder.com/200?text=Resma+Oficio" },
    { id: 9, codigo: "SKU109", nombre: "Organizador Malla Metalica", categoria: "Escritorio", precio: 8990, stock: 12, stockCritico: 4, imagen: "https://via.placeholder.com/200?text=Organizador" },
    { id: 10, codigo: "SKU110", nombre: "Pendrive 64GB USB 3.0", categoria: "Tecnologia", precio: 7990, stock: 25, stockCritico: 5, imagen: "https://via.placeholder.com/200?text=Pendrive" },
    { id: 11, codigo: "SKU111", nombre: "Carpeta Archivadora A4", categoria: "Papeleria", precio: 1490, stock: 3, stockCritico: 8, imagen: "https://via.placeholder.com/200?text=Carpeta" },
    { id: 12, codigo: "SKU112", nombre: "Audifonos USB con Microfono", categoria: "Tecnologia", precio: 18990, stock: 7, stockCritico: 2, imagen: "https://via.placeholder.com/200?text=Audifonos" },
    { id: 13, codigo: "SKU113", nombre: "Tijeras Profesionales 8\"", categoria: "Escritorio", precio: 2490, stock: 30, stockCritico: 5, imagen: "https://via.placeholder.com/200?text=Tijeras" },
    { id: 14, codigo: "SKU114", nombre: "Calculadora Cientifica", categoria: "Tecnologia", precio: 14990, stock: 9, stockCritico: 3, imagen: "https://via.placeholder.com/200?text=Calculadora" }
];

document.addEventListener("DOMContentLoaded", () => {
    renderizarProductos(productosProStock);
    actualizarContadorCarrito();

    const searchInput = document.getElementById("search-input");
    const categorySelect = document.getElementById("category-select");

    if (searchInput) searchInput.addEventListener("input", aplicarFiltros);
    if (categorySelect) categorySelect.addEventListener("change", aplicarFiltros);
});

function renderizarProductos(lista) {
    const contenedor = document.getElementById("products-grid");
    if (!contenedor) return;

    if (lista.length === 0) {
        contenedor.innerHTML = `<div class="col-12"><div class="alert alert-warning text-center">No se encontraron productos en el catalogo.</div></div>`;
        return;
    }

    contenedor.innerHTML = lista.map(p => `
        <div class="col">
            <div class="card h-100 shadow-sm text-center">
                <img src="${p.imagen}" class="card-img-top p-3" alt="${p.nombre}" style="height: 160px; object-fit: contain;">
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title fw-bold mb-1">${p.nombre}</h6>
                    <p class="text-muted small mb-2">SKU: ${p.codigo}</p>
                    <p class="fs-5 fw-bold text-success mt-auto mb-3">$${p.precio.toLocaleString("es-CL")}</p>
                    <button class="btn btn-success btn-sm w-100 mb-2" onclick="agregarAlCarrito(${p.id})">Añadir al carrito</button>
                    <a href="detalle-producto.html?id=${p.id}" class="btn btn-outline-secondary btn-sm w-100">Ver detalle</a>
                </div>
            </div>
        </div>
    `).join('');
}

function aplicarFiltros() {
    const texto = document.getElementById("search-input").value.toLowerCase();
    const categoria = document.getElementById("category-select").value;

    const filtrados = productosProStock.filter(p => {
        const coincideTexto = p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto);
        const coincideCat = categoria === "todas" || p.categoria === categoria;
        return coincideTexto && coincideCat;
    });

    renderizarProductos(filtrados);
}

function agregarAlCarrito(idProducto) {
    let carrito = JSON.parse(localStorage.getItem("prostock_carrito")) || [];
    const producto = productosProStock.find(p => p.id === idProducto);

    const existe = carrito.find(item => item.id === idProducto);
    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    localStorage.setItem("prostock_carrito", JSON.stringify(carrito));
    actualizarContadorCarrito();
    alert("Producto " + producto.nombre + " añadido al carrito.");
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem("prostock_carrito")) || [];
    const totalCantidad = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const contador = document.getElementById("cart-count");
    if (contador) contador.textContent = totalCantidad;
}