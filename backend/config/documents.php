<?php
declare(strict_types=1);

$projectRoot = dirname(__DIR__, 2);
$configuredLimit = (int) (getenv('DOCUMENT_MAX_UPLOAD_BYTES') ?: 10485760);

return [
    'storage_driver' => strtolower(getenv('DOCUMENT_STORAGE_DRIVER') ?: 'json'),
    'json_path' => getenv('DOCUMENT_JSON_PATH') ?: $projectRoot . '/db/json/documents.json',
    'upload_dir' => getenv('DOCUMENT_UPLOAD_DIR') ?: dirname(__DIR__) . '/storage/documents',
    'log_path' => getenv('DOCUMENT_LOG_PATH') ?: $projectRoot . '/logs/documents.log',
    'max_upload_bytes' => $configuredLimit > 0 ? $configuredLimit : 10485760,
    'allowed_mime_types' => [
        'application/pdf' => ['pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['docx'],
        'application/zip' => ['docx'],
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
    ],
    'categories' => ['informe', 'estudio', 'administrativo'],
    'pdo' => [
        'dsn' => getenv('DOCUMENT_DB_DSN') ?: '',
        'username' => getenv('DOCUMENT_DB_USER') ?: '',
        'password' => getenv('DOCUMENT_DB_PASSWORD') ?: '',
    ],
];
