<?php
declare(strict_types=1);

require_once __DIR__ . '/http.php';
require_once __DIR__ . '/document-service.php';

function handle_document_request(string $operation): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        document_json_response(405, false, null, [
            'code' => 'method_not_allowed',
            'message' => 'Este endpoint solo acepta solicitudes POST.',
        ]);
    }

    try {
        $data = $operation === 'create'
            ? document_create($_POST, $_FILES)
            : document_update($_POST, $_FILES);

        document_json_response($operation === 'create' ? 201 : 200, true, $data);
    } catch (DocumentRequestException $error) {
        $details = [
            'code' => $error->errorCode(),
            'message' => $error->getMessage(),
        ];

        if ($error->fields() !== []) {
            $details['fields'] = $error->fields();
        }

        document_json_response($error->status(), false, null, $details);
    } catch (Throwable $error) {
        document_log_error($error);
        document_json_response(500, false, null, [
            'code' => 'internal_error',
            'message' => 'No se pudo procesar el documento. Intentá nuevamente.',
        ]);
    }
}

function document_log_error(Throwable $error): void
{
    $config = document_config();
    $logDirectory = dirname($config['log_path']);

    if (!is_dir($logDirectory)) {
        mkdir($logDirectory, 0750, true);
    }

    $line = sprintf(
        "[%s] %s in %s:%d%s",
        gmdate('c'),
        $error->getMessage(),
        $error->getFile(),
        $error->getLine(),
        PHP_EOL
    );

    error_log($line, 3, $config['log_path']);
}
