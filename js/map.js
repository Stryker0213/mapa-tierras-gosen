const bounds = [[0, 0], [853, 1280]];
const isMobile = () => window.matchMedia('(max-width: 899px)').matches;

const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1.7,
    maxZoom: 2,
    zoomControl: false,
    attributionControl: true
});

L.imageOverlay('images/mapa.jpg', bounds).addTo(map);
L.control.zoom({ position: 'topright' }).addTo(map);
map.fitBounds(bounds, { padding: isMobile() ? [34, 34] : [20, 20] });

const iconos = {
    alojamiento: crearIcono('assets/icons/icons8-casa-48.png'),
    educativo: crearIcono('assets/icons/icons8-hoja-48.png'),
    mirador: crearIcono('assets/icons/icons8-montaña-48.png'),
    sendero: crearIcono('assets/icons/icons8-camino-48.png'),
    experiencia: crearIcono('assets/icons/icons8-fogata-48.png')
};

const etiquetasCategoria = {
    alojamiento: 'Alojamiento',
    educativo: 'Educativo',
    mirador: 'Mirador',
    sendero: 'Sendero',
    experiencia: 'Experiencia'
};

const params = new URLSearchParams(window.location.search);
const puntoParametro = params.get('p');
const buscador = document.getElementById('buscador-puntos');
const listaPuntos = document.getElementById('lista-puntos');
const resultadosContador = document.getElementById('resultados-contador');
const botonesFiltro = document.querySelectorAll('.filtro-btn');
const sidebar = document.getElementById('sidebar-puntos');
const botonSidebar = document.getElementById('toggle-sidebar');

let todosLosPuntos = [];
let marcadoresActivos = [];
let categoriaActiva = 'todos';
let busquedaActiva = '';

function crearIcono(iconUrl) {
    return L.icon({
        iconUrl,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -38]
    });
}

function limpiarMarcadores() {
    marcadoresActivos.forEach(marcador => map.removeLayer(marcador));
    marcadoresActivos = [];
}

function crearContenidoPopup(punto) {
    const contenido = document.createElement('article');
    contenido.className = 'popup-card';

    const titulo = document.createElement('h3');
    titulo.className = 'popup-titulo';
    titulo.textContent = punto.nombre;
    contenido.appendChild(titulo);

    const categoria = document.createElement('p');
    categoria.className = 'popup-categoria';
    categoria.textContent = etiquetasCategoria[punto.categoria] ?? punto.categoria;
    contenido.appendChild(categoria);

    if (punto.imagenes?.length) {
        const imagen = document.createElement('img');
        imagen.className = 'popup-img';
        imagen.src = punto.imagenes[0];
        imagen.alt = punto.nombre;
        imagen.loading = 'lazy';
        contenido.appendChild(imagen);
    }

    const descripcion = document.createElement('p');
    descripcion.className = 'popup-descripcion';
    descripcion.textContent = punto.descripcion;
    contenido.appendChild(descripcion);

    if (punto.airbnb) {
        try {
            const reservaUrl = new URL(punto.airbnb);
            if (reservaUrl.protocol === 'https:') {
                const reserva = document.createElement('a');
                reserva.className = 'popup-btn';
                reserva.href = reservaUrl.href;
                reserva.target = '_blank';
                reserva.rel = 'noopener noreferrer';
                reserva.textContent = 'Reservar ahora';
                contenido.appendChild(reserva);
            }
        } catch (error) {
            console.warn(`URL de reserva inválida para ${punto.id}`, error);
        }
    }

    return contenido;
}

function abrirPunto(punto, marcador) {
    map.setView([punto.y, punto.x], 1);
    marcador.openPopup();

    if (isMobile()) {
        actualizarEstadoSidebar(true);
    }
}

function crearElementoLista(punto, marcador) {
    const item = document.createElement('li');
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Abrir ${punto.nombre} en el mapa`);

    const imagen = document.createElement('img');
    imagen.className = 'point-thumb';
    imagen.src = punto.imagenes?.[0] ?? 'images/mapa.jpg';
    imagen.alt = '';
    imagen.loading = 'lazy';
    item.appendChild(imagen);

    const texto = document.createElement('span');
    texto.className = 'point-copy';

    const categoria = document.createElement('small');
    categoria.textContent = etiquetasCategoria[punto.categoria] ?? punto.categoria;
    texto.appendChild(categoria);

    const nombre = document.createElement('strong');
    nombre.textContent = punto.nombre;
    texto.appendChild(nombre);

    const descripcion = document.createElement('span');
    descripcion.textContent = punto.descripcion;
    texto.appendChild(descripcion);
    item.appendChild(texto);

    const activar = () => abrirPunto(punto, marcador);
    item.addEventListener('click', activar);
    item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activar();
        }
    });

    return item;
}

function actualizarContador(total) {
    resultadosContador.textContent = total === 1
        ? '1 lugar encontrado'
        : `${total} lugares encontrados`;
}

function renderizarPuntos() {
    listaPuntos.replaceChildren();
    limpiarMarcadores();

    const puntosVisibles = PointFilters.filtrarPuntos(
        todosLosPuntos,
        categoriaActiva,
        busquedaActiva
    );

    actualizarContador(puntosVisibles.length);
    let marcadorSeleccionado = null;

    puntosVisibles.forEach(punto => {
        const icono = iconos[punto.categoria] ?? iconos.experiencia;
        const marcador = L.marker([punto.y, punto.x], {
            icon: icono,
            alt: punto.nombre,
            title: punto.nombre
        })
            .addTo(map)
            .bindPopup(crearContenidoPopup(punto), { maxWidth: 290 });

        marcadoresActivos.push(marcador);
        listaPuntos.appendChild(crearElementoLista(punto, marcador));

        if (puntoParametro && punto.id === puntoParametro) {
            marcadorSeleccionado = marcador;
            map.setView([punto.y, punto.x], 1);
        }
    });

    if (puntosVisibles.length === 0) {
        const mensaje = document.createElement('li');
        mensaje.className = 'lista-vacia';
        mensaje.textContent = 'No encontramos lugares con esos filtros.';
        listaPuntos.appendChild(mensaje);
    }

    if (marcadorSeleccionado) {
        marcadorSeleccionado.openPopup();
    }
}

function mostrarErrorCarga() {
    resultadosContador.textContent = 'Contenido no disponible';
    const mensaje = document.createElement('li');
    mensaje.className = 'lista-error';
    mensaje.textContent = 'No fue posible cargar los lugares. Intenta de nuevo más tarde.';
    listaPuntos.replaceChildren(mensaje);
}

function actualizarEstadoSidebar(colapsado) {
    sidebar.classList.toggle('is-collapsed', colapsado);
    botonSidebar.setAttribute('aria-expanded', String(!colapsado));
    botonSidebar.setAttribute('aria-label', colapsado ? 'Mostrar resultados' : 'Ocultar resultados');
    listaPuntos.setAttribute('aria-hidden', String(colapsado));
    listaPuntos.inert = colapsado;

    setTimeout(() => map.invalidateSize(), 280);
}

fetch('data/puntos.json')
    .then(response => {
        if (!response.ok) throw new Error(`Respuesta HTTP ${response.status}`);
        return response.json();
    })
    .then(puntos => {
        if (!Array.isArray(puntos)) throw new Error('El contenido de puntos no es válido');
        todosLosPuntos = puntos;
        renderizarPuntos();
    })
    .catch(error => {
        console.error('Error cargando puntos:', error);
        mostrarErrorCarga();
    });

botonesFiltro.forEach(boton => {
    boton.addEventListener('click', function () {
        botonesFiltro.forEach(item => {
            item.classList.remove('activo');
            item.setAttribute('aria-pressed', 'false');
        });

        this.classList.add('activo');
        this.setAttribute('aria-pressed', 'true');
        categoriaActiva = this.dataset.categoria;
        renderizarPuntos();
    });
});

buscador.addEventListener('input', function () {
    busquedaActiva = this.value;
    renderizarPuntos();
});

botonSidebar.addEventListener('click', () => {
    actualizarEstadoSidebar(!sidebar.classList.contains('is-collapsed'));
});

const ResetControl = L.Control.extend({
    options: { position: 'bottomright' },

    onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-control map-reset-control');
        const button = L.DomUtil.create('button', '', container);
        button.type = 'button';
        button.textContent = '⌖';
        button.setAttribute('aria-label', 'Centrar mapa');

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(button, 'click', event => {
            L.DomEvent.stop(event);
            map.fitBounds(bounds, { padding: isMobile() ? [34, 34] : [20, 20] });
        });

        return container;
    }
});

map.addControl(new ResetControl());

window.addEventListener('resize', () => {
    map.invalidateSize();
});
