<?php
declare(strict_types=1);

/*
 * Turnos de pacientes para el Calendario.
 *
 *   GET  turnos.php?desde=2026-10-12&hasta=2026-10-18
 *        → turnos de esas fechas + listas de pacientes y médicos para el formulario
 *   POST turnos.php  {"accion": "guardar", "turno": {...}}   (sin id_turno = nuevo)
 *   POST turnos.php  {"accion": "borrar", "id_turno": 5}
 */

require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

const ESTADOS_TURNO = ['PROGRAMADO', 'ATENDIDO', 'CANCELADO'];

function turnos_responder(int $status, array $cuerpo): never
{
    http_response_code($status);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    exit;
}

function turnos_error(int $status, string $mensaje): never
{
    turnos_responder($status, ['success' => false, 'error' => ['message' => $mensaje]]);
}

function fecha_valida(string $fecha): bool
{
    $d = DateTime::createFromFormat('!Y-m-d', $fecha);
    return $d && $d->format('Y-m-d') === $fecha;
}

$conexion = db();

// ---------- Leer una semana ----------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $desde = (string) ($_GET['desde'] ?? '');
    $hasta = (string) ($_GET['hasta'] ?? '');
    if (!fecha_valida($desde) || !fecha_valida($hasta)) turnos_error(422, 'Fechas no válidas.');

    try {
        $consulta = $conexion->prepare(
            "SELECT t.id_turno, t.id_gestion_paciente, t.id_gestion_medico, t.fecha,
                    TIME_FORMAT(t.hora_inicio, '%H:%i') AS hora_inicio,
                    TIME_FORMAT(t.hora_fin, '%H:%i') AS hora_fin,
                    t.motivo, t.estado, t.notas,
                    p.nombre AS paciente,
                    m.nombre AS medico
             FROM turno t
             INNER JOIN gestion_paciente p ON p.id_gestion_paciente = t.id_gestion_paciente
             LEFT JOIN gestion_medico m ON m.id_gestion_medico = t.id_gestion_medico
             WHERE t.fecha BETWEEN ? AND ?
             ORDER BY t.fecha, t.hora_inicio"
        );
        $consulta->execute([$desde, $hasta]);

        $pacientes = $conexion->query(
            'SELECT id_gestion_paciente AS id, nombre, documento FROM gestion_paciente ORDER BY nombre'
        )->fetchAll();
        $medicos = $conexion->query(
            "SELECT id_gestion_medico AS id, nombre, especialidad
             FROM gestion_medico WHERE estado <> 'Inactivo' ORDER BY nombre"
        )->fetchAll();

        turnos_responder(200, [
            'success' => true,
            'data' => $consulta->fetchAll(),
            'pacientes' => $pacientes,
            'medicos' => $medicos
        ]);
    } catch (Throwable $error) {
        error_log('[turnos_listar] ' . $error->getMessage());
        turnos_error(500, 'No se pudieron cargar los turnos.');
    }
}

// ---------- Guardar o borrar (hay que haber iniciado sesión) ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    turnos_error(405, 'Método no permitido.');
}

session_start();
if (empty($_SESSION['id_usuario'])) turnos_error(401, 'La sesión no está iniciada.');

$datos = json_decode(file_get_contents('php://input') ?: '', true);
$accion = (string) ($datos['accion'] ?? '');

try {
    if ($accion === 'borrar') {
        $borrar = $conexion->prepare('DELETE FROM turno WHERE id_turno = ?');
        $borrar->execute([(int) ($datos['id_turno'] ?? 0)]);
        if ($borrar->rowCount() === 0) turnos_error(404, 'No se encontró el turno.');
        turnos_responder(200, ['success' => true]);
    }

    if ($accion !== 'guardar' || !is_array($datos['turno'] ?? null)) turnos_error(422, 'Acción no válida.');

    $turno = $datos['turno'];
    $idTurno = (int) ($turno['id_turno'] ?? 0);
    $idPaciente = (int) ($turno['id_gestion_paciente'] ?? 0);
    $idMedico = (int) ($turno['id_gestion_medico'] ?? 0) ?: null;
    $fecha = (string) ($turno['fecha'] ?? '');
    $inicio = (string) ($turno['hora_inicio'] ?? '');
    $fin = (string) ($turno['hora_fin'] ?? '');
    $motivo = trim((string) ($turno['motivo'] ?? ''));
    $estado = (string) ($turno['estado'] ?? 'PROGRAMADO');
    $notas = trim((string) ($turno['notas'] ?? ''));

    if ($idPaciente < 1) turnos_error(422, 'Elegí un paciente.');
    if (!fecha_valida($fecha)) turnos_error(422, 'La fecha no es válida.');
    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $inicio) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $fin)) {
        turnos_error(422, 'Las horas no son válidas.');
    }
    if ($inicio >= $fin) turnos_error(422, 'La hora de fin tiene que ser después de la de inicio.');
    if ($motivo === '' || mb_strlen($motivo) > 200) turnos_error(422, 'El motivo es obligatorio (máximo 200 caracteres).');
    if (!in_array($estado, ESTADOS_TURNO, true)) turnos_error(422, 'Estado no válido.');
    if (mb_strlen($notas) > 500) turnos_error(422, 'Las notas pueden tener hasta 500 caracteres.');

    // Que ni el paciente ni el médico tengan otro turno que se superponga (los cancelados no cuentan)
    if ($estado !== 'CANCELADO') {
        $choque = $conexion->prepare(
            "SELECT TIME_FORMAT(hora_inicio, '%H:%i') AS inicio, TIME_FORMAT(hora_fin, '%H:%i') AS fin,
                    id_gestion_paciente = ? AS mismo_paciente
             FROM turno
             WHERE fecha = ? AND estado <> 'CANCELADO' AND id_turno <> ?
               AND hora_inicio < ? AND hora_fin > ?
               AND (id_gestion_paciente = ? OR (? IS NOT NULL AND id_gestion_medico = ?))
             LIMIT 1"
        );
        $choque->execute([$idPaciente, $fecha, $idTurno, $fin, $inicio, $idPaciente, $idMedico, $idMedico]);
        if ($otro = $choque->fetch()) {
            $quien = $otro['mismo_paciente'] ? 'El paciente' : 'El médico';
            turnos_error(409, "$quien ya tiene un turno de {$otro['inicio']} a {$otro['fin']} ese día.");
        }
    }

    $valores = [$idPaciente, $idMedico, $fecha, $inicio, $fin, $motivo, $estado, $notas !== '' ? $notas : null];

    if ($idTurno > 0) {
        $guardar = $conexion->prepare(
            'UPDATE turno SET id_gestion_paciente = ?, id_gestion_medico = ?, fecha = ?, hora_inicio = ?,
                    hora_fin = ?, motivo = ?, estado = ?, notas = ?
             WHERE id_turno = ?'
        );
        $guardar->execute([...$valores, $idTurno]);
    } else {
        $guardar = $conexion->prepare(
            'INSERT INTO turno (id_gestion_paciente, id_gestion_medico, fecha, hora_inicio, hora_fin, motivo, estado, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $guardar->execute($valores);
        $idTurno = (int) $conexion->lastInsertId();
    }

    turnos_responder(200, ['success' => true, 'id_turno' => $idTurno]);
} catch (Throwable $error) {
    error_log('[turnos_guardar] ' . $error->getMessage());
    // 1452 = el paciente o el médico elegido no existe
    $mensaje = ($error instanceof PDOException && ($error->errorInfo[1] ?? 0) === 1452)
        ? 'El paciente o el médico elegido no existe.'
        : 'No se pudo guardar el turno.';
    turnos_error(500, $mensaje);
}
