<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/connection.php';
require_once __DIR__ . '/documents-storage.php';
header('Content-Type: application/json; charset=utf-8');

function create_response(int $status, bool $success, array $data = [], string $message = ''): never
{
    http_response_code($status);
    echo json_encode($success
        ? ['success' => true, 'data' => $data]
        : ['success' => false, 'error' => ['message' => $message]], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    create_response(405, false, [], 'Método no permitido.');
}

$nombre = trim((string) ($_POST['nombre'] ?? ''));
$paciente = trim((string) ($_POST['paciente'] ?? ''));
$fecha = trim((string) ($_POST['fecha'] ?? ''));
$categoria = trim((string) ($_POST['categoria'] ?? ''));
$descripcion = trim((string) ($_POST['descripcion'] ?? ''));
$archivo = $_FILES['archivo'] ?? null;
$tipos = [
    'informe' => 'Informe médico',
    'estudio' => 'Estudio de Laboratorio',
    'administrativo' => 'Documento Administrativo'
];

if ($nombre === '' || $paciente === '' || $fecha === '' || $categoria === '') {
    create_response(422, false, [], 'Completá los campos obligatorios.');
}
if (!isset($tipos[$categoria])) create_response(422, false, [], 'Categoría de documento no válida.');
if (!is_array($archivo) || ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    create_response(422, false, [], 'Seleccioná un archivo válido.');
}

$extension = strtolower(pathinfo((string) $archivo['name'], PATHINFO_EXTENSION));
if (!in_array($extension, ['pdf', 'docx', 'jpg', 'jpeg', 'png'], true)) {
    create_response(415, false, [], 'Formato no permitido. Usá PDF, DOCX, JPG o PNG.');
}
if ((int) $archivo['size'] <= 0 || (int) $archivo['size'] > 10 * 1024 * 1024) {
    create_response(422, false, [], 'El archivo debe pesar como máximo 10 MB.');
}

$conexion = null;
$rutaFisica = null;
try {
    $conexion = db();
    $conexion->beginTransaction();

    $buscarTipo = $conexion->prepare('SELECT id_tipo_documento FROM tipo_documento WHERE nombre = ?');
    $buscarTipo->execute([$tipos[$categoria]]);
    $idTipo = $buscarTipo->fetchColumn();
    if (!$idTipo) {
        $crearTipo = $conexion->prepare('INSERT INTO tipo_documento (nombre, descripcion) VALUES (?, ?)');
        $crearTipo->execute([$tipos[$categoria], 'Tipo de documento utilizado por el sistema.']);
        $idTipo = $conexion->lastInsertId();
    }

    $carpeta = document_storage_directory();
    $nombreArchivo = 'doc_' . bin2hex(random_bytes(16)) . '.' . $extension;
    $rutaFisica = $carpeta . '/' . $nombreArchivo;
    if (!move_uploaded_file((string) $archivo['tmp_name'], $rutaFisica)) {
        throw new RuntimeException('No se pudo guardar el archivo en el servidor.');
    }

    $insertar = $conexion->prepare("INSERT INTO documento (id_tipo_documento, titulo, descripcion, ruta_archivo, fecha_carga, version, estado) VALUES (?, ?, ?, ?, ?, 1, 'ACTIVO')");
    $insertar->execute([$idTipo, $nombre, $descripcion, 'uploads/documentos/' . $nombreArchivo, $fecha . ' 00:00:00']);
    $idDocumento = (int) $conexion->lastInsertId();
    $conexion->commit();
    create_response(201, true, ['id_documento' => $idDocumento]);
} catch (Throwable $error) {
    if ($conexion instanceof PDO && $conexion->inTransaction()) $conexion->rollBack();
    if (is_string($rutaFisica) && is_file($rutaFisica)) unlink($rutaFisica);
    error_log('[documents_create] ' . $error->getMessage());
    create_response(500, false, [], 'No se pudo guardar el documento. Revisá la conexión y la carpeta de archivos.');
}
