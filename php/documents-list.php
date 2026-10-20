<?php
declare(strict_types=1);
require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $consulta = db()->query("SELECT d.id_documento, d.titulo, t.nombre AS tipo, DATE_FORMAT(d.fecha_carga, '%d/%m/%Y') AS fecha, LOWER(SUBSTRING_INDEX(d.ruta_archivo, '.', -1)) AS extension FROM documento d JOIN tipo_documento t ON t.id_tipo_documento = d.id_tipo_documento WHERE d.estado = 'ACTIVO' ORDER BY d.fecha_carga DESC");
    echo json_encode(['success' => true, 'data' => $consulta->fetchAll()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('[documents_list] ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => ['message' => 'No se pudieron cargar los documentos.']], JSON_UNESCAPED_UNICODE);
}
