<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/settings-common.php';

settings_require_method('POST');

$idUsuario = settings_current_user_id();
$datos = settings_input();
$conexion = db();

try {
    $consultaActual = $conexion->prepare(
        'SELECT
            p.nombre,
            p.apellido,
            p.email,
            c.centro,
            c.foto_publica
         FROM usuario u
         INNER JOIN funcionario f ON f.id_persona = u.id_funcionario
         INNER JOIN persona p ON p.id_persona = f.id_persona
         INNER JOIN configuracion_usuario c ON c.id_usuario = u.id_usuario
         WHERE u.id_usuario = :id_usuario
         LIMIT 1'
    );
    $consultaActual->execute(['id_usuario' => $idUsuario]);
    $actual = $consultaActual->fetch();

    if (!$actual) {
        settings_get_or_create_config($conexion, $idUsuario);

        $consultaActual = $conexion->prepare(
            'SELECT
                p.nombre,
                p.apellido,
                p.email
             FROM usuario u
             INNER JOIN funcionario f ON f.id_persona = u.id_funcionario
             INNER JOIN persona p ON p.id_persona = f.id_persona
             WHERE u.id_usuario = :id_usuario
             LIMIT 1'
        );
        $consultaActual->execute(['id_usuario' => $idUsuario]);
        $personaActual = $consultaActual->fetch();

        if (!$personaActual) {
            settings_json_response(404, false, [], 'No se encontró el usuario.');
        }

        $actual = [
            'nombre' => $personaActual['nombre'],
            'apellido' => $personaActual['apellido'],
            'email' => $personaActual['email'],
            'centro' => 'Hospital de Clínicas',
            'foto_publica' => 1
        ];
    }

    $nombre = array_key_exists('nombre', $datos)
        ? settings_clean_text($datos['nombre'], 100)
        : $actual['nombre'];

    $apellido = array_key_exists('apellido', $datos)
        ? settings_clean_text($datos['apellido'], 100)
        : $actual['apellido'];

    $email = array_key_exists('email', $datos)
        ? trim((string) $datos['email'])
        : (string) ($actual['email'] ?? '');

    $centro = array_key_exists('centro', $datos)
        ? settings_clean_text($datos['centro'], 150)
        : $actual['centro'];

    if ($nombre === '') {
        settings_json_response(422, false, [], 'El nombre es obligatorio.');
    }

    if ($apellido === '') {
        settings_json_response(422, false, [], 'El apellido es obligatorio.');
    }

    if ($centro === '') {
        settings_json_response(422, false, [], 'El centro es obligatorio.');
    }

    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        settings_json_response(422, false, [], 'El email no es válido.');
    }

    $conexion->beginTransaction();

    $actualizarPersona = $conexion->prepare(
        'UPDATE persona
         SET nombre = :nombre,
             apellido = :apellido,
             email = :email
         WHERE id_persona = (
             SELECT id_funcionario
             FROM usuario
             WHERE id_usuario = :id_usuario
         )'
    );

    $actualizarPersona->execute([
        'nombre' => $nombre,
        'apellido' => $apellido,
        'email' => $email !== '' ? $email : null,
        'id_usuario' => $idUsuario
    ]);

    settings_get_or_create_config($conexion, $idUsuario);

    $fotoPublica = array_key_exists('foto_publica', $datos)
        ? settings_bool($datos['foto_publica'])
        : (int) $actual['foto_publica'];

    $actualizarConfig = $conexion->prepare(
        'UPDATE configuracion_usuario
         SET centro = :centro,
             foto_publica = :foto_publica
         WHERE id_usuario = :id_usuario'
    );
    $actualizarConfig->execute([
        'centro' => $centro,
        'foto_publica' => $fotoPublica,
        'id_usuario' => $idUsuario
    ]);

    $conexion->commit();

    settings_update_session([
        'nombre' => $nombre,
        'apellido' => $apellido,
        'email' => $email !== '' ? $email : null
    ]);

    settings_json_response(200, true, [
        'nombre' => $nombre,
        'apellido' => $apellido,
        'email' => $email !== '' ? $email : null,
        'centro' => $centro,
        'foto_publica' => (bool) $fotoPublica
    ]);
} catch (Throwable $error) {
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    error_log('[settings_profile_update] ' . $error->getMessage());
    settings_json_response(500, false, [], 'No se pudo guardar la información general.');
}
