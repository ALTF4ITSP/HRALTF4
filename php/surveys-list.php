<?php
declare(strict_types=1);
require_once __DIR__ . '/surveys-common.php';

try {
    $conexion = db();

    $encuestas = $conexion->query(
        "SELECT e.id_encuesta, e.titulo, e.descripcion, e.estado, s.nombre AS servicio,
                (SELECT COUNT(*) FROM pregunta p WHERE p.id_encuesta = e.id_encuesta) AS preguntas,
                (SELECT COUNT(*) FROM envio_encuesta v WHERE v.id_encuesta = e.id_encuesta AND v.completada = 1) AS respuestas
         FROM encuesta e
         INNER JOIN servicio_hospitalario s ON s.id_servicio = e.id_servicio
         ORDER BY e.fecha_creacion DESC, e.id_encuesta DESC"
    )->fetchAll();

    // Los servicios se usan como "categoría" al crear una encuesta
    $servicios = $conexion->query(
        'SELECT id_servicio, nombre FROM servicio_hospitalario WHERE activo = 1 ORDER BY nombre'
    )->fetchAll();

    survey_response(200, ['success' => true, 'data' => $encuestas, 'servicios' => $servicios]);
} catch (Throwable $error) {
    error_log('[surveys_list] ' . $error->getMessage());
    survey_error(500, 'No se pudieron cargar las encuestas.');
}
