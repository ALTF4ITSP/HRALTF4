<?php
declare(strict_types=1);

require_once __DIR__ . '/connection.php';

function settings_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    session_start();
}

function settings_json_response(int $status, bool $success, array $data = [], string $message = ''): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    $response = ['success' => $success];

    if ($success) {
        $response['data'] = $data;
    } else {
        $response['error'] = [
            'message' => $message !== '' ? $message : 'No se pudo completar la operación.'
        ];
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function settings_require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) {
        header('Allow: ' . $method);
        settings_json_response(405, false, [], 'Método no permitido.');
    }
}

function settings_input(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '', true);

        return is_array($data) ? $data : [];
    }

    return $_POST;
}

function settings_current_user_id(): int
{
    settings_start_session();

    $possibleIds = [
        $_SESSION['id_usuario'] ?? null,
        $_SESSION['usuario_id'] ?? null,
        $_SESSION['user_id'] ?? null,
        $_SESSION['id'] ?? null,
        $_SESSION['usuario']['id_usuario'] ?? null,
        $_SESSION['usuario']['id'] ?? null,
        $_SESSION['user']['id_usuario'] ?? null,
        $_SESSION['user']['id'] ?? null
    ];

    foreach ($possibleIds as $id) {
        if (is_numeric($id) && (int) $id > 0) {
            return (int) $id;
        }
    }

    settings_json_response(401, false, [], 'La sesión no está iniciada.');
}

function settings_get_or_create_config(PDO $conexion, int $idUsuario): array
{
    $consulta = $conexion->prepare(
        'SELECT *
         FROM configuracion_usuario
         WHERE id_usuario = :id_usuario
         LIMIT 1'
    );
    $consulta->execute(['id_usuario' => $idUsuario]);
    $configuracion = $consulta->fetch();

    if ($configuracion) {
        return $configuracion;
    }

    $insertar = $conexion->prepare(
        'INSERT INTO configuracion_usuario (id_usuario)
         VALUES (:id_usuario)'
    );
    $insertar->execute(['id_usuario' => $idUsuario]);

    $consulta->execute(['id_usuario' => $idUsuario]);
    return $consulta->fetch();
}

function settings_clean_text(mixed $value, int $maxLength): string
{
    $value = trim((string) $value);

    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength);
    }

    return substr($value, 0, $maxLength);
}

function settings_bool(mixed $value): int
{
    if (is_bool($value)) {
        return $value ? 1 : 0;
    }

    return in_array(strtolower(trim((string) $value)), ['1', 'true', 'on', 'yes', 'si', 'sí'], true)
        ? 1
        : 0;
}

function settings_update_session(array $persona): void
{
    if (isset($_SESSION['nombre'])) {
        $_SESSION['nombre'] = $persona['nombre'];
    }

    if (isset($_SESSION['apellido'])) {
        $_SESSION['apellido'] = $persona['apellido'];
    }

    if (isset($_SESSION['email'])) {
        $_SESSION['email'] = $persona['email'];
    }

    if (isset($_SESSION['usuario']) && is_array($_SESSION['usuario'])) {
        $_SESSION['usuario']['nombre'] = $persona['nombre'];
        $_SESSION['usuario']['apellido'] = $persona['apellido'];
        $_SESSION['usuario']['email'] = $persona['email'];
    }

    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        $_SESSION['user']['nombre'] = $persona['nombre'];
        $_SESSION['user']['apellido'] = $persona['apellido'];
        $_SESSION['user']['email'] = $persona['email'];
    }
}
