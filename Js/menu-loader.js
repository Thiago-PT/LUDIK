(function () {
    'use strict';

    /**
     * Carga el archivo menu.html e inyecta su contenido
     * al inicio del <body>, antes del contenido propio de la página.
     */
    function cargarMenu() {
        fetch('menu.html')
            .then(function (respuesta) {
                if (!respuesta.ok) {
                    throw new Error('No se pudo cargar menu.html — código HTTP: ' + respuesta.status);
                }
                return respuesta.text();
            })
            .then(function (html) {
                // Extraer solo el contenido dentro del <body> de menu.html
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const nodos = Array.from(doc.body.childNodes);

                // Insertar los nodos al inicio del body actual,
                // antes del primer hijo existente (el contenido de la página)
                const primerHijo = document.body.firstChild;
                nodos.forEach(function (nodo) {
                    document.body.insertBefore(nodo.cloneNode(true), primerHijo);
                });

                console.log('✅ menu-loader.js: Menú cargado correctamente.');

                // Disparar evento personalizado para que Interfaz.js sepa
                // que el menú ya está en el DOM y puede inicializarse
                document.dispatchEvent(new Event('menuCargado'));
            })
            .catch(function (error) {
                console.error('❌ menu-loader.js: Error al cargar el menú →', error);
            });
    }

    // Ejecutar tan pronto el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cargarMenu);
    } else {
        // El DOM ya está listo (el script se cargó tarde)
        cargarMenu();
    }

})();