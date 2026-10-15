<?php
declare(strict_types=1);
require_once __DIR__ . '/surveys-common.php';

$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) survey_error(422, 'Encuesta no válida.');

try {
    $conexion = db();

    $buscar = $conexion->prepare('SELECT id_encuesta, titulo, descripcion, estado FROM encuesta WHERE id_encuesta = ?');
    $buscar->execute([$id]);
    $encuesta = $buscar->fetch();
    if (!$encuesta) survey_error(404, 'No se encontró la encuesta.');

    $preguntas = $conexion->prepare(
        'SELECT id_pregunta, enunciado, tipo, obligatoria, opciones
         FROM pregunta WHERE id_encuesta = ? ORDER BY orden'
    );
    $preguntas->execute([$id]);

    // Las opciones se guardan una por línea; se devuelven como lista
    $encuesta['preguntas'] = array_map(function (array $pregunta): array {
        $pregunta['opciones'] = $pregunta['opciones']
            ? array_values(array_filter(array_map('trim', explode("\n", $pregunta['opciones']))))
            : [];
        return $pregunta;
    }, $preguntas->fetchAll());

    survey_response(200, ['success' => true, 'data' => $encuesta]);
} catch (Throwable $error) {
    error_log('[surveys_get] ' . $error->getMessage());
    survey_error(500, 'No se pudo cargar la encuesta.');
}
