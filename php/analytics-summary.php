<?php
declare(strict_types=1);
require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

// Devuelve todos los datos de la página de Reportes en una sola llamada
try {
    $conexion = db();

    $totales = $conexion->query(
        "SELECT
            (SELECT COUNT(*) FROM documento WHERE estado = 'ACTIVO') AS documentos,
            (SELECT COUNT(*) FROM traslado) AS traslados,
            (SELECT COUNT(*) FROM paciente) AS pacientes,
            (SELECT COUNT(*) FROM envio_encuesta WHERE completada = 1) AS respuestas"
    )->fetch();

    // Promedio de las preguntas de calificación (solo respuestas del 1 al 5)
    $totales['satisfaccion'] = $conexion->query(
        "SELECT ROUND(AVG(CAST(r.respuesta_texto AS UNSIGNED)), 1)
         FROM respuesta r
         INNER JOIN pregunta p ON p.id_pregunta = r.id_pregunta
         WHERE p.tipo = 'ESCALA' AND r.respuesta_texto IN ('1', '2', '3', '4', '5')"
    )->fetchColumn();

    // Documentos cargados en los últimos 6 meses
    $documentosPorMes = $conexion->query(
        "SELECT DATE_FORMAT(fecha_carga, '%Y-%m') AS mes, COUNT(*) AS total
         FROM documento
         WHERE estado = 'ACTIVO' AND fecha_carga >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 5 MONTH)
         GROUP BY mes ORDER BY mes"
    )->fetchAll();

    $documentosPorTipo = $conexion->query(
        "SELECT t.nombre, COUNT(d.id_documento) AS total
         FROM tipo_documento t
         LEFT JOIN documento d ON d.id_tipo_documento = t.id_tipo_documento AND d.estado = 'ACTIVO'
         GROUP BY t.id_tipo_documento, t.nombre ORDER BY total DESC, t.nombre"
    )->fetchAll();

    $ambulancias = $conexion->query(
        'SELECT estado_operativo AS estado, COUNT(*) AS total
         FROM ambulancia GROUP BY estado_operativo ORDER BY total DESC'
    )->fetchAll();

    $traslados = $conexion->query(
        'SELECT estado_solicitud AS estado, COUNT(*) AS total
         FROM solicitud_traslado GROUP BY estado_solicitud ORDER BY total DESC'
    )->fetchAll();

    $encuestas = $conexion->query(
        "SELECT e.titulo, COUNT(v.id_envio) AS total
         FROM encuesta e
         LEFT JOIN envio_encuesta v ON v.id_encuesta = e.id_encuesta AND v.completada = 1
         GROUP BY e.id_encuesta, e.titulo ORDER BY total DESC, e.titulo"
    )->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => [
            'totales' => $totales,
            'documentos_por_mes' => $documentosPorMes,
            'documentos_por_tipo' => $documentosPorTipo,
            'ambulancias' => $ambulancias,
            'traslados' => $traslados,
            'encuestas' => $encuestas
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('[analytics_summary] ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => ['message' => 'No se pudieron cargar los reportes.']], JSON_UNESCAPED_UNICODE);
}
