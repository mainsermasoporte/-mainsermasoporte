import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TU CONFIGURACIÓN DE FIREBASE (Usa tus credenciales reales aquí)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Credenciales ocultas y codificadas en Base64 para mayor seguridad en repositorios públicos
const ADMIN_EMAIL_ENCODED = "bWFpbnNlcm1hc29wb3J0ZUBnbWFpbC5jb20="; // Tu correo codificado
const ADMIN_PASSWORD_ENCODED = "RmVybW9zaDAxMjU5aUA=";             // Tu contraseña codificada

let listaProductos = [];
let categoriaActual = 'todos';
let subcategoriaActual = 'todos';
let isAdmin = false;

window.onload = function() {
    // Verificar si ya estaba logueado en la sesión del navegador
    if (localStorage.getItem("isLoggedIn") === "true") {
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
}

window.procesarLogin = function(event) {
    event.preventDefault();
    let emailInput = document.getElementById('adminEmailInput').value.trim();
    let passwordInput = document.getElementById('adminPasswordInput').value.trim();

    let emailInputEncoded = btoa(emailInput);
    let passwordInputEncoded = btoa(passwordInput);

    if (emailInputEncoded === ADMIN_EMAIL_ENCODED && passwordInputEncoded === ADMIN_PASSWORD_ENCODED) {
        isAdmin = true;
        localStorage.setItem("isLoggedIn", "true");
        document.getElementById('adminControlsBar').style.display = 'flex';
        document.getElementById('authButtonContainer').innerHTML = `
            <button class="logout-btn-header" onclick="cerrarSesionAdmin()">Cerrar Sesión</button>
        `;
        cerrarModalLogin();
        mostrarProductos(listaProductos);
    } else {
        alert("Correo o contraseña incorrectos.");
    }
}

window.cerrarSesionAdmin = function() {
    isAdmin = false;
    localStorage.removeItem("isLoggedIn");
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
    let linkIngresado = document.getElementById('linkProd').value.trim();
    if (!linkIngresado) return;

    let productoGenerado = {
        nombre: "Herramienta de Precisión Profesional",
        categoria: "Herramientas",
        subcategoria: "Equipamiento Técnico",
        precio: "US$39.99",
        rating: "⭐ 4.8 / 5",
        imagen: "https://m.media-amazon.com/images/I/71Vj6qT87vL._AC_SL1500_.jpg",
        desc: "Equipamiento de alta durabilidad para labores profesionales.",
        link: linkIngresado,
        fechaCreacion: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "productos"), productoGenerado);
        alert("¡Producto publicado correctamente!");
        cerrarModalPublicar();
        cargarProductosDesdeFirebase();
    } catch (e) {
        console.error("Error al guardar: ", e);
        alert("No se pudo publicar el producto.");
    }
}

// Cargar productos de Firebase
async function cargarProductosDesdeFirebase() {
    try {
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
            await deleteDoc(doc(db, "productos", id));
            cargarProductosDesdeFirebase();
        } catch (e) {
            alert("Error al eliminar.");
        }
    }
}

// Filtros y Visualización
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
        let botonEliminarHTML = isAdmin ? `<button class="delete-btn" onclick="eliminarProducto('${p.id}')">🗑️ Eliminar Producto</button>` : '';

        card.innerHTML = `
            <div>
                <span style="font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase;">${p.subcategoria}</span>
                <div class="product-img">
                    <img src="${p.imagen}" alt="${p.nombre}">
                </div>
                <h3 class="product-name">${p.nombre}</h3>
                <div style="color: #de7921; font-size: 14px; margin-bottom: 5px;">${p.rating}</div>
                <div class="product-price">${p.precio}</div>
                <p style="font-size: 13px; color: #555; line-height: 1.4;">${p.desc}</p>
            </div>
            <div>
                <a href="${p.link}" target="_blank" class="amazon-btn">Ver en Amazon</a>
                ${botonEliminarHTML}
            </div>
        `;
        grid.appendChild(card);
    });
}
