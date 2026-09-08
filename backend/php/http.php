<?php
declare(strict_types=1);

function document_json_response(int $status, bool $success, ?array $data = null, ?array $error = null): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    $payload = ['success' => $success];

    if ($success) {
        $payload['data'] = $data;
    } else {
        $payload['error'] = $error;
    }

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
