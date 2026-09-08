const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../js/filters.js', `file://${__filename}`), 'utf8'), context);
const { filtrarPuntos, normalizarTexto } = context.PointFilters;

const points = [
    { nombre: 'Cabaña El Domo', descripcion: 'Hospedaje ecológico', categoria: 'alojamiento', activo: true },
    { nombre: 'Mirador del Atardecer', descripcion: 'Vista panorámica', categoria: 'mirador', activo: true },
    { nombre: 'Mirador cerrado', descripcion: 'No visible', categoria: 'mirador', activo: false }
];

test('normaliza mayúsculas y tildes', () => {
    assert.equal(normalizarTexto('  CABAÑA  '), 'cabana');
});

test('combina categoría y búsqueda sin perder estado', () => {
    assert.deepEqual(filtrarPuntos(points, 'alojamiento', 'cabaña'), [points[0]]);
    assert.deepEqual(filtrarPuntos(points, 'alojamiento', 'mirador'), []);
});

test('busca también en la descripción y omite puntos inactivos', () => {
    assert.deepEqual(filtrarPuntos(points, 'todos', 'panoramica'), [points[1]]);
    assert.equal(filtrarPuntos(points, 'todos', 'cerrado').length, 0);
});
