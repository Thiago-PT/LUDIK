<?php
// Gestion_cuentas.php - API para la gestión de cuentas de usuarios (solo admin)
session_start();
header('Content-Type: application/json');

// Solo el admin puede acceder a esta página
if (
    !isset($_SESSION['usuario']) || !isset($_SESSION['rol']) ||
    $_SESSION['rol'] !== 'admin'
) {
    echo json_encode(['success' => false, 'message' => 'No autorizado. Solo el administrador puede gestionar cuentas.']);
    exit;
}

require_once 'conexion.php';

$accion = $_REQUEST['accion'] ?? '';

try {
    switch ($accion) {
        case 'listar_todos':
            listarTodos($conexion);
            break;
        case 'editar_cuenta':
            editarCuenta($conexion);
            break;
        case 'eliminar_cuenta':
            eliminarCuenta($conexion);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} catch (Exception $e) {
    error_log("Error en Gestion_cuentas.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}

mysqli_close($conexion);


// ===== LISTAR TODOS =====
function listarTodos($conexion)
{
    $cuentas = [
        'docentes'      => listarDocentes($conexion),
        'docentes_apoyo' => listarDocentesApoyo($conexion),
        'directivos'    => listarDirectivos($conexion),
        'admins'        => listarAdmins($conexion),
    ];

    echo json_encode(['success' => true, 'cuentas' => $cuentas]);
}

function listarDocentes($conexion)
{
    $query = "
        SELECT 
            id_docente,
            nombre_completo,
            email,
            telefono,
            es_director
        FROM docente
        ORDER BY nombre_completo
    ";
    $result = mysqli_query($conexion, $query);
    $lista = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $lista[] = $row;
    }
    return $lista;
}
function listarDocentesApoyo($conexion)
{
    $query = "
        SELECT 
            id_docente_apoyo,
            nombre,
            email
        FROM docente_apoyo
        ORDER BY nombre
    ";
    $result = mysqli_query($conexion, $query);
    $lista = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $row['nombre_completo'] = $row['nombre'];
        $lista[] = $row;
    }
    return $lista;
}

function listarDirectivos($conexion)
{
    $query = "
        SELECT 
            id_directivo,
            nombre,
            email,
            cargo,
            telefono
        FROM directivo
        ORDER BY nombre
    ";
    $result = mysqli_query($conexion, $query);
    $lista = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $row['nombre_completo'] = $row['nombre'];
        $lista[] = $row;
    }
    return $lista;
}

function listarAdmins($conexion)
{
    $query = "
        SELECT 
            id_admin,
            nombre,
            email
        FROM admin
        ORDER BY nombre
    ";
    $result = mysqli_query($conexion, $query);
    $lista = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $row['nombre_completo'] = $row['nombre'];
        $lista[] = $row;
    }
    return $lista;
}

// ===== EDITAR CUENTA =====
function editarCuenta($conexion)
{
    $id    = intval($_POST['id'] ?? 0);
    $tipo  = $_POST['tipo'] ?? '';
    $nombre = trim($_POST['nombre_completo'] ?? '');
    $email  = trim($_POST['email'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $contrasena = $_POST['contrasena'] ?? '';

    if (!$id || !$tipo || !$nombre || !$email) {
        echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios']);
        return;
    }

    // Validar formato email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'El email no tiene un formato válido']);
        return;
    }

    // Validar longitud contraseña si se envió
    if (!empty($contrasena) && strlen($contrasena) < 6) {
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
        return;
    }

    switch ($tipo) {
        case 'docentes':
            editarDocente($conexion, $id, $nombre, $email, $telefono, $contrasena);
            break;
        case 'docentes_apoyo':
            $profesion = trim($_POST['profesion'] ?? '');
            editarDocenteApoyo($conexion, $id, $nombre, $email, $telefono, $profesion, $contrasena);
            break;
        case 'directivos':
            $cargo = trim($_POST['cargo'] ?? '');
            editarDirectivo($conexion, $id, $nombre, $email, $telefono, $cargo, $contrasena);
            break;
        case 'admins':
            editarAdmin($conexion, $id, $nombre, $email, $contrasena);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Tipo de cuenta no válido']);
    }
}

function editarDocente($conexion, $id, $nombre, $email, $telefono, $contrasena)
{
    $stmt_check = mysqli_prepare($conexion, "SELECT id_docente FROM docente WHERE email = ? AND id_docente != ?");
    mysqli_stmt_bind_param($stmt_check, "si", $email, $id);
    mysqli_stmt_execute($stmt_check);
    mysqli_stmt_store_result($stmt_check);
    if (mysqli_stmt_num_rows($stmt_check) > 0) {
        echo json_encode(['success' => false, 'message' => 'Este email ya está en uso por otro docente']);
        mysqli_stmt_close($stmt_check);
        return;
    }
    mysqli_stmt_close($stmt_check);

    $es_director = isset($_POST['es_director']) ? intval($_POST['es_director']) : 0;

    if (!empty($contrasena)) {
        $hash = password_hash($contrasena, PASSWORD_DEFAULT);
        $stmt = mysqli_prepare($conexion, "UPDATE docente SET nombre_completo=?, email=?, telefono=?, es_director=?, contrasena=? WHERE id_docente=?");
        mysqli_stmt_bind_param($stmt, "sssisi", $nombre, $email, $telefono, $es_director, $hash, $id);
    } else {
        $stmt = mysqli_prepare($conexion, "UPDATE docente SET nombre_completo=?, email=?, telefono=?, es_director=? WHERE id_docente=?");
        mysqli_stmt_bind_param($stmt, "sssii", $nombre, $email, $telefono, $es_director, $id);
    }

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true, 'message' => 'Docente actualizado exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el docente']);
    }
    mysqli_stmt_close($stmt);
}

function editarDocenteApoyo($conexion, $id, $nombre, $email, $telefono, $profesion, $contrasena)
{
    $stmt_check = mysqli_prepare($conexion, "SELECT id_docente_apoyo FROM docente_apoyo WHERE email = ? AND id_docente_apoyo != ?");
    mysqli_stmt_bind_param($stmt_check, "si", $email, $id);
    mysqli_stmt_execute($stmt_check);
    mysqli_stmt_store_result($stmt_check);
    if (mysqli_stmt_num_rows($stmt_check) > 0) {
        echo json_encode(['success' => false, 'message' => 'Este email ya está en uso por otro docente de apoyo']);
        mysqli_stmt_close($stmt_check);
        return;
    }
    mysqli_stmt_close($stmt_check);

    if (!empty($contrasena)) {
        $hash = password_hash($contrasena, PASSWORD_DEFAULT);
        $stmt = mysqli_prepare($conexion, "UPDATE docente_apoyo SET nombre=?, email=?, contrasena=? WHERE id_docente_apoyo=?");
        mysqli_stmt_bind_param($stmt, "sssi", $nombre, $email, $hash, $id);
    } else {
        $stmt = mysqli_prepare($conexion, "UPDATE docente_apoyo SET nombre=?, email=? WHERE id_docente_apoyo=?");
        mysqli_stmt_bind_param($stmt, "ssi", $nombre, $email, $id);
    }

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true, 'message' => 'Docente de apoyo actualizado exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el docente de apoyo']);
    }
    mysqli_stmt_close($stmt);
}
function editarDirectivo($conexion, $id, $nombre, $email, $telefono, $cargo, $contrasena)
{
    $stmt_check = mysqli_prepare($conexion, "SELECT id_directivo FROM directivo WHERE email = ? AND id_directivo != ?");
    mysqli_stmt_bind_param($stmt_check, "si", $email, $id);
    mysqli_stmt_execute($stmt_check);
    mysqli_stmt_store_result($stmt_check);
    if (mysqli_stmt_num_rows($stmt_check) > 0) {
        echo json_encode(['success' => false, 'message' => 'Este email ya está en uso por otro directivo']);
        mysqli_stmt_close($stmt_check);
        return;
    }
    mysqli_stmt_close($stmt_check);

    if (!empty($contrasena)) {
        $hash = password_hash($contrasena, PASSWORD_DEFAULT);
        $stmt = mysqli_prepare($conexion, "UPDATE directivo SET nombre=?, email=?, telefono=?, cargo=?, contrasena=? WHERE id_directivo=?");
        mysqli_stmt_bind_param($stmt, "sssssi", $nombre, $email, $telefono, $cargo, $hash, $id);
    } else {
        $stmt = mysqli_prepare($conexion, "UPDATE directivo SET nombre=?, email=?, telefono=?, cargo=? WHERE id_directivo=?");
        mysqli_stmt_bind_param($stmt, "ssssi", $nombre, $email, $telefono, $cargo, $id);
    }

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true, 'message' => 'Directivo actualizado exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el directivo']);
    }
    mysqli_stmt_close($stmt);
}

function editarAdmin($conexion, $id, $nombre, $email, $contrasena)
{
    $stmt_check = mysqli_prepare($conexion, "SELECT id_admin FROM admin WHERE email = ? AND id_admin != ?");
    mysqli_stmt_bind_param($stmt_check, "si", $email, $id);
    mysqli_stmt_execute($stmt_check);
    mysqli_stmt_store_result($stmt_check);
    if (mysqli_stmt_num_rows($stmt_check) > 0) {
        echo json_encode(['success' => false, 'message' => 'Este email ya está en uso por otro administrador']);
        mysqli_stmt_close($stmt_check);
        return;
    }
    mysqli_stmt_close($stmt_check);

    if (!empty($contrasena)) {
        $hash = password_hash($contrasena, PASSWORD_DEFAULT);
        $stmt = mysqli_prepare($conexion, "UPDATE admin SET nombre=?, email=?, contrasena=? WHERE id_admin=?");
        mysqli_stmt_bind_param($stmt, "sssi", $nombre, $email, $hash, $id);
    } else {
        $stmt = mysqli_prepare($conexion, "UPDATE admin SET nombre=?, email=? WHERE id_admin=?");
        mysqli_stmt_bind_param($stmt, "ssi", $nombre, $email, $id);
    }

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true, 'message' => 'Administrador actualizado exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el administrador']);
    }
    mysqli_stmt_close($stmt);
}


// ===== ELIMINAR CUENTA =====
function eliminarCuenta($conexion)
{
    $id   = intval($_POST['id'] ?? 0);
    $tipo = $_POST['tipo'] ?? '';

    if (!$id || !$tipo) {
        echo json_encode(['success' => false, 'message' => 'Datos insuficientes para eliminar']);
        return;
    }

    // Evitar que el admin se elimine a sí mismo
    if ($tipo === 'admins' && $id === intval($_SESSION['usuario']['id_admin'] ?? 0)) {
        echo json_encode(['success' => false, 'message' => 'No puedes eliminar tu propia cuenta de administrador']);
        return;
    }

    $tablas = [
        'docentes'      => ['tabla' => 'docente',       'campo' => 'id_docente'],
        'docentes_apoyo' => ['tabla' => 'docente_apoyo', 'campo' => 'id_docente_apoyo'],
        'directivos'    => ['tabla' => 'directivo',     'campo' => 'id_directivo'],
        'admins'        => ['tabla' => 'admin',         'campo' => 'id_admin'],
    ];

    if (!isset($tablas[$tipo])) {
        echo json_encode(['success' => false, 'message' => 'Tipo de cuenta no válido']);
        return;
    }

    $info = $tablas[$tipo];
    $query = "DELETE FROM {$info['tabla']} WHERE {$info['campo']} = ?";
    $stmt = mysqli_prepare($conexion, $query);
    mysqli_stmt_bind_param($stmt, "i", $id);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true, 'message' => 'Cuenta eliminada exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar la cuenta. Puede tener datos relacionados.']);
    }

    mysqli_stmt_close($stmt);
}
?>
