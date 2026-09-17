<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/connection.php';
require_once __DIR__ . '/documents-storage.php';

header('Content-Type: application/json; charset=utf-8');

function document_update_response(int $status, bool $success, array $data = [], string $message = ''): never
{
    http_response_code($status);

    if ($success) {
        echo json_encode([
            'success' => true,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        echo json_encode([
            'success' => false,
            'error' => [
                'message' => $message
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    document_update_response(405, false, [], 'Método no permitido.');
}

$idDocumento = filter_var(
    $_POST['id_documento'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);
$nombre = trim((string) ($_POST['nombre'] ?? ''));
$paciente = trim((string) ($_POST['paciente'] ?? ''));
$fecha = trim((string) ($_POST['fecha'] ?? ''));
$categoria = trim((string) ($_POST['categoria'] ?? ''));
$descripcion = trim((string) ($_POST['descripcion'] ?? ''));

if ($idDocumento === false) {
    document_update_response(422, false, [], 'El documento indicado no es válido.');
}

if ($nombre === '' || $paciente === '' || $fecha === '' || $categoria === '') {
    document_update_response(422, false, [], 'Completá los campos obligatorios.');
}

$tipos = [
    'informe' => 'Informe médico',
    'estudio' => 'Estudio de Laboratorio',
    'administrativo' => 'Documento Administrativo'
];

if (!isset($tipos[$categoria])) {
    document_update_response(422, false, [], 'Categoría de documento no válida.');
}

$archivo = $_FILES['archivo'] ?? null;
$reemplazaArchivo = is_array($archivo)
    && ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
$extension = '';

if ($reemplazaArchivo) {
    if (($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        document_update_response(422, false, [], 'Hubo un error al subir el archivo.');
    }

    $extension = strtolower(pathinfo((string) $archivo['name'], PATHINFO_EXTENSION));
    $extensionesPermitidas = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];

    if (!in_array($extension, $extensionesPermitidas, true)) {
        document_update_response(415, false, [], 'Formato no permitido. Usá PDF, DOCX, JPG o PNG.');
    }

    $tamano = (int) ($archivo['size'] ?? 0);

    if ($tamano <= 0 || $tamano > 10 * 1024 * 1024) {
        document_update_response(422, false, [], 'El archivo debe pesar como máximo 10 MB.');
    }

    if (!is_uploaded_file((string) $archivo['tmp_name'])) {
        document_update_response(400, false, [], 'El archivo recibido no es válido.');
    }
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conexion = null;
$transaccionActiva = false;
$rutaFisicaNueva = null;

try {
    $conexion = db_mysqli();

    $buscarDocumento = $conexion->prepare(
        'SELECT ruta_archivo
         FROM documento
         WHERE id_documento = ?
         LIMIT 1'
    );
    $buscarDocumento->bind_param('i', $idDocumento);
    $buscarDocumento->execute();
    $documento = $buscarDocumento->get_result()->fetch_assoc();
    $buscarDocumento->close();

    if (!$documento) {
        document_update_response(404, false, [], 'No se encontró el documento.');
    }

    $conexion->begin_transaction();
    $transaccionActiva = true;

    $nombreTipo = $tipos[$categoria];
    $buscarTipo = $conexion->prepare(
        'SELECT id_tipo_documento
         FROM tipo_documento
         WHERE nombre = ?
         LIMIT 1'
    );
    $buscarTipo->bind_param('s', $nombreTipo);
    $buscarTipo->execute();
    $tipo = $buscarTipo->get_result()->fetch_assoc();
    $buscarTipo->close();

    if ($tipo) {
        $idTipoDocumento = (int) $tipo['id_tipo_documento'];
    } else {
        $crearTipo = $conexion->prepare(
            'INSERT INTO tipo_documento (nombre, descripcion)
             VALUES (?, ?)'
        );
        $descripcionTipo = 'Tipo de documento utilizado por el sistema.';
        $crearTipo->bind_param('ss', $nombreTipo, $descripcionTipo);
        $crearTipo->execute();
        $idTipoDocumento = (int) $conexion->insert_id;
        $crearTipo->close();
    }

    $rutaBaseUploads = document_storage_directory();
    $rutaArchivo = (string) $documento['ruta_archivo'];

    if ($reemplazaArchivo) {
        $nombreArchivo = 'doc_' . bin2hex(random_bytes(16)) . '.' . $extension;
        $rutaFisicaNueva = $rutaBaseUploads . DIRECTORY_SEPARATOR . $nombreArchivo;

        if (!move_uploaded_file((string) $archivo['tmp_name'], $rutaFisicaNueva)) {
            throw new RuntimeException('No se pudo guardar el archivo en el servidor.');
        }

        $rutaArchivo = 'uploads/documentos/' . $nombreArchivo;
    }

    $actualizar = $conexion->prepare(
        'UPDATE documento
         SET id_tipo_documento = ?,
             titulo = ?,
             descripcion = ?,
             ruta_archivo = ?,
             fecha_carga = ?,
             version = version + 1
         WHERE id_documento = ?'
    );
    $actualizar->bind_param(
        'issssi',
        $idTipoDocumento,
        $nombre,
        $descripcion,
        $rutaArchivo,
        $fecha,
        $idDocumento
    );
    $actualizar->execute();
    $actualizar->close();

    $conexion->commit();
    $transaccionActiva = false;

    if ($reemplazaArchivo && !empty($documento['ruta_archivo'])) {
        $rutaFisicaAnterior = $rutaBaseUploads
            . DIRECTORY_SEPARATOR
            . basename((string) $documento['ruta_archivo']);

        if (is_file($rutaFisicaAnterior) && $rutaFisicaAnterior !== $rutaFisicaNueva) {
            unlink($rutaFisicaAnterior);
        }
    }

    document_update_response(200, true, [
        'id_documento' => (int) $idDocumento,
        'ruta_archivo' => $rutaArchivo
    ]);
} catch (Throwable $error) {
    if ($conexion instanceof mysqli && $transaccionActiva) {
        $conexion->rollback();
    }

    if (is_string($rutaFisicaNueva) && is_file($rutaFisicaNueva)) {
        unlink($rutaFisicaNueva);
    }

    error_log('[documents_update] ' . $error->getMessage());
    document_update_response(500, false, [], 'No se pudo actualizar el documento.');
}
