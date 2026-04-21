//import { initializeFirebase } from '/js/firebase-config.js';
//import {collection, getDocs} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


//Inicializa el mapa utilizando Leaflet, estableciendo un sistema de coordenadas simple y agregando un control de pantalla completa. Luego, carga una imagen como capa del mapa y ajusta la vista para mostrar toda el área del mapa.
var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1.7,
    maxZoom: 2,
    zoomControl: false, 
    fullscreenControl: true
});
L.control.zoom({ position: 'topright' }).addTo(map);
//Agrega un evento al mapa que se dispara cuando el usuario entra o sale del modo de pantalla completa. Cuando esto ocurre, se llama a la función "invalidateSize" después de un breve retraso para asegurarse de que el mapa se redimensione correctamente y se muestre adecuadamente en la pantalla completa.
map.on('fullscreenchange', function () {
    setTimeout(function () {
        map.invalidateSize();
    }, 200);
});
//Define los límites del mapa y carga una imagen como capa del mapa utilizando esos límites. Luego, ajusta la vista del mapa para mostrar toda el área definida por los límites, con un poco de espacio adicional alrededor.
var bounds = [[0, 0], [853, 1280]];
var boundsIniciales = bounds;
var image = L.imageOverlay('images/mapa.jpg', bounds).addTo(map);

    map.fitBounds(bounds,{
        padding: [20, 20],
    });
const esMovil = window.innerWidth < 768;
    map.fitBounds(bounds, {
        padding: esMovil ? [40, 40] : [20, 20],
    });
//Agrega un objeto "iconos" que define diferentes iconos personalizados para cada categoría de puntos de interés (alojamiento, educativo, mirador, sendero y experiencia). Cada icono se crea utilizando la función "L.icon" de Leaflet, especificando la URL de la imagen del icono, su tamaño, el punto de anclaje y el punto de anclaje del popup.
const iconos = {
    alojamiento: L.icon({
        iconUrl: 'assets/icons/icons8-casa-48.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    }),

    educativo: L.icon({
        iconUrl: 'assets/icons/icons8-hoja-48.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    }),

    mirador: L.icon({
        iconUrl: 'assets/icons/icons8-montaña-48.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    }),

    sendero: L.icon({
        iconUrl: 'assets/icons/icons8-camino-48.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    }),

    experiencia: L.icon({
        iconUrl: 'assets/icons/icons8-fogata-48.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    }),
    
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
};

const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');

    div.innerHTML = `
        <div class="legend-card">
            <h4>Leyenda</h4>
            <div class="legend-item">
                <img src="assets/icons/icons8-casa-48.png" alt="Alojamiento">
                <span>Alojamiento</span>
            </div>
            <div class="legend-item">
                <img src="assets/icons/icons8-hoja-48.png" alt="Educativo">
                <span>Educativo</span>
            </div>
            <div class="legend-item">
                <img src="assets/icons/icons8-montaña-48.png" alt="Mirador">
                <span>Mirador</span>
            </div>
            <div class="legend-item">
                <img src="assets/icons/icons8-camino-48.png" alt="Sendero">
                <span>Sendero</span>
            </div>
            <div class="legend-item">
                <img src="assets/icons/icons8-fogata-48.png" alt="Experiencia">
                <span>Experiencia</span>
            </div>
        </div>
    `;

    L.DomEvent.disableClickPropagation(div);
    return div;
};

legend.addTo(map);


const params = new URLSearchParams(window.location.search);
const puntoParametro = params.get('p');

const buscador = document.getElementById('buscador-puntos');
const listaPuntos = document.getElementById('lista-puntos');
const botonesFiltro = document.querySelectorAll('.filtro-btn');
const botonReset = document.getElementById('btn-reset-map');


let todosLosPuntos = [];
let marcadoresActivos = [];
//La función "limpiarMarcadores" se encarga de eliminar todos los marcadores activos del mapa y limpiar la lista de marcadores para prepararse para una nueva renderización de puntos.
function limpiarMarcadores() {
    marcadoresActivos.forEach(marcador => {
        map.removeLayer(marcador);
    });
    marcadoresActivos = [];
}
//La función "renderizarPuntos" es la encargada de mostrar los puntos de interés en el mapa y en la lista lateral, aplicando los filtros seleccionados por el usuario (categoría y texto de búsqueda). Primero limpia la lista y los marcadores activos, luego recorre todos los puntos de interés y verifica si cumplen con los filtros. Si un punto cumple con los filtros, se crea un marcador para ese punto, se agrega al mapa y se muestra en la lista lateral. Además, si el punto coincide con el parámetro de la URL, se centra el mapa en ese punto y se abre su popup automáticamente.
function renderizarPuntos(categoriaSeleccionada = 'todos',textoBusqueda = '') {
    listaPuntos.innerHTML = '';
    limpiarMarcadores();

    let marcadorSeleccionado = null;
    //Recorre todos los puntos de interés y aplica los filtros seleccionados por el usuario (categoría y texto de búsqueda). Si un punto no cumple con los filtros, se omite y no se muestra en el mapa ni en la lista lateral.
    todosLosPuntos.forEach(punto => {
        if (!punto.activo) return;
        if (categoriaSeleccionada !== 'todos' && punto.categoria !== categoriaSeleccionada) {
            return;
        }
        //Si el usuario ha ingresado texto en el buscador, se verifica si el nombre del punto de interés incluye ese texto (ignorando mayúsculas y minúsculas). Si no lo incluye, se omite ese punto.
        if(textoBusqueda){
            const texto = textoBusqueda.toLowerCase();
            if(!punto.nombre.toLowerCase().includes(texto)){
            return;
            }
        }
        //Construye el contenido del popup para cada punto, incluyendo su nombre, categoría, descripción y, si están disponibles, una imagen y un enlace de Airbnb para reservar.
        let contenidoPopup = `
        <div style="max-width:300px; font-size:14px;">
            <h3>${punto.nombre}</h3>
            <p><strong>Categoría:</strong> ${punto.categoria}</p>
            <p>${punto.descripcion}</p>
        `;
        //Si el punto tiene imágenes, se muestra la primera imagen en el popup.
        if (punto.imagenes && punto.imagenes.length > 0) {
            contenidoPopup += `
            <div style="margin-top:8px;">
                <img src="${punto.imagenes[0]}" style="width:100%; border-radius:8px; margin-top:8px;">
            </div>
            `;
        }
        //Si el punto tiene un enlace de Airbnb, se agrega un enlace al popup para reservar.
        if (punto.airbnb) {
            contenidoPopup += `
            <br>
            <a href="${punto.airbnb}" target="_blank" class="popup-btn">Reservar ahora</a>
            `;
        }
        contenidoPopup += `</div>`;
        //Crea un marcador para cada punto que cumpla con los filtros aplicados, lo agrega al mapa y le asigna un popup con la información del punto.
       /* const marcador = L.marker([punto.y, punto.x])
            .addTo(map)
            .bindPopup(contenidoPopup);

        marcadoresActivos.push(marcador);*/

        const icono = iconos[punto.categoria] || iconos.experiencia;
        const marcador = L.marker([punto.y, punto.x], { icon: icono })
            .addTo(map)
            .bindPopup(contenidoPopup);
        marcadoresActivos.push(marcador);

            marcador.on('add', function () {
        const el = marcador._icon;
        if (el) {
            el.style.transform = 'scale(0)';
            setTimeout(() => {
                el.style.transition = 'transform 0.3s ease';
                el.style.transform = 'scale(1)';
            }, 50);
        }
    });


        //Agrega cada punto a la lista lateral con un evento de clic que centra el mapa en el marcador correspondiente y abre su popup.
        const itemLista = document.createElement('li');
                //Construye el contenido de cada elemento de la lista lateral, mostrando el nombre del punto de interés en negrita y su categoría en texto más pequeño debajo.
                itemLista.innerHTML = `
                    <strong>${punto.nombre}</strong><br>
                    <small>${punto.categoria}</small>
                `;
                //Agrega un evento de clic a cada elemento de la lista lateral que centra el mapa en el marcador correspondiente y abre su popup.
                itemLista.addEventListener('click', () => {
                    map.setView([punto.y, punto.x], 1);
                    marcador.openPopup();
                });
        listaPuntos.appendChild(itemLista);
        //Hace que si el punto actual coincide con el parámetro de la URL, se guarde su marcador en la variable "marcadorSeleccionado" y se centre el mapa en ese punto.
        if (puntoParametro && punto.id === puntoParametro) {
            marcadorSeleccionado = marcador;
            map.setView([punto.y, punto.x], 1);
        }
    });
    //Hace que si se ha seleccionado un marcador a través del parámetro de la URL, se abra su popup automáticamente al cargar el mapa.
    if (marcadorSeleccionado) {
        marcadorSeleccionado.openPopup();
    }
}
//Hace una solicitud para cargar el archivo JSON que contiene los puntos de interés y, una vez cargados, los almacena en la variable "todosLosPuntos" y llama a la función "renderizarPuntos" para mostrarlos en el mapa y en la lista lateral.
fetch('data/puntos.json')
    .then(response => response.json())
    .then(puntos => {
        todosLosPuntos = puntos;
        renderizarPuntos();
    })
    //Captura cualquier error que ocurra durante la carga de los puntos y lo muestra en la consola
    .catch(error => console.error('Error cargando puntos:', error));
   
   
    /*
//La función "cargarPuntosDesdeFirestore" es una función asíncrona que se encarga de cargar los puntos de interés desde una colección de Firestore llamada "puntos_interes". Utiliza la función "getDocs" para obtener los documentos de la colección y luego recorre cada documento para almacenar sus datos en la variable "todosLosPuntos". Después de cargar los puntos, llama a la función "renderizarPuntos" para mostrarlos en el mapa y en la lista lateral. Si ocurre algún error durante la carga, se captura y se muestra en la consola.
async function cargarPuntosDesdeFirestore() {
    try {
        const querySnapshot = await getDocs(collection(db, "puntos_interes"));
        todosLosPuntos = [];

        querySnapshot.forEach((doc) => {
            todosLosPuntos.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderizarPuntos();
    } catch (error) {
        console.error("Error cargando puntos desde Firestore:", error);
    }
    
}*/
//cargarPuntosDesdeFirestore();

//Agrega un evento de clic a cada botón de filtro que, al ser clicado, elimina la clase 'activo' de todos los botones, agrega la clase 'activo' al botón clicado y llama a la función "renderizarPuntos" con la categoría seleccionada para actualizar el mapa y la lista lateral según el filtro aplicado.
botonesFiltro.forEach(boton => {
    boton.addEventListener('click', function () {
        // Quitar la clase 'activo' de todos los botones
        botonesFiltro.forEach(btn => btn.classList.remove('activo'));
        // Agregar la clase 'activo' al botón clicado
        this.classList.add('activo');
        // Renderizar los puntos según la categoría seleccionada
        renderizarPuntos(this.getAttribute('data-categoria'));
    });
});
//Agrega un evento de clic al botón de reinicio del mapa que, al ser clicado, centra el mapa en los límites definidos inicialmente y aplica un poco de espacio adicional alrededor.
const ResetControl = L.Control.extend({
    options: {
        position: 'topright'
    },

    onAdd: function () {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');

        btn.innerHTML = '⟳';
        btn.title = 'Centrar mapa';

        btn.style.background = 'white';
        btn.style.width = '34px';
        btn.style.height = '34px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '18px';

        L.DomEvent.on(btn, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
            map.fitBounds(bounds, {
                padding: [20, 20]
            });
        });

        return btn;
    }
});

map.addControl(new ResetControl());
//Agrega un evento de entrada al campo de búsqueda que filtra los puntos de interés en tiempo real a medida que el usuario escribe. Obtiene el texto ingresado, la categoría seleccionada actualmente y llama a la función "renderizarPuntos" con esos parámetros para actualizar el mapa y la lista lateral.
buscador.addEventListener('input', function(){

    const texto = this.value;
    const botonActivo = document.querySelector('.filtro-btn.activo');
    const categoria = botonActivo.dataset.categoria;
    renderizarPuntos(categoria, texto);

});

const botonSidebar = document.getElementById('toggle-sidebar');
const sidebar = document.querySelector('.sidebar');

//Agrega un evento de clic al botón que alterna la visibilidad de la barra lateral. Cuando se hace clic, se agrega o quita la clase 'oculto' a la barra lateral para mostrar u ocultar la lista de puntos. Después de un breve retraso, se llama a la función "invalidateSize" del mapa para asegurarse de que el mapa se redimensione correctamente y se muestre adecuadamente después de cambiar la visibilidad de la barra lateral.
botonSidebar.addEventListener('click', function () {
    sidebar.classList.toggle('oculto');

    if (sidebar.classList.contains('oculto')) {
        botonSidebar.textContent = '→';
    } else {
        botonSidebar.textContent = '☰';
    }

    setTimeout(function () {
        map.invalidateSize();
    }, 300);
});

//Funcion temporal para mostrar las coordenadas al hacer clic en el mapa, se crea un marcador temporal que se actualiza cada vez que se hace clic en el mapa, Solo se usa para pruebas y calcular coordenadas de puntos de interés, no forma parte de la funcionalidad final del mapa interactivo.
/*let marcadorTemporal;

map.on('click', function (e) {
    const y = Math.round(e.latlng.lat);
    const x = Math.round(e.latlng.lng);

    if (marcadorTemporal) {
        map.removeLayer(marcadorTemporal);
    }

    marcadorTemporal = L.marker([y, x]).addTo(map)
        .bindPopup(`x: ${x}, y: ${y}`)
        .openPopup();

    console.log(`x: ${x}, y: ${y}`);
});*/

const urlParams = new URLSearchParams(window.location.search);
const puntoParametro = params.get('p');
if (puntoParametro) {
    const botonTodos = todosLosPuntos.find(p => p.id === puntoParametro);
    if (botonTodos) {
        map.setView([botonTodos.lat, botonTodos.lng], 1);

        L.popup()
            .setLatLng([botonTodos.lat, botonTodos.lng])
            .setContent(`<b${puntoParametro.nombre}</b>`)
            .openOn(map);
    }
}