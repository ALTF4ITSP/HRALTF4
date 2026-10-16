<?php
declare(strict_types=1);
require_once __DIR__ . '/connection.php';
require_once __DIR__ . '/documents-storage.php';
require_once __DIR__ . '/documents-qr.php';
header('Content-Type: application/json; charset=utf-8');

// Datos de un documento para el visor y el formulario de edición: documents-get.php?id=3
try {
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => ['message' => 'Documento no válido.']], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $consulta = db()->prepare(
        "SELECT d.id_documento, d.titulo, d.descripcion, d.ruta_archivo,
                DATE(d.fecha_carga) AS fecha, DATE_FORMAT(d.fecha_carga, '%d/%m/%Y') AS fecha_texto, d.version,
                t.nombre AS tipo, TRIM(CONCAT(COALESCE(p.nombre, ''), ' ', COALESCE(p.apellido, ''))) AS autor
         FROM documento d
         JOIN tipo_documento t ON t.id_tipo_documento = d.id_tipo_documento
         LEFT JOIN persona p ON p.id_persona = d.id_funcionario_carga
         WHERE d.id_documento = ? AND d.estado = 'ACTIVO'"
    );
    $consulta->execute([$id]);
    $documento = $consulta->fetch();
    if (!$documento) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => ['message' => 'No se encontró el documento.']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $documento['qr'] = documento_qr(db(), (int) $documento['id_documento']);

    // Extensión y tamaño del archivo guardado
    $documento['extension'] = strtolower(pathinfo((string) $documento['ruta_archivo'], PATHINFO_EXTENSION));
    $documento['tamano'] = null;
    foreach (document_storage_directories() as $carpeta) {
        $ruta = $carpeta . '/' . basename((string) $documento['ruta_archivo']);
        if (is_file($ruta)) {
            $documento['tamano'] = filesize($ruta);
            break;
        }
    }

    echo json_encode(['success' => true, 'data' => $documento], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    error_log('[documents_get] ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => ['message' => 'No se pudo cargar el documento.']], JSON_UNESCAPED_UNICODE);
}
