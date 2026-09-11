<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/settings-common.php';

settings_require_method('POST');

$idUsuario = settings_current_user_id();
$datos = settings_input();
$conexion = db();

try {
    $configuracion = settings_get_or_create_config($conexion, $idUsuario);

    $analisis = array_key_exists('analisis_rendimiento', $datos)
        ? settings_bool($datos['analisis_rendimiento'])
        : (int) $configuracion['analisis_rendimiento'];

    $notificaciones = array_key_exists('notificaciones_seguridad', $datos)
        ? settings_bool($datos['notificaciones_seguridad'])
        : (int) $configuracion['notificaciones_seguridad'];

    $cierreAutomatico = array_key_exists('cierre_sesion_automatico', $datos)
        ? settings_bool($datos['cierre_sesion_automatico'])
        : (int) $configuracion['cierre_sesion_automatico'];

    $idioma = array_key_exists('idioma', $datos)
        ? settings_clean_text($datos['idioma'], 20)
        : $configuracion['idioma'];

    $tema = array_key_exists('tema', $datos)
        ? settings_clean_text($datos['tema'], 10)
        : $configuracion['tema'];

    $idiomasPermitidos = ['Español', 'English'];
    $temasPermitidos = ['dark', 'light'];

    if (!in_array($idioma, $idiomasPermitidos, true)) {
        settings_json_response(422, false, [], 'El idioma seleccionado no es válido.');
    }

    if (!in_array($tema, $temasPermitidos, true)) {
        settings_json_response(422, false, [], 'El tema seleccionado no es válido.');
    }

    $consulta = $conexion->prepare(
        'UPDATE configuracion_usuario
         SET
            analisis_rendimiento = :analisis_rendimiento,
            notificaciones_seguridad = :notificaciones_seguridad,
            cierre_sesion_automatico = :cierre_sesion_automatico,
            idioma = :idioma,
            tema = :tema
         WHERE id_usuario = :id_usuario'
    );

    $consulta->execute([
        'analisis_rendimiento' => $analisis,
        'notificaciones_seguridad' => $notificaciones,
        'cierre_sesion_automatico' => $cierreAutomatico,
        'idioma' => $idioma,
        'tema' => $tema,
        'id_usuario' => $idUsuario
    ]);

    settings_json_response(200, true, [
        'analisis_rendimiento' => (bool) $analisis,
        'notificaciones_seguridad' => (bool) $notificaciones,
        'cierre_sesion_automatico' => (bool) $cierreAutomatico,
        'idioma' => $idioma,
        'tema' => $tema
    ]);
} catch (Throwable $error) {
    error_log('[settings_privacy_update] ' . $error->getMessage());
    settings_json_response(500, false, [], 'No se pudieron guardar las preferencias.');
}
