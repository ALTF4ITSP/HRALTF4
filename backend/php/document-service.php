<?php
declare(strict_types=1);

require_once __DIR__ . '/document-repository.php';

final class DocumentRequestException extends RuntimeException
{
    private $status;
    private $errorCode;
    private $fields;

    public function __construct(int $status, string $errorCode, string $message, array $fields = [])
    {
        parent::__construct($message);
        $this->status = $status;
        $this->errorCode = $errorCode;
        $this->fields = $fields;
    }

    public function status(): int
    {
        return $this->status;
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }

    public function fields(): array
    {
        return $this->fields;
    }
}

function document_create(array $post, array $files): array
{
    $config = document_config();
    $fields = document_validated_fields($post, $config);
    $file = document_store_upload($files['archivo'] ?? null, true, $config);
    $timestamp = gmdate('Y-m-d\TH:i:s\Z');
    $record = array_merge($fields, [
        'archivo' => $file,
        'fecha_subida' => $timestamp,
        'fecha_modificacion' => $timestamp,
    ]);

    try {
        return document_repository_create($record, $config);
    } catch (Throwable $error) {
        document_remove_stored_file($file['nombre_almacenado'], $config);
        throw $error;
    }
}

function document_update(array $post, array $files): array
{
    $config = document_config();
    $id = filter_var($post['id_documento'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

    if ($id === false) {
        throw new DocumentRequestException(422, 'validation_error', 'El identificador del documento no es válido.', [
            'id_documento' => 'Debe ser un número entero positivo.',
        ]);
    }

    $existing = document_repository_find((int) $id, $config);
    if ($existing === null) {
        throw new DocumentRequestException(404, 'document_not_found', 'No se encontró el documento solicitado.');
    }

    $fields = document_validated_fields($post, $config);
    $replacement = document_store_upload($files['archivo'] ?? null, false, $config);
    $record = array_merge($existing, $fields, [
        'id_documento' => (int) $id,
        'fecha_modificacion' => gmdate('Y-m-d\TH:i:s\Z'),
    ]);

    if ($replacement !== null) {
        $record['archivo'] = $replacement;
    }

    try {
        $updated = document_repository_update($record, $config);
    } catch (Throwable $error) {
        if ($replacement !== null) {
            document_remove_stored_file($replacement['nombre_almacenado'], $config);
        }
        throw $error;
    }

    if ($replacement !== null && isset($existing['archivo']['nombre_almacenado'])) {
        document_remove_stored_file($existing['archivo']['nombre_almacenado'], $config);
    }

    return $updated;
}

function document_config(): array
{
    static $config = null;

    if ($config === null) {
        $config = require dirname(__DIR__) . '/config/documents.php';
    }

    return $config;
}

function document_validated_fields(array $post, array $config): array
{
    $values = [
        'nombre' => document_clean_text($post['nombre'] ?? '', 150),
        'paciente' => document_clean_text($post['paciente'] ?? '', 80),
        'fecha_documento' => document_clean_text($post['fecha'] ?? '', 10),
        'categoria' => document_clean_text($post['categoria'] ?? '', 32),
    ];
    $errors = [];

    if ($values['nombre'] === '') {
        $errors['nombre'] = 'El nombre es obligatorio.';
    }
    if ($values['paciente'] === '') {
        $errors['paciente'] = 'El paciente o la cédula son obligatorios.';
    }
    if (!document_valid_date($values['fecha_documento'])) {
        $errors['fecha'] = 'La fecha debe usar el formato YYYY-MM-DD.';
    }
    if (!in_array($values['categoria'], $config['categories'], true)) {
        $errors['categoria'] = 'La categoría seleccionada no es válida.';
    }

    if ($errors !== []) {
        throw new DocumentRequestException(422, 'validation_error', 'Revisá los datos ingresados.', $errors);
    }

    return $values;
}

function document_clean_text($value, int $maxLength): string
{
    if (!is_scalar($value)) {
        return '';
    }

    $clean = trim(strip_tags((string) $value));
    $clean = preg_replace('/\s+/u', ' ', $clean) ?? '';

    if (function_exists('mb_substr')) {
        return mb_substr($clean, 0, $maxLength, 'UTF-8');
    }

    return substr($clean, 0, $maxLength);
}

function document_valid_date(string $value): bool
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}

function document_store_upload(?array $file, bool $required, array $config): ?array
{
    if ($file === null || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        if ($required) {
            throw new DocumentRequestException(422, 'validation_error', 'Seleccioná un archivo para continuar.', [
                'archivo' => 'El archivo es obligatorio.',
            ]);
        }

        return null;
    }

    $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error !== UPLOAD_ERR_OK) {
        throw new DocumentRequestException(400, 'upload_error', document_upload_error_message($error));
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size < 1 || $size > $config['max_upload_bytes']) {
        throw new DocumentRequestException(413, 'file_too_large', 'El archivo supera el límite permitido de 10 MB.');
    }

    $temporaryPath = (string) ($file['tmp_name'] ?? '');
    if ($temporaryPath === '' || !is_uploaded_file($temporaryPath)) {
        throw new DocumentRequestException(400, 'invalid_upload', 'El archivo recibido no es una carga válida.');
    }

    $unsafeName = str_replace("\0", '', (string) ($file['name'] ?? 'archivo'));
    $unsafeName = basename(str_replace('\\', '/', $unsafeName));
    $extension = strtolower(pathinfo($unsafeName, PATHINFO_EXTENSION));
    $baseName = document_clean_text(pathinfo($unsafeName, PATHINFO_FILENAME), 240);
    $originalName = ($baseName !== '' ? $baseName : 'archivo') . '.' . $extension;
    if (!function_exists('finfo_open')) {
        throw new DocumentRequestException(500, 'server_configuration_error', 'No se pudo validar el tipo de archivo.');
    }

    $fileInfo = finfo_open(FILEINFO_MIME_TYPE);

    if ($fileInfo === false) {
        throw new DocumentRequestException(500, 'server_configuration_error', 'No se pudo validar el tipo de archivo.');
    }

    $mimeType = (string) finfo_file($fileInfo, $temporaryPath);
    finfo_close($fileInfo);
    $allowedExtensions = $config['allowed_mime_types'][$mimeType] ?? [];

    if (!in_array($extension, $allowedExtensions, true)) {
        throw new DocumentRequestException(415, 'unsupported_file_type', 'El formato debe ser PDF, DOCX, JPG o PNG.');
    }

    $uploadDirectory = $config['upload_dir'];
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true) && !is_dir($uploadDirectory)) {
        throw new DocumentRequestException(500, 'storage_unavailable', 'No se pudo preparar el almacenamiento de archivos.');
    }

    $storedName = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = $uploadDirectory . DIRECTORY_SEPARATOR . $storedName;

    if (!move_uploaded_file($temporaryPath, $destination)) {
        throw new DocumentRequestException(500, 'storage_error', 'No se pudo guardar el archivo recibido.');
    }

    return [
        'nombre_original' => $originalName,
        'nombre_almacenado' => $storedName,
        'tipo_mime' => $mimeType,
        'tamano_bytes' => $size,
    ];
}

function document_remove_stored_file(string $storedName, array $config): void
{
    $safeName = basename($storedName);
    if ($safeName === '' || $safeName !== $storedName) {
        return;
    }

    $path = $config['upload_dir'] . DIRECTORY_SEPARATOR . $safeName;
    if (is_file($path)) {
        unlink($path);
    }
}

function document_upload_error_message(int $error): string
{
    $messages = [
        UPLOAD_ERR_INI_SIZE => 'El archivo supera el límite configurado en el servidor.',
        UPLOAD_ERR_FORM_SIZE => 'El archivo supera el límite indicado por el formulario.',
        UPLOAD_ERR_PARTIAL => 'El archivo se recibió de forma incompleta.',
        UPLOAD_ERR_NO_TMP_DIR => 'El servidor no tiene un directorio temporal disponible.',
        UPLOAD_ERR_CANT_WRITE => 'El servidor no pudo escribir el archivo.',
        UPLOAD_ERR_EXTENSION => 'Una extensión del servidor detuvo la carga.',
    ];

    return $messages[$error] ?? 'No se pudo recibir el archivo.';
}
