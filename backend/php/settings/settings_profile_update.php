<?php
declare(strict_types=1);

require_once __DIR__ . '/settings-common.php';

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
            f.cargo,
            f.sector,
            u.nombre_usuario,
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
                p.email,
                f.cargo,
                f.sector,
                u.nombre_usuario
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
            'cargo' => $personaActual['cargo'],
            'sector' => $personaActual['sector'],
            'nombre_usuario' => $personaActual['nombre_usuario'],
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

    $cargo = array_key_exists('cargo', $datos)
        ? settings_clean_text($datos['cargo'], 100)
        : (string) ($actual['cargo'] ?? '');

    $sector = array_key_exists('sector', $datos)
        ? settings_clean_text($datos['sector'], 100)
        : (string) ($actual['sector'] ?? '');

    $nombreUsuario = array_key_exists('nombre_usuario', $datos)
        ? trim((string) $datos['nombre_usuario'])
        : $actual['nombre_usuario'];

    $centro = array_key_exists('centro', $datos)
        ? settings_clean_text($datos['centro'], 150)
        : $actual['centro'];

    if ($nombre === '') {
        settings_json_response(422, false, [], 'El nombre es obligatorio.');
    }

    if ($apellido === '') {
        settings_json_response(422, false, [], 'El apellido es obligatorio.');
    }

    if ($cargo === '') {
        settings_json_response(422, false, [], 'El cargo es obligatorio.');
    }

    if ($sector === '') {
        settings_json_response(422, false, [], 'El sector es obligatorio.');
    }

    // Mismas reglas que en el registro
    if (!preg_match('/^[a-zA-Z0-9._-]{6,50}$/', $nombreUsuario)) {
        settings_json_response(
            422,
            false,
            [],
            'El usuario debe tener entre 6 y 50 caracteres y solo puede contener letras, números, punto, guion o guion bajo.'
        );
    }

    $consultaNombreUsuario = $conexion->prepare(
        'SELECT id_usuario
         FROM usuario
         WHERE nombre_usuario = :nombre_usuario
           AND id_usuario <> :id_usuario
         LIMIT 1'
    );
    $consultaNombreUsuario->execute([
        'nombre_usuario' => $nombreUsuario,
        'id_usuario' => $idUsuario
    ]);

    if ($consultaNombreUsuario->fetch()) {
        settings_json_response(422, false, [], 'Ese nombre de usuario ya está registrado.');
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

    $actualizarFuncionario = $conexion->prepare(
        'UPDATE funcionario
         SET cargo = :cargo,
             sector = :sector
         WHERE id_persona = (
             SELECT id_funcionario
             FROM usuario
             WHERE id_usuario = :id_usuario
         )'
    );
    $actualizarFuncionario->execute([
        'cargo' => $cargo,
        'sector' => $sector,
        'id_usuario' => $idUsuario
    ]);

    $actualizarUsuario = $conexion->prepare(
        'UPDATE usuario
         SET nombre_usuario = :nombre_usuario
         WHERE id_usuario = :id_usuario'
    );
    $actualizarUsuario->execute([
        'nombre_usuario' => $nombreUsuario,
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
    $_SESSION['nombre_usuario'] = $nombreUsuario;

    settings_json_response(200, true, [
        'nombre' => $nombre,
        'apellido' => $apellido,
        'email' => $email !== '' ? $email : null,
        'cargo' => $cargo,
        'sector' => $sector,
        'nombre_usuario' => $nombreUsuario,
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
