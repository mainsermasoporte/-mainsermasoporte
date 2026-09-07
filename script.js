import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

let listaProductos = [];
let categoriaActual = 'todos';
let subcategoriaActual = 'todos';
let isAdmin = false;

window.onload = function() {
    if (!usaFirebase && localStorage.getItem("isLoggedIn") === "true") {
        isAdmin = true;
        document.getElementById('adminControlsBar').style.display = 'flex';
        document.getElementById('authButtonContainer').innerHTML = `
            <button class="logout-btn-header" onclick="cerrarSesionAdmin()">Cerrar Sesión</button>
        `;
    } else {
        isAdmin = false;
        document.getElementById('adminControlsBar').style.display = 'none';
        document.getElementById('authButtonContainer').innerHTML = `
            <button class="admin-access-btn" onclick="abrirModalLogin()" title="Panel de Administración">⚙️</button>
        `;
    }
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
    const emailInput = document.getElementById('adminEmailInput').value.trim().toLowerCase();
    const passwordInput = document.getElementById('adminPasswordInput').value;

    if (!usaFirebase) {
        alert('Configura Firebase Authentication para activar el acceso administrativo.');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
        isAdmin = true;
        localStorage.setItem("isLoggedIn", "true");
        document.getElementById('adminControlsBar').style.display = 'flex';
        document.getElementById('authButtonContainer').innerHTML = `
            <button class="logout-btn-header" onclick="cerrarSesionAdmin()">Cerrar Sesión</button>
        `;
        cerrarModalLogin();
        mostrarProductos(listaProductos);
    } catch (error) {
        console.error('Error de autenticación:', error);
        alert('Correo o contraseña incorrectos.');
    }
}

window.cerrarSesionAdmin = function() {
    isAdmin = false;
    localStorage.removeItem("isLoggedIn");
    if (usaFirebase) signOut(auth).catch(error => console.error('Error al cerrar sesión:', error));
    document.getElementById('adminControlsBar').style.display = 'none';
    document.getElementById('authButtonContainer').innerHTML = `
        <button class="admin-access-btn" onclick="abrirModalLogin()" title="Panel de Administración">⚙️</button>
    `;
    cerrarModalPublicar();
    mostrarProductos(listaProductos);
}

// Control del Modal de Publicación
window.abrirModalPublicar = function() {
    if (!isAdmin) return;
    document.getElementById('publishModal').style.display = 'flex';
}

window.cerrarModalPublicar = function() {
    document.getElementById('publishModal').style.display = 'none';
    document.getElementById('productForm').reset();
}

window.publicarProductoAutomatico = async function(event) {
    event.preventDefault();
    const inputLink = document.getElementById('linkProd');
    if (!inputLink) return;

    const linkIngresado = inputLink.value.trim();
    if (!linkIngresado) return;

    const datosEnlace = await obtenerDatosDesdeEnlaceAmazon(linkIngresado);
    if (!datosEnlace.asin) {
        alert('El enlace no contiene un ASIN válido. Usa un enlace largo de Amazon con /dp/ o /gp/product/.');
        return;
    }

    const productoGenerado = {
        nombre: datosEnlace.nombre,
        categoria: "Herramientas",
        subcategoria: "Equipamiento Técnico",
        precio: datosEnlace.precio,
        rating: datosEnlace.rating,
        imagen: datosEnlace.imagen,
        desc: datosEnlace.desc,
        link: linkIngresado,
        fechaCreacion: new Date().toISOString()
    };

    try {
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
    }
}

function extraerAsin(link) {
    try {
        const url = new URL(link);
        return url.pathname.match(/(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase() || '';
    } catch (error) {
        return '';
    }
}

async function obtenerDatosDesdeEnlaceAmazon(link) {
    const asin = extraerAsin(link);
    const datosBase = {
        asin,
        nombre: asin ? `Producto Amazon ${asin}` : '',
        imagen: asin
            ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`
            : 'https://placehold.co/600x400/f1f3f5/495057?text=Producto',
        desc: asin
            ? 'Producto de Amazon. Consulta el enlace original para ver sus detalles actualizados.'
            : '',
        precio: 'Consultar en el sitio original',
        rating: 'Calificación disponible en el sitio original'
    };

    if (!asin) return datosBase;

    try {
        const respuesta = await fetch(`https://api.microlink.io?url=${encodeURIComponent(link)}&meta=true`);
        if (!respuesta.ok) return datosBase;
        const resultado = await respuesta.json();
        const meta = resultado.data?.metadata || {};
        const imagenMeta = typeof meta.image === 'string' ? meta.image : meta.image?.url;
        return {
            ...datosBase,
            nombre: meta.title || datosBase.nombre,
            imagen: imagenMeta || datosBase.imagen,
            desc: meta.description || meta.descriptionText || datosBase.desc
        };
    } catch (error) {
        console.warn('No se pudieron leer los datos del enlace de Amazon:', error);
        return datosBase;
    }
}

async function cargarProductosDesdeFirebase() {
    try {
        if (!usaFirebase) {
            listaProductos = JSON.parse(localStorage.getItem(PRODUCTOS_LOCALES_KEY) || '[]');
            generarFiltrosDinamicos();
            aplicarFiltros();
            return;
        }
        const querySnapshot = await getDocs(collection(db, "productos"));
        listaProductos = [];
        querySnapshot.forEach((documento) => {
            listaProductos.push({ id: documento.id, ...documento.data() });
        });
        generarFiltrosDinamicos();
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

function generarFiltrosDinamicos() {
    let nav = document.getElementById('mainCategories');
    nav.innerHTML = `<button class="cat-btn ${categoriaActual === 'todos' ? 'active' : ''}" onclick="seleccionarCategoria('todos', this)">📁 Todo el Catálogo</button>`;

    let categoriasUnicas = [...new Set(listaProductos.map(p => p.categoria))];
    categoriasUnicas.forEach(cat => {
        let btn = document.createElement('button');
        btn.className = `cat-btn ${categoriaActual === cat ? 'active' : ''}`;
        btn.innerText = cat;
        btn.onclick = () => seleccionarCategoria(cat, btn);
        nav.appendChild(btn);
    });
    actualizarSubcategorias();
}

window.seleccionarCategoria = function(cat, elemento) {
    categoriaActual = cat;
    subcategoriaActual = 'todos';
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    elemento.classList.add('active');
    actualizarSubcategorias();
    aplicarFiltros();
}

function actualizarSubcategorias() {
    let subContainer = document.getElementById('subcategoriesContainer');
    subContainer.innerHTML = '';
    if (categoriaActual === 'todos') return;

    let subcategoriasUnicas = [...new Set(listaProductos.filter(p => p.categoria === categoriaActual).map(p => p.subcategoria))];
    if (subcategoriasUnicas.length > 0) {
        let btnTodas = document.createElement('button');
        btnTodas.className = `sub-btn ${subcategoriaActual === 'todos' ? 'active' : ''}`;
        btnTodas.innerText = '✨ Todas';
        btnTodas.onclick = () => filtrarPorSubcategoria('todos', btnTodas);
        subContainer.appendChild(btnTodas);

        subcategoriasUnicas.forEach(sub => {
            let btn = document.createElement('button');
            btn.className = `sub-btn ${subcategoriaActual === sub ? 'active' : ''}`;
            btn.innerText = sub;
            btn.onclick = () => filtrarPorSubcategoria(sub, btn);
            subContainer.appendChild(btn);
        });
    }
}

window.filtrarPorSubcategoria = function(sub, elemento) {
    subcategoriaActual = sub;
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    elemento.classList.add('active');
    aplicarFiltros();
}

window.filtrarProductos = function() {
    aplicarFiltros();
}

function aplicarFiltros() {
    let textoBusqueda = document.getElementById('searchInput').value.toLowerCase();
    let filtrados = listaProductos.filter(p => {
        let coincideCategoria = (categoriaActual === 'todos' || p.categoria === categoriaActual);
        let coincideSubcategoria = (subcategoriaActual === 'todos' || p.subcategoria === subcategoriaActual);
        let coincideTexto = p.nombre.toLowerCase().includes(textoBusqueda) || p.desc.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideSubcategoria && coincideTexto;
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
                    <span style="font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase;">${p.subcategoria}</span>
                    <div class="product-img">
                        <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://placehold.co/600x400/f1f3f5/495057?text=Imagen+no+disponible'">
                    </div>
                    <h3 class="product-name">${p.nombre}</h3>
                    <div style="color: #de7921; font-size: 14px; margin-bottom: 5px;">${p.rating}</div>
                    <div class="product-price">${p.precio}</div>
                    <p style="font-size: 13px; color: #555; line-height: 1.4;">${p.desc}</p>
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

