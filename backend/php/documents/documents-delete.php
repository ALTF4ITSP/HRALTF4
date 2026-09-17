<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/connection.php';
require_once __DIR__ . '/documents-storage.php';
header('Content-Type: application/json; charset=utf-8');

function delete_response(int $status, bool $success, string $message = ''): never
{
    http_response_code($status);
    echo json_encode($success
        ? ['success' => true]
        : ['success' => false, 'error' => ['message' => $message]], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    delete_response(405, false, 'Método no permitido.');
}

$id = filter_var($_POST['id_documento'] ?? null, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1]
]);
if (!$id) delete_response(422, false, 'Documento no válido.');

try {
    $conexion = db();
    $buscar = $conexion->prepare('SELECT ruta_archivo FROM documento WHERE id_documento = ?');
    $buscar->execute([$id]);
    $rutaArchivo = $buscar->fetchColumn();
    if ($rutaArchivo === false) delete_response(404, false, 'No se encontró el documento.');

    $eliminar = $conexion->prepare('DELETE FROM documento WHERE id_documento = ?');
    $eliminar->execute([$id]);

    $nombreArchivo = basename((string) $rutaArchivo);
    foreach (document_storage_directories() as $directory) {
        $file = $directory . DIRECTORY_SEPARATOR . $nombreArchivo;
        if (is_file($file) && !unlink($file)) {
            error_log('[documents_delete] No se pudo eliminar el archivo ' . $file);
        }
    }

    delete_response(200, true);
} catch (Throwable $error) {
    error_log('[documents_delete] ' . $error->getMessage());
    delete_response(500, false, 'No se pudo eliminar el documento.');
}
