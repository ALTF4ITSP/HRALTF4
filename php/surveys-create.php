<?php
declare(strict_types=1);
require_once __DIR__ . '/surveys-common.php';

survey_require_post();
session_start();

$idFuncionario = (int) ($_SESSION['id_funcionario'] ?? 0);
if ($idFuncionario < 1) survey_error(401, 'La sesión no está iniciada.');

$datos = survey_json_body();
$titulo = trim((string) ($datos['titulo'] ?? ''));
$descripcion = trim((string) ($datos['descripcion'] ?? ''));
$idServicio = filter_var($datos['id_servicio'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$estado = strtoupper((string) ($datos['estado'] ?? 'BORRADOR'));
$preguntas = is_array($datos['preguntas'] ?? null) ? $datos['preguntas'] : [];

if ($titulo === '' || mb_strlen($titulo) > 200) survey_error(422, 'El título es obligatorio (máximo 200 caracteres).');
if (mb_strlen($descripcion) > 500) survey_error(422, 'La descripción puede tener hasta 500 caracteres.');
if (!$idServicio) survey_error(422, 'Seleccioná una categoría.');
if (!in_array($estado, SURVEY_STATES, true)) survey_error(422, 'Estado no válido.');
if (!$preguntas) survey_error(422, 'Agregá al menos una pregunta.');

foreach ($preguntas as $pregunta) {
    $enunciado = trim((string) ($pregunta['enunciado'] ?? ''));
    $tipo = (string) ($pregunta['tipo'] ?? '');
    $opciones = is_array($pregunta['opciones'] ?? null) ? $pregunta['opciones'] : [];

    if ($enunciado === '' || mb_strlen($enunciado) > 500) survey_error(422, 'Todas las preguntas necesitan un enunciado.');
    if (!in_array($tipo, SURVEY_TYPES, true)) survey_error(422, 'Tipo de pregunta no válido.');
    if ($tipo === 'OPCION' && count($opciones) < 2) {
        survey_error(422, 'Las preguntas de opción múltiple necesitan al menos 2 opciones.');
    }
}

$conexion = db();

try {
    $conexion->beginTransaction();

    $insertarEncuesta = $conexion->prepare(
        'INSERT INTO encuesta (titulo, descripcion, fecha_creacion, estado, id_servicio, id_funcionario_crea)
         VALUES (?, ?, NOW(), ?, ?, ?)'
    );
    $insertarEncuesta->execute([$titulo, $descripcion ?: null, $estado, $idServicio, $idFuncionario]);
    $idEncuesta = (int) $conexion->lastInsertId();

    $insertarPregunta = $conexion->prepare(
        'INSERT INTO pregunta (id_encuesta, enunciado, tipo, orden, obligatoria, opciones)
         VALUES (?, ?, ?, ?, ?, ?)'
    );

    foreach (array_values($preguntas) as $orden => $pregunta) {
        $opciones = $pregunta['tipo'] === 'OPCION'
            ? implode("\n", array_map(fn($opcion) => trim((string) $opcion), $pregunta['opciones']))
            : null;

        $insertarPregunta->execute([
            $idEncuesta,
            trim((string) $pregunta['enunciado']),
            $pregunta['tipo'],
            $orden + 1,
            $pregunta['tipo'] === 'TEXTO' ? 0 : 1, // la respuesta libre es opcional
            $opciones
        ]);
    }

    $conexion->commit();
    survey_response(201, ['success' => true, 'id_encuesta' => $idEncuesta]);
} catch (Throwable $error) {
    if ($conexion->inTransaction()) $conexion->rollBack();
    error_log('[surveys_create] ' . $error->getMessage());
    survey_error(500, 'No se pudo guardar la encuesta.');
}
