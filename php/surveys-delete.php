<?php
declare(strict_types=1);
require_once __DIR__ . '/surveys-common.php';

survey_require_post();
session_start();

if (empty($_SESSION['id_funcionario'])) survey_error(401, 'La sesión no está iniciada.');

$id = filter_var($_POST['id_encuesta'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) survey_error(422, 'Encuesta no válida.');

$conexion = db();

try {
    $conexion->beginTransaction();

    // Se borra en orden: respuestas, envíos, preguntas y por último la encuesta
    $conexion->prepare(
        'DELETE r FROM respuesta r
         INNER JOIN envio_encuesta v ON v.id_envio = r.id_envio
         WHERE v.id_encuesta = ?'
    )->execute([$id]);
    $conexion->prepare('DELETE FROM envio_encuesta WHERE id_encuesta = ?')->execute([$id]);
    $conexion->prepare('DELETE FROM pregunta WHERE id_encuesta = ?')->execute([$id]);

    $eliminar = $conexion->prepare('DELETE FROM encuesta WHERE id_encuesta = ?');
    $eliminar->execute([$id]);

    if ($eliminar->rowCount() === 0) {
        $conexion->rollBack();
        survey_error(404, 'No se encontró la encuesta.');
    }

    $conexion->commit();
    survey_response(200, ['success' => true]);
} catch (Throwable $error) {
    if ($conexion->inTransaction()) $conexion->rollBack();
    error_log('[surveys_delete] ' . $error->getMessage());
    survey_error(500, 'No se pudo eliminar la encuesta.');
}
