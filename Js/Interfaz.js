// =============================================================
//  LUDIK — Interfaz.js
//  Maneja el menú lateral, navegación y permisos por rol.
//  Depende de menu-loader.js, que inyecta el HTML del menú
//  y dispara el evento 'menuCargado' cuando ya está en el DOM.
// =============================================================


// ─────────────────────────────────────────────────────────────
//  TABLA DE PERMISOS
//  Define qué botones del menú puede VER cada rol.
//  - Si el rol no está en la tabla → se comporta como 'defecto'.
//  - Para agregar un rol nuevo: agrega una entrada aquí.
//  - Para cambiar permisos de un rol: edita su lista aquí.
//  - Los botones se identifican por un fragmento de su texto
//    (en minúsculas, sin tildes no importa, se hace includes).
// ─────────────────────────────────────────────────────────────
const PERMISOS = {
    //  Rol           Botones que debe OCULTAR
    admin:          [],   // Ve todo
    docente_apoyo:  ['crear cuentas', 'modificar asignacion', 'modificar cuentas'],
    docente:        ['crear cuentas', 'modificar cuentas', 'registrar un nuevo estudiante', 'registrar un piar'],
    directivo:      ['crear cuentas', 'modificar cuentas', 'registrar un nuevo estudiante', 'registrar un piar', 'valoraciones'],
    padre:          ['crear cuentas', 'modificar cuentas', 'registrar un nuevo estudiante', 'registrar un piar', 'valoraciones', 'actividades', 'asistente ia', 'documentos', 'modificar asignacion'],
    madre:          ['crear cuentas', 'modificar cuentas', 'registrar un nuevo estudiante', 'registrar un piar', 'valoraciones', 'actividades', 'asistente ia', 'documentos', 'modificar asignacion'],
    acudiente:      ['crear cuentas', 'modificar cuentas', 'registrar un nuevo estudiante', 'registrar un piar', 'valoraciones', 'actividades', 'asistente ia', 'documentos', 'modificar asignacion']
};


// ─────────────────────────────────────────────────────────────
//  TABLA DE NAVEGACIÓN
//  Define a qué página va cada botón del menú.
//  Clave: fragmento del texto del botón (minúsculas, sin tildes).
//  Valor: ruta del archivo HTML destino, o una función.
// ─────────────────────────────────────────────────────────────
const NAVEGACION = {
    'regresar a inicio':                   'Interfaz.html',
    'perfil':                              'perfil.html',
    'estudiantes':                         'Estudiantes.html',
    'crear cuentas':                       'Crear_cuentas.html',
    'modificar cuentas':                   'Modificar_cuentas.html',
    'actividades':                         'Ejercicios.html',
    'asistente ia':                        () => window.open('https://ia-ludik-1.onrender.com/', '_blank'),
    'registrar un nuevo estudiante':       'Registrar_estudiante.html',
    'registrar un piar':                   'Registrar_PIAR.html',
    'valoraciones':                        'Valoracion_pedagogica.html',
    'modificar asignacion':                'Modificar_asignacion_docentes.html',
    'documentos':                          'Documentos.html',
    'comunicate':                          'Comunicacion.html',
    'ayuda':                               'Ayuda.html',
    'cerrar sesion':                       () => {
        if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
            localStorage.removeItem('rol');
            localStorage.removeItem('usuario');
            window.location.href = 'Inicio_sesion.html';
        }
    },
};


// ─────────────────────────────────────────────────────────────
//  TABLA DE PÁGINAS
//  Asocia cada archivo HTML con el botón del menú que le
//  corresponde. Ese botón se reemplaza por "⬅️ Regresar a Inicio".
//  - Clave:  nombre exacto del archivo HTML (sin ruta).
//  - Valor:  fragmento del texto del botón que se debe reemplazar
//            (debe coincidir con una clave de NAVEGACION).
//  Para agregar una página nueva, solo añade su línea aquí.
// ─────────────────────────────────────────────────────────────
const PAGINA_A_BOTON = {
    'Estudiantes.html':                  'estudiantes',
    'Crear_cuentas.html':                'crear cuentas',
    'Modificar_cuentas.html':            'modificar cuentas',
    'Ejercicios.html':                   'actividades',
    'Registrar_estudiante.html':         'registrar un nuevo estudiante',
    'Registrar_PIAR.html':               'registrar un piar',
    'Valoracion_pedagogica.html':        'valoraciones',
    'Modificar_asignacion_docentes.html':'modificar asignacion',
    'Documentos.html':                   'documentos',
    'Comunicacion.html':                 'comunicate',
    'Ayuda.html':                        'ayuda',
    'perfil.html':                       'perfil',
};


// ─────────────────────────────────────────────────────────────
//  INICIO — se ejecuta cuando menu-loader inyecta el menú
// ─────────────────────────────────────────────────────────────
document.addEventListener('menuCargado', function () {
    const burger   = document.getElementById('burger');
    const sideMenu = document.getElementById('sideMenu');
    const overlay  = document.getElementById('overlay');

    // — Abrir y cerrar el menú —
    burger.addEventListener('change', function () {
        const abriendo = this.checked;
        sideMenu.classList.toggle('active', abriendo);
        overlay.classList.toggle('active', abriendo);
        document.body.style.overflow = abriendo ? 'hidden' : 'auto';
    });

    overlay.addEventListener('click', cerrarMenu);

    // — Resaltar página actual y colocar botón de regreso —
    marcarPaginaActual();

    // — Aplicar permisos del rol actual —
    aplicarPermisos();

    // — Registrar clicks de navegación —
    sideMenu.addEventListener('click', function (e) {
        const boton = e.target.closest('.menu-button');
        if (!boton) return;

        const texto = normalizar(boton.textContent.trim());

        for (const [clave, destino] of Object.entries(NAVEGACION)) {
            if (texto.includes(normalizar(clave))) {
                if (typeof destino === 'function') destino();
                else window.location.href = destino;
                break;
            }
        }

        cerrarMenu();
    });

    // — Cerrar menú si la ventana se agranda a tamaño escritorio —
    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024 && burger.checked) cerrarMenu();
    });

    function cerrarMenu() {
        burger.checked = false;
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});


// ─────────────────────────────────────────────────────────────
//  PÁGINA ACTUAL: inserta "⬅️ Regresar a Inicio" al principio
//  del menú cuando el usuario NO está en Interfaz.html.
//  El botón original de la página sigue visible en su lugar.
// ─────────────────────────────────────────────────────────────
function marcarPaginaActual() {
    const paginaActual = window.location.pathname.split('/').pop() || 'Interfaz.html';

    // Si estamos en el inicio no hace falta el botón de regreso
    if (!PAGINA_A_BOTON[paginaActual]) return;

    const menuButtons = document.querySelector('.menu-buttons');
    if (!menuButtons) return;

    // Crear el botón de regreso
    const btnRegresar = document.createElement('button');
    btnRegresar.className = 'menu-button menu-button--regresar';
    btnRegresar.innerHTML = '<span class="menu-icon">⬅️</span> Regresar a Inicio';
    btnRegresar.addEventListener('click', function () {
        window.location.href = 'Interfaz.html';
    });

    // Insertarlo como primer elemento del menú
    menuButtons.insertBefore(btnRegresar, menuButtons.firstChild);
}


// ─────────────────────────────────────────────────────────────
//  PERMISOS: ocultar botones del menú según el rol del usuario
// ─────────────────────────────────────────────────────────────
function aplicarPermisos() {
    const rol = (localStorage.getItem('rol') || '').toLowerCase().trim();
    const bloqueados = (PERMISOS[rol] ?? PERMISOS.defecto).map(normalizar);

    document.querySelectorAll('.menu-button').forEach(function (boton) {
        const texto = normalizar(boton.textContent.trim());
        const ocultar = bloqueados.some(clave => texto.includes(clave));
        boton.style.display = ocultar ? 'none' : '';
    });
}


// ─────────────────────────────────────────────────────────────
//  ACCIONES RÁPIDAS  (solo actúa si la página tiene #accionesRapidas)
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const contenedor = document.getElementById('accionesRapidas');
    if (!contenedor) return;

    const rol = (localStorage.getItem('rol') || '').toLowerCase();
    const esPadreOAcudiente = ['padre', 'madre', 'acudiente'].includes(rol);

    // Actualizar número de estudiantes
    fetch('php/contar_estudiantes.php')
        .then(r => r.json())
        .then(data => {
            const el = document.getElementById('numEstudiantes');
            if (el && data.total !== undefined) el.textContent = data.total;
        })
        .catch(() => {});

    // Tarjetas según rol
    const tarjetas = esPadreOAcudiente
        ? [
            { icono: '❓', titulo: 'Ayuda',        desc: 'Preguntas frecuentes sobre la plataforma', btn: 'Ir a Ayuda',       href: 'Ayuda.html' },
            { icono: '📊', titulo: 'Ver Progreso',  desc: 'Consulta el progreso de tu hijo',           btn: 'Ver Progreso',     href: 'Estudiantes.html' },
            { icono: '💬', titulo: 'Comunícate',    desc: 'Comunícate con docentes y directivos',      btn: 'Abrir Chat',       href: 'Comunicacion.html' },
        ]
        : [
            { icono: '🤖', titulo: 'IA Nubi',                  desc: 'Genera actividades adaptadas con IA',        btn: 'Comenzar',         href: () => window.open('https://ia-ludik-1.onrender.com/', '_blank') },
            { icono: '📊', titulo: 'Valoraciones Pedagógicas', desc: 'Crea valoraciones para tus estudiantes',     btn: 'Crear Valoración', href: 'Valoracion_pedagogica.html' },
            { icono: '💬', titulo: 'Comunícate',               desc: 'Comunícate con padres y estudiantes',        btn: 'Abrir Chat',       href: 'Comunicacion.html' },
        ];

    contenedor.innerHTML = tarjetas.map((t, i) => `
        <div class="action-card">
            <div class="action-icon">${t.icono}</div>
            <h3>${t.titulo}</h3>
            <p>${t.desc}</p>
            <button class="action-btn" data-accion="${i}">${t.btn}</button>
        </div>
    `).join('');

    contenedor.addEventListener('click', function (e) {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const destino = tarjetas[btn.dataset.accion]?.href;
        if (!destino) return;
        if (typeof destino === 'function') destino();
        else window.location.href = destino;
    });
});


// ─────────────────────────────────────────────────────────────
//  UTILIDAD: quitar tildes y pasar a minúsculas para comparar
// ─────────────────────────────────────────────────────────────
function normalizar(texto) {
    return texto.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}