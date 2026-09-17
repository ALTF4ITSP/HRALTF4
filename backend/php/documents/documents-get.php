<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => ['message' => 'Documento no válido.']], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $consulta = db()->prepare('SELECT d.id_documento, d.titulo, d.descripcion, d.ruta_archivo, DATE(d.fecha_carga) AS fecha, t.nombre AS tipo FROM documento d JOIN tipo_documento t ON t.id_tipo_documento = d.id_tipo_documento WHERE d.id_documento = ? AND d.estado = ?');
    $consulta->execute([$id, 'ACTIVO']);
    $documento = $consulta->fetch();
    if (!$documento) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => ['message' => 'No se encontró el documento.']], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo json_encode(['success' => true, 'data' => $documento], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    error_log('[documents_get] ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => ['message' => 'No se pudo cargar el documento.']], JSON_UNESCAPED_UNICODE);
}
