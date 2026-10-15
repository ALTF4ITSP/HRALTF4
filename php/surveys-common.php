<?php
declare(strict_types=1);

require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

// Tipos de pregunta que acepta la tabla pregunta
const SURVEY_TYPES = ['OPCION', 'ESCALA', 'TEXTO', 'SI_NO'];
const SURVEY_STATES = ['ACTIVA', 'BORRADOR', 'FINALIZADA'];

function survey_response(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function survey_error(int $status, string $message): never
{
    survey_response($status, ['success' => false, 'error' => ['message' => $message]]);
}

function survey_require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        header('Allow: POST');
        survey_error(405, 'Método no permitido.');
    }
}

// Los datos de crear/responder llegan como JSON desde fetch
function survey_json_body(): array
{
    $datos = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($datos)) survey_error(400, 'Datos no válidos.');
    return $datos;
}
