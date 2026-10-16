<?php
declare(strict_types=1);
require_once __DIR__ . '/connection.php';
require_once __DIR__ . '/documents-storage.php';

/*
 * Entrega el archivo de un documento.
 *   documents-file.php?id=3              → se muestra en el navegador (PDF o imagen)
 *   documents-file.php?qr=<token>        → lo mismo, desde el código QR
 *   documents-file.php?id=3&descargar=1  → se descarga con el título del documento como nombre
 */

const TIPOS_MIME = [
    'pdf' => 'application/pdf',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$token = (string) ($_GET['qr'] ?? '');

if ($token !== '' && preg_match('/^[a-f0-9]{32}$/', $token)) {
    $consulta = db()->prepare(
        "SELECT d.titulo, d.ruta_archivo FROM documento d
         JOIN qr ON qr.id_documento = d.id_documento AND qr.estado = 'ACTIVO'
         WHERE qr.token = ? AND d.estado = 'ACTIVO'"
    );
    $consulta->execute([$token]);
} elseif ($id) {
    $consulta = db()->prepare("SELECT titulo, ruta_archivo FROM documento WHERE id_documento = ? AND estado = 'ACTIVO'");
    $consulta->execute([$id]);
} else {
    http_response_code(422);
    exit('Documento no válido.');
}
$documento = $consulta->fetch();
if (!$documento) {
    http_response_code(404);
    exit('No se encontró el documento.');
}

// basename() evita que se pueda pedir un archivo fuera de la carpeta de documentos
$nombreArchivo = basename((string) $documento['ruta_archivo']);
$ruta = null;
foreach (document_storage_directories() as $carpeta) {
    if (is_file($carpeta . '/' . $nombreArchivo)) {
        $ruta = $carpeta . '/' . $nombreArchivo;
        break;
    }
}
if ($ruta === null) {
    http_response_code(404);
    exit('El archivo del documento no está en el servidor.');
}

$extension = strtolower(pathinfo($nombreArchivo, PATHINFO_EXTENSION));
$descargar = isset($_GET['descargar']) || !in_array($extension, ['pdf', 'png', 'jpg', 'jpeg'], true);
// Nombre de descarga: el título sin caracteres raros
$nombreDescarga = trim(preg_replace('/[^\w\- áéíóúñÁÉÍÓÚÑ]+/u', '', (string) $documento['titulo'])) ?: 'documento';

header('Content-Type: ' . (TIPOS_MIME[$extension] ?? 'application/octet-stream'));
header('Content-Length: ' . filesize($ruta));
header('X-Content-Type-Options: nosniff');
header('Content-Disposition: ' . ($descargar ? 'attachment' : 'inline') . '; filename="' . $nombreDescarga . '.' . $extension . '"');
readfile($ruta);
