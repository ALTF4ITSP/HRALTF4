<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $consulta = db()->query("SELECT id_documento, titulo, descripcion, DATE_FORMAT(fecha_carga, '%d/%m/%Y') AS fecha FROM documento WHERE estado = 'ACTIVO' ORDER BY fecha_carga DESC, id_documento DESC");
    echo json_encode(['success' => true, 'data' => $consulta->fetchAll()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    error_log('[documents_list] ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => ['message' => 'No se pudieron cargar los documentos.']], JSON_UNESCAPED_UNICODE);
}
