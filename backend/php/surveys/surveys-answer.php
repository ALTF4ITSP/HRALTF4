<?php
declare(strict_types=1);
require_once __DIR__ . '/surveys-common.php';

// Lo usa el paciente: no necesita sesión y la respuesta es anónima
survey_require_post();

$datos = survey_json_body();
$id = filter_var($datos['id_encuesta'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$respuestas = is_array($datos['respuestas'] ?? null) ? $datos['respuestas'] : [];
if (!$id) survey_error(422, 'Encuesta no válida.');

$conexion = db();

try {
    $buscar = $conexion->prepare('SELECT estado FROM encuesta WHERE id_encuesta = ?');
    $buscar->execute([$id]);
    if ($buscar->fetchColumn() !== 'ACTIVA') survey_error(409, 'Esta encuesta no está activa.');

    $preguntas = $conexion->prepare('SELECT id_pregunta, obligatoria FROM pregunta WHERE id_encuesta = ?');
    $preguntas->execute([$id]);
    $preguntas = $preguntas->fetchAll();

    foreach ($preguntas as $pregunta) {
        $valor = trim((string) ($respuestas[$pregunta['id_pregunta']] ?? ''));
        if ((int) $pregunta['obligatoria'] === 1 && $valor === '') {
            survey_error(422, 'Respondé todas las preguntas obligatorias.');
        }
    }

    $conexion->beginTransaction();

    $conexion->prepare(
        'INSERT INTO envio_encuesta (id_encuesta, id_persona, fecha_hora, completada) VALUES (?, NULL, NOW(), 1)'
    )->execute([$id]);
    $idEnvio = (int) $conexion->lastInsertId();

    $insertar = $conexion->prepare(
        'INSERT INTO respuesta (id_envio, id_pregunta, respuesta_texto) VALUES (?, ?, ?)'
    );
    foreach ($preguntas as $pregunta) {
        $valor = trim((string) ($respuestas[$pregunta['id_pregunta']] ?? ''));
        if ($valor !== '') $insertar->execute([$idEnvio, $pregunta['id_pregunta'], mb_substr($valor, 0, 1000)]);
    }

    $conexion->commit();
    survey_response(201, ['success' => true]);
} catch (Throwable $error) {
    if ($conexion->inTransaction()) $conexion->rollBack();
    error_log('[surveys_answer] ' . $error->getMessage());
    survey_error(500, 'No se pudieron guardar las respuestas.');
}
