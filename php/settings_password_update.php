<?php
declare(strict_types=1);

require_once __DIR__ . '/settings-common.php';

settings_require_method('POST');

$idUsuario = settings_current_user_id();
$datos = settings_input();

$actual = (string) ($datos['contrasena_actual'] ?? '');
$nueva = (string) ($datos['contrasena_nueva'] ?? '');
$repetida = (string) ($datos['contrasena_repetida'] ?? '');

if ($actual === '' || $nueva === '' || $repetida === '') {
    settings_json_response(422, false, [], 'Completá los tres campos de contraseña.');
}

if ($nueva !== $repetida) {
    settings_json_response(422, false, [], 'La contraseña nueva y la repetida no coinciden.');
}

// Mismas reglas que en el registro
if (
    strlen($nueva) < 8 ||
    !preg_match('/[A-Z]/', $nueva) ||
    !preg_match('/[a-z]/', $nueva) ||
    !preg_match('/[0-9]/', $nueva) ||
    !preg_match('/[^a-zA-Z0-9]/', $nueva)
) {
    settings_json_response(
        422,
        false,
        [],
        'La contraseña nueva debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.'
    );
}

$conexion = db();

try {
    $consulta = $conexion->prepare(
        'SELECT password_hash FROM usuario WHERE id_usuario = :id_usuario LIMIT 1'
    );
    $consulta->execute(['id_usuario' => $idUsuario]);
    $hashActual = $consulta->fetchColumn();

    if ($hashActual === false) {
        settings_json_response(404, false, [], 'No se encontró el usuario.');
    }

    // Se pide la contraseña actual para que nadie la cambie con la sesión abierta de otro
    if (!password_verify($actual, (string) $hashActual)) {
        settings_json_response(422, false, [], 'La contraseña actual no es correcta.');
    }

    $actualizar = $conexion->prepare(
        'UPDATE usuario SET password_hash = :password_hash WHERE id_usuario = :id_usuario'
    );
    $actualizar->execute([
        'password_hash' => password_hash($nueva, PASSWORD_DEFAULT),
        'id_usuario' => $idUsuario
    ]);

    settings_json_response(200, true, []);
} catch (Throwable $error) {
    error_log('[settings_password_update] ' . $error->getMessage());
    settings_json_response(500, false, [], 'No se pudo cambiar la contraseña.');
}
