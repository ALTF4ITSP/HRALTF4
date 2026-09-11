<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/settings-common.php';

settings_require_method('GET');

$idUsuario = settings_current_user_id();
$conexion = db();

try {
    $configuracion = settings_get_or_create_config($conexion, $idUsuario);

    $consultaUsuario = $conexion->prepare(
        'SELECT
            u.id_usuario,
            u.nombre_usuario,
            p.nombre,
            p.apellido,
            p.email,
            f.cargo,
            f.sector
         FROM usuario u
         INNER JOIN funcionario f ON f.id_persona = u.id_funcionario
         INNER JOIN persona p ON p.id_persona = f.id_persona
         WHERE u.id_usuario = :id_usuario
           AND u.estado = "ACTIVO"
         LIMIT 1'
    );
    $consultaUsuario->execute(['id_usuario' => $idUsuario]);
    $usuario = $consultaUsuario->fetch();

    if (!$usuario) {
        settings_json_response(404, false, [], 'No se encontró el usuario.');
    }

    $consultaEspecialidades = $conexion->prepare(
        'SELECT e.id_especializacion, e.nombre
         FROM usuario_especializacion ue
         INNER JOIN especializacion e
             ON e.id_especializacion = ue.id_especializacion
         WHERE ue.id_usuario = :id_usuario
           AND e.activo = 1
         ORDER BY e.nombre ASC'
    );
    $consultaEspecialidades->execute(['id_usuario' => $idUsuario]);

    $especializaciones = $consultaEspecialidades->fetchAll();

    settings_json_response(200, true, [
        'usuario' => [
            'id_usuario' => (int) $usuario['id_usuario'],
            'nombre_usuario' => $usuario['nombre_usuario'],
            'nombre' => $usuario['nombre'],
            'apellido' => $usuario['apellido'],
            'nombre_completo' => trim($usuario['nombre'] . ' ' . $usuario['apellido']),
            'email' => $usuario['email'],
            'cargo' => $usuario['cargo'],
            'sector' => $usuario['sector']
        ],
        'configuracion' => [
            'centro' => $configuracion['centro'],
            'foto_perfil' => $configuracion['foto_perfil'],
            'foto_url' => !empty($configuracion['foto_perfil']) ? '../../api/settings_photo.php' : null,
            'foto_publica' => (bool) $configuracion['foto_publica'],
            'analisis_rendimiento' => (bool) $configuracion['analisis_rendimiento'],
            'notificaciones_seguridad' => (bool) $configuracion['notificaciones_seguridad'],
            'cierre_sesion_automatico' => (bool) $configuracion['cierre_sesion_automatico'],
            'idioma' => $configuracion['idioma'],
            'tema' => $configuracion['tema']
        ],
        'especializaciones' => $especializaciones
    ]);
} catch (Throwable $error) {
    error_log('[settings_get] ' . $error->getMessage());
    settings_json_response(500, false, [], 'No se pudo cargar la configuración.');
}
