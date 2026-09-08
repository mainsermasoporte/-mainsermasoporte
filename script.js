import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAHWhdNlRPaKWieyRCui-YlN2cG-I5M7oI",
  authDomain: "produc-main.firebaseapp.com",
  projectId: "produc-main",
  storageBucket: "produc-main.firebasestorage.app",
  messagingSenderId: "713702451891",
  appId: "1:713702451891:web:d64445524ed37486cf9ec6",
  measurementId: "G-2RZ15T4428"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const usaFirebase = !Object.values(firebaseConfig).some(valor => valor.startsWith('TU_'));
const PRODUCTOS_LOCALES_KEY = 'productosCatalogo';
const ADMIN_EMAIL = 'mainsermasoporte@gmail.com';

let listaProductos = [];
let isAdmin = false;

window.onload = function() {
    isAdmin = false;
    cargarProductosDesdeFirebase();
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

window.procesarLogin = async function(event) {
    event.preventDefault();
    const passwordInput = document.getElementById('adminPasswordInput').value;

    if (!usaFirebase) {
        alert('Configura Firebase Authentication para activar el acceso administrativo.');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, passwordInput);
        isAdmin = true;
        cerrarModalLogin();
        abrirModalPublicar();
    } catch (error) {
        console.error('Error de autenticación:', error);
        alert('Correo o contraseña incorrectos.');
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

        const imagenDataUrl = await leerImagenComoDataUrl(archivoImagen);
        const productoGenerado = {
            nombre: titulo,
            categoria: "Herramientas",
            imagen: imagenDataUrl,
            desc: '',
            link: enlaceAfiliado,
            fechaCreacion: new Date().toISOString()
        };

        if (usaFirebase) {
            await addDoc(collection(db, "productos"), productoGenerado);
        } else {
            const productosLocales = JSON.parse(localStorage.getItem(PRODUCTOS_LOCALES_KEY) || '[]');
            productosLocales.push({ id: crypto.randomUUID(), ...productoGenerado });
            localStorage.setItem(PRODUCTOS_LOCALES_KEY, JSON.stringify(productosLocales));
        }
        alert("¡Producto publicado correctamente!");
        cerrarModalPublicar();
        cargarProductosDesdeFirebase();
    } catch (e) {
        console.error("Error al guardar: ", e);
        alert("No se pudo publicar el producto.");
    } finally {
        actualizarEstadoPublicacion(false);
    }
}

function leerImagenComoDataUrl(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
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

async function cargarProductosDesdeFirebase() {
    try {
        if (!usaFirebase) {
            listaProductos = JSON.parse(localStorage.getItem(PRODUCTOS_LOCALES_KEY) || '[]');
            aplicarFiltros();
            return;
        }
        const querySnapshot = await getDocs(collection(db, "productos"));
        listaProductos = [];
        querySnapshot.forEach((documento) => {
            listaProductos.push({ id: documento.id, ...documento.data() });
        });
        aplicarFiltros();
    } catch (e) {
        console.error("Error al cargar productos: ", e);
    }
}

window.eliminarProducto = async function(id) {
    if (!isAdmin) return;
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        try {
            if (usaFirebase) {
                await deleteDoc(doc(db, "productos", id));
            } else {
                const productosLocales = JSON.parse(localStorage.getItem(PRODUCTOS_LOCALES_KEY) || '[]');
                localStorage.setItem(PRODUCTOS_LOCALES_KEY, JSON.stringify(productosLocales.filter(producto => producto.id !== id)));
            }
            cargarProductosDesdeFirebase();
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
