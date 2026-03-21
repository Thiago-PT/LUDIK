<?php
// =============================================================
//  LUDIK — verificar_sesion.php
//  Endpoint que consulta auth-guard.js para validar sesión
//  y permisos. Devuelve JSON.
//
//  AGREGAR UNA PÁGINA NUEVA:
//      1. Añade su línea en $PAGINA_A_BOTON.
//      2. Si necesita restringir roles, edita $PERMISOS.
//      No toques nada más.
// =============================================================

session_start();
header('Content-Type: application/json');
header('Cache-Control: no-store');

// ─────────────────────────────────────────────────────────────
//  TABLA DE PERMISOS — lista BLANCA
//  Cada rol lista las claves de páginas a las que SÍ puede
//  acceder. Si la clave no aparece en la lista → bloqueado.
//  Admin usa '*' como comodín para saltarse la verificación.
//
//  PARA AGREGAR UNA PÁGINA NUEVA:
//      1. Añádela en $PAGINA_A_BOTON con su clave.
//      2. Añade esa misma clave en cada rol que deba verla.
// ─────────────────────────────────────────────────────────────
$PERMISOS = [
    'admin'         => ['*'],

    'docente_apoyo' => [
        'perfil', 'estudiantes', 'actividades', 'asistente ia',
        'registrar un nuevo estudiante', 'registrar un piar',
        'valoraciones', 'documentos', 'comunicate', 'ayuda',
    ],
    'docente'       => [
        'perfil', 'estudiantes', 'actividades', 'asistente ia',
        'valoraciones', 'documentos', 'comunicate', 'ayuda',
    ],
    'directivo'     => [
        'perfil', 'estudiantes', 'actividades', 'asistente ia',
        'documentos', 'comunicate', 'ayuda',
    ],
    'padre'         => ['perfil', 'estudiantes', 'comunicate', 'ayuda'],
    'madre'         => ['perfil', 'estudiantes', 'comunicate', 'ayuda'],
    'acudiente'     => ['perfil', 'estudiantes', 'comunicate', 'ayuda'],

    'defecto'       => ['perfil', 'comunicate', 'ayuda'],
];

// ─────────────────────────────────────────────────────────────
//  TABLA DE PÁGINAS → CLAVE DE PERMISO
//  Relaciona cada archivo HTML con su clave en $PERMISOS.
//  Páginas fuera de esta tabla (Interfaz.html, etc.)
//  solo requieren sesión activa, no verifican permiso.
// ─────────────────────────────────────────────────────────────
$PAGINA_A_BOTON = [
    'estudiantes.html'                   => 'estudiantes',
    'crear_cuentas.html'                 => 'crear cuentas',
    'Modificar_cuentas.html'             => 'modificar cuentas',
    'ejercicios.html'                    => 'actividades',
    'registrar_estudiante.html'          => 'registrar un nuevo estudiante',
    'registrar_piar.html'                => 'registrar un piar',
    'valoracion_pedagogica.html'         => 'valoraciones',
    'modificar_asignacion_docentes.html' => 'modificar asignacion',
    'documentos.html'                    => 'documentos',
    'comunicacion.html'                  => 'comunicate',
    'ayuda.html'                         => 'ayuda',
    'perfil.html'                        => 'perfil',
];

// ─────────────────────────────────────────────────────────────
//  1. VERIFICAR SESIÓN ACTIVA
// ─────────────────────────────────────────────────────────────
if (!isset($_SESSION['usuario'], $_SESSION['rol'])) {
    echo json_encode(['ok' => false, 'motivo' => 'sin_sesion']);
    exit;
}

$rol = strtolower(trim($_SESSION['rol']));

// ─────────────────────────────────────────────────────────────
//  2. VERIFICAR PERMISO PARA LA PÁGINA SOLICITADA
//  Si la página no está en la tabla → acceso libre (ej: Interfaz.html)
// ─────────────────────────────────────────────────────────────
$pagina  = $_GET['pagina'] ?? '';
$permiso = true;

if ($pagina !== '' && isset($PAGINA_A_BOTON[$pagina])) {
    $clave_pagina  = normalizar_v($PAGINA_A_BOTON[$pagina]);
    $permitidos    = array_map('normalizar_v', $PERMISOS[$rol] ?? $PERMISOS['defecto']);

    // Comodín '*' = admin, accede a todo
    if (in_array('*', $permitidos, true)) {
        $permiso = true;
    } else {
        // Verificar si la clave de la página está en la lista blanca del rol
        // Se usa str_contains para igualar el comportamiento de includes() en Interfaz.js
        $permiso = false;
        foreach ($permitidos as $clave_permitida) {
            if (str_contains($clave_pagina, $clave_permitida) || str_contains($clave_permitida, $clave_pagina)) {
                $permiso = true;
                break;
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  3. RESPUESTA
// ─────────────────────────────────────────────────────────────
echo json_encode([
    'ok'      => true,
    'rol'     => $rol,
    'nombre'  => $_SESSION['usuario']['nombre'] ?? '',
    'permiso' => $permiso,
]);


// ─────────────────────────────────────────────────────────────
//  UTILIDAD: quitar tildes y pasar a minúsculas
// ─────────────────────────────────────────────────────────────
function normalizar_v(string $texto): string {
    return strtr(mb_strtolower($texto, 'UTF-8'), [
        'á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u',
        'à'=>'a','è'=>'e','ì'=>'i','ò'=>'o','ù'=>'u',
        'ä'=>'a','ë'=>'e','ï'=>'i','ö'=>'o','ü'=>'u',
        'â'=>'a','ê'=>'e','î'=>'i','ô'=>'o','û'=>'u',
        'ñ'=>'n','ç'=>'c',
    ]);
}
?>