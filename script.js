const PRODUCTOS_LOCALES_KEY = 'productosCatalogo';
const MAX_PRODUCTOS = 100;
const PASSWORD_KEY = 47;
const ADMIN_PASSWORD = [105, 74, 93, 66, 64, 92, 71, 31, 30, 29, 26, 30, 22, 111]
    .map(codigo => String.fromCharCode(codigo ^ PASSWORD_KEY))
    .join('');

let listaProductos = [];
let isAdmin = false;

window.onload = function() {
    isAdmin = false;
    cargarProductosDesdeAlmacenamientoLocal();
};

// Control del Modal de Login
window.abrirModalLogin = function() {
    document.getElementById('loginModal').style.display = 'flex';
}

window.cerrarModalLogin = function() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('adminPasswordInput').type = 'password';
    const eyeButton = document.querySelector('.toggle-password');
    eyeButton.classList.remove('fa-eye');
    eyeButton.classList.add('fa-eye-slash');
    eyeButton.setAttribute('aria-label', 'Mostrar contraseña');
    eyeButton.setAttribute('title', 'Mostrar contraseña');
}

// Función para el botón del "ojito"
window.togglePasswordVisibility = function(iconElement) {
    const passwordInput = iconElement.previousElementSibling;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        iconElement.classList.remove('fa-eye-slash');
        iconElement.classList.add('fa-eye');
        iconElement.setAttribute('aria-label', 'Ocultar contraseña');
        iconElement.setAttribute('title', 'Ocultar contraseña');
    } else {
        passwordInput.type = 'password';
        iconElement.classList.remove('fa-eye');
        iconElement.classList.add('fa-eye-slash');
        iconElement.setAttribute('aria-label', 'Mostrar contraseña');
        iconElement.setAttribute('title', 'Mostrar contraseña');
    }
}

window.procesarLogin = function(event) {
    event.preventDefault();
    const passwordInput = document.getElementById('adminPasswordInput').value;

    if (passwordInput === ADMIN_PASSWORD) {
        isAdmin = true;
        cerrarModalLogin();
        abrirModalPublicar();
    } else {
        alert('Contraseña incorrecta.');
    }
}

// Control del Modal de Publicación
window.abrirModalPublicar = function() {
    if (!isAdmin) {
        abrirModalLogin();
        return;
    }
    document.getElementById('publishModal').style.display = 'flex';
}

window.cerrarModalPublicar = function() {
    document.getElementById('publishModal').style.display = 'none';
    document.getElementById('productForm').reset();
    actualizarEstadoPublicacion(false);
}

window.publicarProductoAutomatico = async function(event) {
    event.preventDefault();
    const inputTitle = document.getElementById('productTitle');
    const inputImage = document.getElementById('productImage');
    const inputAffiliateLink = document.getElementById('affiliateLinkProd');
    if (!inputTitle || !inputImage || !inputAffiliateLink) return;

    const titulo = inputTitle.value.trim();
    const enlaceAfiliado = inputAffiliateLink.value.trim();
    const archivoImagen = inputImage.files?.[0];
    if (!titulo || !archivoImagen || !enlaceAfiliado) return;

    if (!archivoImagen.type.startsWith('image/')) {
        alert('Selecciona un archivo de imagen válido.');
        return;
    }

    actualizarEstadoPublicacion(true);

    try {
        try {
            new URL(enlaceAfiliado);
        } catch (error) {
            alert('El enlace de afiliado no es válido.');
            return;
        }

        const imagenDataUrl = await comprimirImagen(archivoImagen);
        const productoGenerado = {
            nombre: titulo,
            categoria: "Herramientas",
            imagen: imagenDataUrl,
            desc: '',
            link: enlaceAfiliado,
            fechaCreacion: new Date().toISOString()
        };

        const productosLocales = obtenerProductosLocales();
        if (productosLocales.length >= MAX_PRODUCTOS) {
            alert(`El catálogo admite un máximo de ${MAX_PRODUCTOS} productos.`);
            return;
        }
        productosLocales.push({ id: crypto.randomUUID(), ...productoGenerado });
        guardarProductosLocales(productosLocales);
        alert("¡Producto publicado correctamente!");
        cerrarModalPublicar();
        cargarProductosDesdeAlmacenamientoLocal();
    } catch (e) {
        console.error("Error al guardar: ", e);
        alert("No se pudo publicar el producto.");
    } finally {
        actualizarEstadoPublicacion(false);
    }
}

function comprimirImagen(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => {
            const imagen = new Image();
            imagen.onload = () => {
                const maxDimension = 1200;
                const escala = Math.min(1, maxDimension / Math.max(imagen.width, imagen.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(imagen.width * escala));
                canvas.height = Math.max(1, Math.round(imagen.height * escala));
                canvas.getContext('2d').drawImage(imagen, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.78));
            };
            imagen.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
            imagen.src = lector.result;
        };
        lector.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
        lector.readAsDataURL(archivo);
    });
}

function actualizarEstadoPublicacion(estaCargando) {
    const estado = document.getElementById('publishStatus');
    const boton = document.getElementById('publishButton');
    if (!estado || !boton) return;
    estado.hidden = !estaCargando;
    boton.disabled = estaCargando;
    boton.textContent = estaCargando ? 'Generando...' : 'Publicar';
}

function obtenerProductosLocales() {
    try {
        const productos = JSON.parse(localStorage.getItem(PRODUCTOS_LOCALES_KEY) || '[]');
        return Array.isArray(productos) ? productos.slice(0, MAX_PRODUCTOS) : [];
    } catch (error) {
        console.error('No se pudo leer el catálogo local:', error);
        return [];
    }
}

function guardarProductosLocales(productos) {
    try {
        localStorage.setItem(PRODUCTOS_LOCALES_KEY, JSON.stringify(productos.slice(0, MAX_PRODUCTOS)));
    } catch (error) {
        throw new Error('No hay espacio suficiente para guardar la imagen. Usa una imagen más pequeña.');
    }
}

function cargarProductosDesdeAlmacenamientoLocal() {
    listaProductos = obtenerProductosLocales();
    aplicarFiltros();
}

window.eliminarProducto = async function(id) {
    if (!isAdmin) return;
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        try {
            const productosLocales = obtenerProductosLocales();
            guardarProductosLocales(productosLocales.filter(producto => producto.id !== id));
            cargarProductosDesdeAlmacenamientoLocal();
        } catch (e) {
            alert("Error al eliminar.");
        }
    }
}

window.filtrarProductos = function() {
    aplicarFiltros();
}

function aplicarFiltros() {
    let textoBusqueda = document.getElementById('searchInput').value.toLowerCase();
    let filtrados = listaProductos.filter(p => {
        let coincideTexto = (p.nombre || '').toLowerCase().includes(textoBusqueda) || (p.desc || '').toLowerCase().includes(textoBusqueda);
        return coincideTexto;
    });
    mostrarProductos(filtrados);
}

function mostrarProductos(lista) {
    let grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (lista.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">No hay productos registrados en esta categoría.</p>`;
        return;
    }

    lista.forEach(p => {
        let card = document.createElement('div');
        card.className = 'product-card';
        let botonEliminarHTML = isAdmin ? `<button class="delete-btn" onclick="eliminarProducto('${p.id}')">Eliminar Producto</button>` : '';

        // Si el producto tiene el HTML directo de SiteStripe, lo renderizamos tal cual
        if (p.htmlPersonalizado) {
            card.innerHTML = `
                <div>${p.htmlPersonalizado}</div>
                <div>${botonEliminarHTML}</div>
            `;
        } else {
            // Estructura alternativa por si quedó algún producto viejo
            card.innerHTML = `
                <div>
                    <h3 class="product-name">${p.nombre}</h3>
                    <div class="product-img">
                        <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://placehold.co/600x400/f1f3f5/495057?text=Imagen+no+disponible'">
                    </div>
                </div>
                <div>
                    <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="amazon-btn">Ver producto</a>
                    ${botonEliminarHTML}
                </div>
            `;
        }
        grid.appendChild(card);
    });
}
