<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/settings-common.php';

$idUsuario = settings_current_user_id();
$conexion = db();

$directorio = dirname(__DIR__) . '/uploads/perfiles';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    try {
        $consulta = $conexion->prepare(
            'SELECT foto_perfil, foto_publica
             FROM configuracion_usuario
             WHERE id_usuario = :id_usuario
             LIMIT 1'
        );
        $consulta->execute(['id_usuario' => $idUsuario]);
        $configuracion = $consulta->fetch();

        if (!$configuracion || empty($configuracion['foto_perfil'])) {
            http_response_code(404);
            exit;
        }

        if (!(bool) $configuracion['foto_publica']) {
            /*
             * La foto privada sigue disponible para el usuario autenticado
             * porque este endpoint siempre exige sesión.
             */
        }

        $nombreArchivo = basename((string) $configuracion['foto_perfil']);
        $ruta = $directorio . DIRECTORY_SEPARATOR . $nombreArchivo;

        if (!is_file($ruta)) {
            http_response_code(404);
            exit;
        }

        $mime = mime_content_type($ruta);

        $permitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!in_array($mime, $permitidos, true)) {
            http_response_code(415);
            exit;
        }

        header('Content-Type: ' . $mime);
        header('Cache-Control: private, max-age=3600');
        header('X-Content-Type-Options: nosniff');
        readfile($ruta);
        exit;
    } catch (Throwable $error) {
        error_log('[settings_photo_get] ' . $error->getMessage());
        http_response_code(500);
        exit;
    }
}

settings_require_method('POST');

if (!isset($_FILES['foto'])) {
    settings_json_response(422, false, [], 'No se recibió ninguna imagen.');
}

$archivo = $_FILES['foto'];

if (($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    settings_json_response(422, false, [], 'No se pudo recibir la imagen.');
}

$maximo = 5 * 1024 * 1024;

if ((int) $archivo['size'] <= 0 || (int) $archivo['size'] > $maximo) {
    settings_json_response(422, false, [], 'La imagen debe pesar como máximo 5 MB.');
}

if (!is_uploaded_file($archivo['tmp_name'])) {
    settings_json_response(400, false, [], 'El archivo recibido no es válido.');
}

if (!function_exists('finfo_open')) {
    settings_json_response(500, false, [], 'El servidor no tiene habilitada la validación de imágenes.');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = $finfo ? finfo_file($finfo, $archivo['tmp_name']) : false;

if ($finfo) {
    finfo_close($finfo);
}

$extensiones = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp'
];

if (!isset($extensiones[$mime])) {
    settings_json_response(415, false, [], 'La imagen debe ser JPG, PNG o WEBP.');
}

if (!is_dir($directorio) && !mkdir($directorio, 0750, true) && !is_dir($directorio)) {
    settings_json_response(500, false, [], 'No se pudo preparar el almacenamiento de imágenes.');
}

try {
    $consultaAnterior = $conexion->prepare(
        'SELECT foto_perfil
         FROM configuracion_usuario
         WHERE id_usuario = :id_usuario
         LIMIT 1'
    );
    $consultaAnterior->execute(['id_usuario' => $idUsuario]);
    $anterior = $consultaAnterior->fetch();

    $nombreArchivo = bin2hex(random_bytes(16)) . '.' . $extensiones[$mime];
    $destino = $directorio . DIRECTORY_SEPARATOR . $nombreArchivo;

    if (!move_uploaded_file($archivo['tmp_name'], $destino)) {
        settings_json_response(500, false, [], 'No se pudo guardar la imagen.');
    }

    settings_get_or_create_config($conexion, $idUsuario);

    $actualizar = $conexion->prepare(
        'UPDATE configuracion_usuario
         SET foto_perfil = :foto_perfil
         WHERE id_usuario = :id_usuario'
    );
    $actualizar->execute([
        'foto_perfil' => $nombreArchivo,
        'id_usuario' => $idUsuario
    ]);

    if ($anterior && !empty($anterior['foto_perfil'])) {
        $viejo = $directorio . DIRECTORY_SEPARATOR . basename($anterior['foto_perfil']);

        if (is_file($viejo) && $viejo !== $destino) {
            unlink($viejo);
        }
    }

    settings_json_response(200, true, [
        'foto_perfil' => $nombreArchivo
    ]);
} catch (Throwable $error) {
    if (isset($destino) && is_file($destino)) {
        unlink($destino);
    }

    error_log('[settings_photo] ' . $error->getMessage());
    settings_json_response(500, false, [], 'No se pudo actualizar la foto de perfil.');
}
