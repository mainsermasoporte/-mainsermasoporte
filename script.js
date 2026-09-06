const productos = [
    { 
        nombre: "Soplete de Inicio Activo Bernzomatic TS4000", 
        categoria: "Consumos y Soldadura", 
        subcategoria: "Sopletes y Gas", 
        rating: "⭐ 4.6 / 5 (6.5k)", 
        desc: "Encendido instantáneo, flama de alta turbulencia para soldadura fuerte y reparaciones rápidas.", 
        imagen: "https://cdn.homedepot.com.mx/productos/122546/122546-d.jpg" 
    },
    { 
        nombre: "Cilindro de Gas Propano Bernzomatic (Paquete de 6)", 
        categoria: "Consumos y Soldadura", 
        subcategoria: "Sopletes y Gas", 
        rating: "⭐ 4.6 / 5 (6.5k)", 
        desc: "Combustible portátil y versátil para antorchas, fontanería y trabajos de campo.", 
        imagen: "https://http2.mlstatic.com/D_NQ_NP_697259-MLM112859202066_072026-O.webp" 
    },
    { 
        nombre: "Varillas de Soldadura de Plata para Cobre", 
        categoria: "Consumos y Soldadura", 
        subcategoria: "Soldadura", 
        rating: "⭐ 4.8 / 5 (1.2k)", 
        desc: "Ideal para uniones herméticas en tuberías de refrigeración y sistemas de aire acondicionado.", 
        imagen: "https://m.media-amazon.com/images/I/41CJ2UlXDAL.jpg" 
    },
    { 
        nombre: "Grasa Roja Ultra Resistente AtomLube (Pack 10)", 
        categoria: "Lubricación y Químicos", 
        subcategoria: "Lubricantes y Grasas", 
        rating: "⭐ 4.7 / 5 (2.6k)", 
        desc: "Lubricante impermeable de alta temperatura para superficies metálicas y rodamientos pesados.", 
        imagen: "https://m.media-amazon.com/images/I/71zNmaRg9lL._SX466_.jpg" 
    },
    { 
        nombre: "Lubricante Multiusos en Spray Penetrante", 
        categoria: "Lubricación y Químicos", 
        subcategoria: "Aerosoles y Limpiadores", 
        rating: "⭐ 4.9 / 5 (8.4k)", 
        desc: "Afloja pernos oxidados al instante, desplaza la humedad y previene la corrosión.", 
        imagen: "https://www.lumienlinea.com/cdn/shop/files/52208_img01.jpg?v=1719677873&width=1214" 
    },
    { 
        nombre: "Multímetro Digital de Pinza True RMS", 
        categoria: "Medición y Diagnóstico", 
        subcategoria: "Electricidad", 
        rating: "⭐ 4.8 / 5 (3.1k)", 
        desc: "Mide corriente AC/DC, voltaje y continuidad de forma segura en tableros eléctricos.", 
        imagen: "https://m.media-amazon.com/images/I/81vnXYiV9CL._AC_UF894,1000_QL80_.jpg" 
    },
    { 
        nombre: "Termómetro Infrarrojo Láser Industrial", 
        categoria: "Medición y Diagnóstico", 
        subcategoria: "Temperatura", 
        rating: "⭐ 4.7 / 5 (1.9k)", 
        desc: "Lectura rápida de temperatura sin contacto para motores, tableros y maquinaria.", 
        imagen: "https://m.media-amazon.com/images/I/71cb9mWIITL._AC_UF894,1000_QL80_.jpg" 
    },
    { 
        nombre: "Juego de Desarmadores Dieléctricos 1000V", 
        categoria: "Herramientas y Equipo", 
        subcategoria: "Herramienta Manual", 
        rating: "⭐ 4.9 / 5 (4.2k)", 
        desc: "Barras aisladas certificadas para trabajos eléctricos con total seguridad.", 
        imagen: "https://guicom.com.mx/wp-content/uploads/2025/10/Juego-de-desarmadores-dielectricos-TRUPER-1000-v1.webp" 
    },
    { 
        nombre: "Flexómetro de Uso Rudo 8 Metros con Imán", 
        categoria: "Herramientas y Equipo", 
        subcategoria: "Medición Manual", 
        rating: "⭐ 4.8 / 5 (2.5k)", 
        desc: "Cinta ancha reforzada con gancho magnético doble para mediciones precisas en solitario.", 
        imagen: "https://http2.mlstatic.com/D_NQ_NP_734477-MLM87469989716_072025-O.webp" 
    },
    { 
        nombre: "Lámpara Frontal Recargable LED 1000 Lúmenes", 
        categoria: "Seguridad Industrial", 
        subcategoria: "Iluminación de Trabajo", 
        rating: "⭐ 4.8 / 5 (3.8k)", 
        desc: "Manos libres con base magnética y luz de alta potencia para espacios confinados y oscuros.", 
        imagen: "https://media.adeo.com/mkp/e2c378acc75903c95627c277128ceef3/media.jpg?width=3000&height=3000&format=jpg&quality=80&fit=bounds" 
    },
    { 
        nombre: "Guantes Anticorte Nivel 5 con Nitrilo", 
        categoria: "Seguridad Industrial", 
        subcategoria: "Protección Personal", 
        rating: "⭐ 4.7 / 5 (5.1k)", 
        desc: "Máxima destreza y agarre firme en superficies aceitosas protegiendo contra abrasiones.", 
        imagen: "https://dermacare.mx/wp-content/uploads/2023/12/51-670-1.jpg" 
    }
];

const subcategoriasPorCategoria = {
    "Herramientas y Equipo": ["Herramienta Manual", "Medición Manual"],
    "Consumos y Soldadura": ["Sopletes y Gas", "Soldadura"],
    "Lubricación y Químicos": ["Lubricantes y Grasas", "Aerosoles y Limpiadores"],
    "Medición y Diagnóstico": ["Electricidad", "Temperatura"],
    "Seguridad Industrial": ["Iluminación de Trabajo", "Protección Personal"]
};

let categoriaActual = 'todos';
let subcategoriaActual = 'todos';

window.onload = function() {
    mostrarProductos(productos);
};

function seleccionarCategoria(cat, elemento) {
    categoriaActual = cat;
    subcategoriaActual = 'todos';

    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');

    const subContainer = document.getElementById('subcategoriesContainer');
    subContainer.innerHTML = '';

    if (cat !== 'todos' && subcategoriasPorCategoria[cat]) {
        let btnTodas = document.createElement('button');
        btnTodas.className = 'sub-btn active';
        btnTodas.innerText = '✨ Todas';
        btnTodas.onclick = () => filtrarPorSubcategoria('todos', btnTodas);
        subContainer.appendChild(btnTodas);

        subcategoriasPorCategoria[cat].forEach(sub => {
            let btn = document.createElement('button');
            btn.className = 'sub-btn';
            btn.innerText = sub;
            btn.onclick = () => filtrarPorSubcategoria(sub, btn);
            subContainer.appendChild(btn);
        });
    }

    aplicarFiltros();
}

function filtrarPorSubcategoria(sub, elemento) {
    subcategoriaActual = sub;
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    elemento.classList.add('active');
    aplicarFiltros();
}

function filtrarProductos() {
    aplicarFiltros();
}

function aplicarFiltros() {
    let textoBusqueda = document.getElementById('searchInput').value.toLowerCase();

    let filtrados = productos.filter(p => {
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
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">No se encontraron herramientas o consumibles con ese criterio.</p>`;
        return;
    }

    lista.forEach(p => {
        let card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div>
                <span class="product-category-tag">${p.subcategoria}</span>
                <div class="product-img">
                    <img src="${p.imagen}" alt="${p.nombre}">
                </div>
                <h3 class="product-name">${p.nombre}</h3>
                <div class="product-rating">${p.rating}</div>
                <p class="product-desc">${p.desc}</p>
            </div>
            <a href="https://www.amazon.com" target="_blank" class="amazon-btn">Ver Producto</a>
        `;
        grid.appendChild(card);
    });
}