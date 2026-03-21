// =============================================================
//  LUDIK — auth-guard.js
//  Protege cualquier página .html consultando al servidor.
//
//  USO — añadir en el <head> de cada página a proteger:
//      <script src="js/auth-guard.js"></script>
//
//  Comportamiento según respuesta del servidor:
//  · Sin sesión activa          → redirige a Inicio_sesion.html
//  · Sesión OK pero sin permiso → redirige a Interfaz.html
//  · Sesión OK y con permiso    → muestra la página normalmente
// =============================================================

(function () {
    'use strict';

    // Ocultar la página mientras se verifica, para evitar
    // que el usuario vea contenido antes de la validación.
    document.documentElement.style.visibility = 'hidden';

    const pagina = window.location.pathname.split('/').pop() || '';

    fetch('php/verificar_sesion.php?pagina=' + encodeURIComponent(pagina), {
        credentials: 'same-origin'
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
        if (!data.ok) {
            // No hay sesión → ir al login
            redirigir('sin_sesion', 'Inicio_sesion.html');
            return;
        }

        if (!data.permiso) {
            // Hay sesión pero no tiene acceso a esta página → ir al inicio
            redirigir('sin_permiso', 'Interfaz.html');
            return;
        }

        // Sincronizar localStorage con los datos del servidor
        // (corrige cualquier manipulación manual del lado cliente)
        localStorage.setItem('rol',     data.rol);
        localStorage.setItem('usuario', data.nombre);

        // Todo OK → mostrar la página
        document.documentElement.style.visibility = 'visible';
    })
    .catch(function () {
        // Error de red o servidor caído → ir al login por precaución
        redirigir('sin_sesion', 'Inicio_sesion.html');
    });


    // ─────────────────────────────────────────────────────────
    //  Muestra un overlay informativo y luego redirige.
    //  motivo:  'sin_sesion' | 'sin_permiso'
    //  destino: ruta a la que redirigir
    // ─────────────────────────────────────────────────────────
    function redirigir(motivo, destino) {
        document.documentElement.style.visibility = 'visible';

        const config = {
            sin_sesion:  { icono: '🔒', mensaje: 'Tu sesión ha expirado.<br>Redirigiendo al inicio de sesión…' },
            sin_permiso: { icono: '⛔', mensaje: 'No tienes acceso a esta página.<br>Redirigiendo al inicio…' },
        };

        const { icono, mensaje } = config[motivo] || config.sin_sesion;

        const overlay = document.createElement('div');
        overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:99999',
            'display:flex', 'flex-direction:column',
            'align-items:center', 'justify-content:center',
            'background:#ffffff', 'font-family:system-ui,sans-serif', 'gap:12px',
        ].join(';');

        overlay.innerHTML = [
            '<style>@keyframes auth-spin{to{transform:rotate(360deg)}}</style>',
            '<div style="font-size:3rem;line-height:1">' + icono + '</div>',
            '<p style="margin:0;font-size:1rem;color:#444;text-align:center;line-height:1.5">' + mensaje + '</p>',
            '<div style="width:40px;height:40px;border:4px solid #e0e0e0;border-top-color:#555;border-radius:50%;animation:auth-spin .8s linear infinite"></div>',
        ].join('');

        if (document.body) {
            document.body.appendChild(overlay);
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                document.body.appendChild(overlay);
            });
        }

        setTimeout(function () {
            window.location.replace(destino);
        }, 1500);
    }

})();