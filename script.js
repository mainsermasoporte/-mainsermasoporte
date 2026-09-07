import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TU CONFIGURACIÓN DE FIREBASE (Asegúrate de que sean tus credenciales reales)
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID",
    measurementId: "TU_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let listaProductos = [];
let categoriaActual = 'todos';
let subcategoriaActual = 'todos';
let isAdmin = false;

window.onload = function() {
    cargarProductosDesdeFirebase();
    
    // Detecta automáticamente si hay una sesión iniciada de Google
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario autenticado correctamente
            isAdmin = true;
            document.getElementById('adminControlsBar').style.display = 'flex';
            document.getElementById('authButtonContainer').innerHTML = `
                <button class="logout-btn-header" onclick="cerrarSesionAdmin()">Cerrar Sesión</button>
            `;
        } else {
            // Nadie ha iniciado sesión (muestra el engranaje)
            isAdmin = false;
            document.getElementById('adminControlsBar').style.display = 'none';
            document.getElementById('authButtonContainer').innerHTML = `
                <button class="admin-access-btn" onclick="abrirModalLogin()" title="Panel de Administración">⚙️</button>
            `;
        }
        mostrarProductos(listaProductos);
    });
};

// Al hacer clic en el engranaje, abre directamente la ventana segura de Google
window.abrirModalLogin = function() {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Sesión iniciada con éxito");
        })
        .catch((error) => {
            console.error("Error al iniciar sesión: ", error);
            alert("No se pudo iniciar sesión o no estás autorizado.");
        });
}

// Función de Cerrar Sesión
window.cerrarSesionAdmin = function() {
    signOut(auth).then(() => {
        cerrarModalPublicar();
    }).catch((error) => {
        console.error("Error al cerrar sesión", error);
    });
}

// Control de la ventana emergente compacta de Publicación
window.abrirModalPublicar = function() {
    document.getElementById('publishModal').style.display = 'flex';
}

window.cerrarModalPublicar = function() {
    document.getElementById('publishModal').style.display = 'none';
    document.getElementById('productForm').reset();
}

// Publicación Automática por Link
window.publicarProductoAutomatico = async function(event) {
    event.preventDefault();

    let linkIngresado = document.getElementById('linkProd').value.trim();
    if (!linkIngresado) {
        alert("Por favor, ingresa un link de afiliado válido.");
        return;
    }

    let productoGenerado = {
        nombre: "Herramienta de Precisión Profesional para Mantenimiento",
        categoria: "Herramientas",
        subcategoria: "Equipamiento Técnico",
        precio: "US$39.99",
        rating: "⭐ 4.8 / 5",
        imagen: "https://m.media-amazon.com/images/I/71Vj6qT87vL._AC_SL1500_.jpg",
        desc: "Equipamiento de alta durabilidad para labores profesionales y de uso rudo en campo.",
        link: linkIngresado,
        fechaCreacion: new Date().toISOString()
    };

    try {
        // Firebase validará automáticamente en las reglas si tu correo está autorizado para escribir
        await addDoc(collection(db, "productos"), productoGenerado);
        alert("¡Producto publicado correctamente!");
        cerrarModalPublicar();
        cargarProductosDesdeFirebase();
    } catch (e) {
        console.error("Error al guardar en Firebase: ", e);
        alert("Acción denegada: Tu cuenta no está autorizada para publicar.");
    }
}

// Cargar productos de Firebase
async function cargarProductosDesdeFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        listaProductos = [];

        querySnapshot.forEach((documento) => {
            let p = { id: documento.id, ...documento.data() };
            listaProductos.push(p);
        });

        generarFiltrosDinamicos();
        aplicarFiltros();
    } catch (e) {
        console.error("Error al cargar productos: ", e);
    }
}

// Eliminar producto manualmente
window.eliminarProducto = async function(id) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        try {
            await deleteDoc(doc(db, "productos", id));
            cargarProductosDesdeFirebase();
        } catch (e) {
            alert("No tienes permisos para eliminar este producto.");
        }
    }
}

// Generar filtros dinámicos basados en la BD
function generarFiltrosDinamicos() {
    let nav = document.getElementById('mainCategories');
    nav.innerHTML = `<button class="cat-btn ${categoriaActual === 'todos' ? 'active' : ''}" onclick="seleccionarCategoria('todos', this)">🗂️ Todo el Catálogo</button>`;

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
        let coincideTexto = p.nombre.toLowerCase().includes(textoBusqueda) || p.desc.toLowerCase().includes(textoBusqueda) || p.subcategoria.toLowerCase().includes(textoBusqueda);

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
        
        // Si el usuario está autenticado, muestra el botón de eliminar junto a su respectivo producto
        let botonEliminarHTML = isAdmin ? `<button class="delete-btn" onclick="eliminarProducto('${p.id}')">🗑️ Eliminar Producto</button>` : '';

        card.innerHTML = `
            <div>
                <span class="product-category-tag">${p.subcategoria}</span>
                <div class="product-img">
                    <img src="${p.imagen}" alt="${p.nombre}">
                </div>
                <h3 class="product-name">${p.nombre}</h3>
                <div class="product-rating">${p.rating}</div>
                <div class="product-price">${p.precio}</div>
                <p class="product-desc">${p.desc}</p>
            </div>
            <div>
                <a href="${p.link}" target="_blank" class="amazon-btn">Ver en Amazon</a>
                ${botonEliminarHTML}
            </div>
        `;
        grid.appendChild(card);
    });
}
