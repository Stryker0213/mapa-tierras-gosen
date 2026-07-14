(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    root.PointFilters = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function normalizarTexto(valor) {
        return String(valor ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function filtrarPuntos(puntos, categoria = 'todos', busqueda = '') {
        const texto = normalizarTexto(busqueda);

        return puntos.filter(punto => {
            if (!punto.activo) return false;
            if (categoria !== 'todos' && punto.categoria !== categoria) return false;

            const contenido = normalizarTexto(`${punto.nombre} ${punto.descripcion}`);
            return !texto || contenido.includes(texto);
        });
    }

    return Object.freeze({
        filtrarPuntos,
        normalizarTexto
    });
}));
