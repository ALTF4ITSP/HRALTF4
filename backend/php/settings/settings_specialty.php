<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/settings-common.php';

settings_require_method('POST');

$idUsuario = settings_current_user_id();
$datos = settings_input();

$accion = strtolower(trim((string) ($datos['accion'] ?? '')));
$conexion = db();

try {
    if ($accion === 'add') {
        $nombre = settings_clean_text($datos['nombre'] ?? '', 100);

        if ($nombre === '') {
            settings_json_response(422, false, [], 'La especialización es obligatoria.');
        }

        $buscar = $conexion->prepare(
            'SELECT id_especializacion
             FROM especializacion
             WHERE nombre = :nombre
             LIMIT 1'
        );
        $buscar->execute(['nombre' => $nombre]);
        $especializacion = $buscar->fetch();

        if (!$especializacion) {
            $crear = $conexion->prepare(
                'INSERT INTO especializacion (nombre)
                 VALUES (:nombre)'
            );
            $crear->execute(['nombre' => $nombre]);
            $idEspecializacion = (int) $conexion->lastInsertId();
        } else {
            $idEspecializacion = (int) $especializacion['id_especializacion'];
        }

        $vincular = $conexion->prepare(
            'INSERT IGNORE INTO usuario_especializacion
                (id_usuario, id_especializacion)
             VALUES
                (:id_usuario, :id_especializacion)'
        );
        $vincular->execute([
            'id_usuario' => $idUsuario,
            'id_especializacion' => $idEspecializacion
        ]);

        settings_json_response(200, true, [
            'id_especializacion' => $idEspecializacion,
            'nombre' => $nombre
        ]);
    }

    if ($accion === 'delete') {
        $idEspecializacion = (int) ($datos['id_especializacion'] ?? 0);

        if ($idEspecializacion <= 0) {
            settings_json_response(422, false, [], 'La especialización indicada no es válida.');
        }

        $eliminar = $conexion->prepare(
            'DELETE FROM usuario_especializacion
             WHERE id_usuario = :id_usuario
               AND id_especializacion = :id_especializacion'
        );
        $eliminar->execute([
            'id_usuario' => $idUsuario,
            'id_especializacion' => $idEspecializacion
        ]);

        settings_json_response(200, true, [
            'id_especializacion' => $idEspecializacion
        ]);
    }

    settings_json_response(422, false, [], 'Acción de especialización no válida.');
} catch (Throwable $error) {
    error_log('[settings_specialty] ' . $error->getMessage());
    settings_json_response(500, false, [], 'No se pudo actualizar la especialización.');
}
