import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const categories = new Set(['alojamiento', 'educativo', 'mirador', 'sendero', 'experiencia']);
const errors = [];

function assert(condition, message) {
    if (!condition) errors.push(message);
}

async function fileExists(relativePath) {
    const absolutePath = path.resolve(root, relativePath);
    const pathFromRoot = path.relative(root, absolutePath);
    if (pathFromRoot.startsWith('..') || path.isAbsolute(pathFromRoot)) return false;

    try {
        await access(absolutePath);
        return true;
    } catch {
        return false;
    }
}

const pointsPath = path.join(root, 'data', 'puntos.json');
const points = JSON.parse(await readFile(pointsPath, 'utf8'));
assert(Array.isArray(points), 'data/puntos.json debe contener un arreglo.');

const ids = new Set();
for (const [index, point] of points.entries()) {
    const label = `puntos[${index}]`;
    assert(typeof point.id === 'string' && point.id.length > 0, `${label}.id es obligatorio.`);
    assert(!ids.has(point.id), `${label}.id está duplicado: ${point.id}.`);
    ids.add(point.id);

    assert(typeof point.nombre === 'string' && point.nombre.length > 0, `${label}.nombre es obligatorio.`);
    assert(typeof point.descripcion === 'string' && point.descripcion.length > 0, `${label}.descripcion es obligatoria.`);
    assert(categories.has(point.categoria), `${label}.categoria no es válida: ${point.categoria}.`);
    assert(Number.isFinite(point.x) && point.x >= 0 && point.x <= 1280, `${label}.x está fuera del mapa.`);
    assert(Number.isFinite(point.y) && point.y >= 0 && point.y <= 853, `${label}.y está fuera del mapa.`);
    assert(typeof point.activo === 'boolean', `${label}.activo debe ser booleano.`);
    assert(Array.isArray(point.imagenes) && point.imagenes.length > 0, `${label}.imagenes debe contener al menos una ruta.`);

    for (const image of point.imagenes ?? []) {
        assert(await fileExists(image), `${label} referencia una imagen inexistente: ${image}.`);
    }

    if (point.airbnb) {
        try {
            const url = new URL(point.airbnb);
            assert(url.protocol === 'https:', `${label}.airbnb debe usar HTTPS.`);
        } catch {
            errors.push(`${label}.airbnb no es una URL válida.`);
        }
    }
}

for (const htmlFile of ['index.html', 'mapa.html']) {
    const html = await readFile(path.join(root, htmlFile), 'utf8');
    const references = html.matchAll(/(?:href|src)="([^"#]+)"/g);

    for (const [, reference] of references) {
        if (/^(?:https?:|data:|mailto:|tel:)/.test(reference)) continue;
        if (reference === '/') continue;
        const localPath = reference.split(/[?#]/, 1)[0];
        assert(await fileExists(localPath), `${htmlFile} referencia un archivo inexistente: ${localPath}.`);
    }

    const blankLinks = html.matchAll(/<a\s+[^>]*target="_blank"[^>]*>/g);
    for (const [link] of blankLinks) {
        assert(/rel="[^"]*noopener[^"]*"/.test(link), `${htmlFile} contiene target="_blank" sin rel="noopener".`);
    }
}

if (errors.length > 0) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Contenido validado: ${points.length} puntos de interés.`);
}
