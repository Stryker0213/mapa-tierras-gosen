# Mapa interactivo de Tierras Gosén

[![Validate site](https://github.com/Stryker0213/mapa-tierras-gosen/actions/workflows/validate.yml/badge.svg)](https://github.com/Stryker0213/mapa-tierras-gosen/actions/workflows/validate.yml)

Sitio web mobile-first para orientar a los visitantes de Tierras Gosén mediante un mapa ilustrado de la propiedad. Permite descubrir alojamientos, zonas educativas, miradores, senderos y experiencias desde el teléfono, usando búsqueda, filtros y fichas con fotografías.

![Mapa ilustrado de Tierras Gosén](images/mapa.jpg)

## Funcionalidades

- Portada optimizada para dispositivos móviles.
- Mapa interactivo construido con [Leaflet](https://leafletjs.com/).
- Marcadores personalizados por categoría.
- Búsqueda por nombre y descripción, sin distinguir mayúsculas ni tildes.
- Filtros por alojamiento, educativo, mirador, sendero y experiencia.
- Panel inferior adaptable con las fichas de los lugares.
- Fotografías con carga diferida para reducir el consumo de datos.
- Enlaces opcionales de reservación desde cada punto.
- Apertura directa de un lugar mediante `mapa.html?p=<id>`.
- Navegación por teclado y atributos accesibles en los controles principales.
- Validación automática del contenido y pruebas de los filtros.

## Tecnologías

- HTML5 y CSS3
- JavaScript sin frameworks
- Leaflet 1.9.4
- JSON para los puntos de interés
- Node.js 20 para validaciones y pruebas
- GitHub Actions para integración continua

El sitio público es estático y no necesita un servidor de aplicación. Leaflet se carga actualmente desde un CDN, por lo que el mapa requiere conexión a Internet para obtener esa biblioteca.

## Ejecutar el proyecto localmente

El archivo de puntos se obtiene con `fetch`, por lo que el proyecto debe abrirse mediante un servidor HTTP y no directamente con `file://`.

### Opción con Python

```bash
git clone https://github.com/Stryker0213/mapa-tierras-gosen.git
cd mapa-tierras-gosen
python3 -m http.server 8000
```

Después abre:

- Portada: <http://127.0.0.1:8000/index.html>
- Mapa: <http://127.0.0.1:8000/mapa.html>

### Opción con Node.js

```bash
npx serve .
```

## Estructura principal

```text
.
├── .github/workflows/validate.yml  # Validación continua
├── assets/
│   ├── icons/                      # Iconos de categorías
│   └── logos/                      # Recursos de identidad visual
├── css/
│   ├── bienvenida.css              # Estilos de la portada
│   └── styles.css                  # Estilos del mapa
├── data/puntos.json                # Contenido de los puntos de interés
├── images/
│   ├── mapa.jpg                    # Fondo ilustrado del mapa
│   └── Imagenes*/                  # Fotografías de los lugares
├── js/
│   ├── filters.js                  # Búsqueda y filtrado
│   ├── map.js                      # Mapa, marcadores y controles
│   └── firebase-config.js          # Configuración reservada para Firebase
├── scripts/validate-content.mjs    # Validador de datos y archivos
├── test/filters.test.cjs           # Pruebas unitarias
├── index.html                      # Portada
└── mapa.html                       # Experiencia del mapa
```

## Administrar puntos de interés

Actualmente los puntos se administran en [`data/puntos.json`](data/puntos.json). Cada elemento utiliza esta estructura:

```json
{
  "id": "mirador-atardecer",
  "nombre": "Mirador del Atardecer",
  "categoria": "mirador",
  "x": 495,
  "y": 450,
  "descripcion": "Perfecto para ver el atardecer.",
  "imagenes": ["images/ImagenesMirador/mirador-atardecer.webp"],
  "airbnb": "https://www.airbnb.com/rooms/...",
  "activo": true
}
```

### Campos

| Campo | Requerido | Descripción |
| --- | --- | --- |
| `id` | Sí | Identificador único, estable y apto para URL. |
| `nombre` | Sí | Nombre visible del lugar. |
| `categoria` | Sí | `alojamiento`, `educativo`, `mirador`, `sendero` o `experiencia`. |
| `x` | Sí | Posición horizontal dentro del mapa, entre `0` y `1280`. |
| `y` | Sí | Posición vertical de Leaflet, entre `0` y `853`. |
| `descripcion` | Sí | Texto breve que aparece en la ficha y el popup. |
| `imagenes` | Sí | Lista de rutas locales; la interfaz actual utiliza la primera. |
| `airbnb` | No | URL HTTPS para mostrar el botón de reservación. |
| `activo` | Sí | Determina si el punto aparece en el sitio público. |

Leaflet recibe cada posición como `[y, x]`. El sistema de coordenadas corresponde al fondo `images/mapa.jpg`, cuyas dimensiones de referencia son **1280 × 853 px**. Si se cambia esa proporción, también deben revisarse los límites y las posiciones en `js/map.js`.

Después de modificar los datos, ejecuta `npm run check`. El validador detecta identificadores repetidos, categorías incorrectas, coordenadas fuera del mapa, imágenes inexistentes y enlaces inválidos.

## Imágenes de los lugares

Para mantener una apariencia consistente y una descarga rápida en móviles:

- Tamaño recomendado: **1200 × 800 px**.
- Proporción: **3:2 horizontal**.
- Formato preferido: **WebP**.
- Peso recomendado: entre **100 y 250 KB**.
- Mantener el elemento principal cerca del centro, porque las miniaturas usan `object-fit: cover`.
- Usar nombres sin espacios ni caracteres especiales, por ejemplo `sendero-rio.webp`.

## Validaciones

Requiere Node.js 20 o posterior.

```bash
npm run check
```

El comando realiza:

1. Comprobación de sintaxis de JavaScript.
2. Validación de `data/puntos.json` y sus archivos relacionados.
3. Pruebas unitarias de búsqueda y filtrado.

También puedes ejecutar solamente las pruebas:

```bash
npm test
```

GitHub Actions ejecuta las mismas comprobaciones en cada pull request y en los cambios que llegan a `main`.

## Despliegue

Puede publicarse en cualquier servicio de alojamiento estático, como GitHub Pages, Firebase Hosting, Netlify o Cloudflare Pages. El directorio publicado debe ser la raíz del repositorio y debe conservar las rutas relativas de `assets`, `css`, `data`, `images` y `js`.

## Evolución prevista

La siguiente etapa recomendada es un panel administrativo protegido que permita crear, editar y desactivar puntos, colocar marcadores sobre el mapa y subir imágenes sin modificar el código. La arquitectura prevista utiliza:

- Firebase Authentication para el acceso administrativo.
- Cloud Firestore para los datos de los puntos.
- Cloud Storage para las imágenes.
- Reglas de seguridad para limitar las escrituras a usuarios autorizados.

Hasta que esa etapa sea implementada, `data/puntos.json` continúa siendo la fuente oficial del contenido.

## Flujo de contribución

1. Crea una rama desde `main`.
2. Realiza y prueba los cambios localmente.
3. Ejecuta `npm run check`.
4. Abre un pull request hacia `main`.
5. Integra el cambio únicamente cuando `Validate site` haya finalizado correctamente.

## Repositorio

[Stryker0213/mapa-tierras-gosen](https://github.com/Stryker0213/mapa-tierras-gosen)
