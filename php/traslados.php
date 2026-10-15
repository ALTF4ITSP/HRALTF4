<?php
declare(strict_types=1);

/*
 * Traslados de ambulancias (lista, nuevo traslado, detalle y mapa).
 *
 *   GET  traslados.php               → todos los traslados
 *   GET  traslados.php?id=3          → un traslado con los datos del paciente
 *   GET  traslados.php?opciones=1    → ambulancias, personal, destinos y pacientes para el formulario
 *   POST traslados.php {"accion": "guardar", "traslado": {...}}   (sin id = nuevo)
 *   POST traslados.php {"accion": "estado", "id": 3, "estado": "EN_CURSO"}
 */

require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

const TIPOS = ['PACIENTE', 'EQUIPO', 'BIOLOGICO'];
const PRIORIDADES = ['BAJA', 'NORMAL', 'ALTA', 'CRITICA'];
// A qué estados se puede pasar desde cada estado
const PASOS = [
    'ASIGNADO' => ['EN_CURSO', 'CANCELADO'],
    'EN_CURSO' => ['EN_DESTINO', 'FINALIZADO', 'CANCELADO'],
    'EN_DESTINO' => ['FINALIZADO', 'CANCELADO'],
    'FINALIZADO' => [],
    'CANCELADO' => []
];

function traslados_responder(int $status, array $cuerpo): never
{
    http_response_code($status);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    exit;
}

function traslados_error(int $status, string $mensaje): never
{
    traslados_responder($status, ['success' => false, 'error' => ['message' => $mensaje]]);
}

// Consulta con los nombres de todo lo relacionado (se usa en la lista y en el detalle)
const CONSULTA_TRASLADOS = "
    SELECT t.id_gestion_traslado AS id, t.tipo, t.motivo, t.prioridad, t.estado,
           DATE_FORMAT(t.fecha_salida, '%Y-%m-%dT%H:%i') AS fecha_salida,
           DATE_FORMAT(t.llegada_estimada, '%Y-%m-%dT%H:%i') AS llegada_estimada,
           DATE_FORMAT(t.fecha_fin, '%Y-%m-%dT%H:%i') AS fecha_fin,
           DATE_FORMAT(t.fecha_creacion, '%Y-%m-%dT%H:%i') AS fecha_creacion,
           t.opciones, t.notas,
           t.id_ambulancia, a.matricula, a.modelo,
           t.id_chofer, ch.nombre AS chofer,
           t.id_acompanante, ac.nombre AS acompanante,
           t.id_origen, o.nombre AS origen, o.latitud AS origen_lat, o.longitud AS origen_lng,
           t.id_destino, d.nombre AS destino, d.latitud AS destino_lat, d.longitud AS destino_lng,
           t.id_gestion_paciente, p.nombre AS paciente, p.edad AS paciente_edad, p.documento AS paciente_documento,
           p.diagnostico AS paciente_diagnostico, p.medico AS paciente_medico
    FROM gestion_traslado t
    INNER JOIN ambulancia a ON a.id_ambulancia = t.id_ambulancia
    INNER JOIN gestion_personal ch ON ch.id_gestion_personal = t.id_chofer
    LEFT JOIN gestion_personal ac ON ac.id_gestion_personal = t.id_acompanante
    INNER JOIN gestion_destino o ON o.id_gestion_destino = t.id_origen
    INNER JOIN gestion_destino d ON d.id_gestion_destino = t.id_destino
    LEFT JOIN gestion_paciente p ON p.id_gestion_paciente = t.id_gestion_paciente";

$conexion = db();

// ---------- Leer ----------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    try {
        if (isset($_GET['opciones'])) {
            traslados_responder(200, ['success' => true, 'data' => [
                'ambulancias' => $conexion->query(
                    'SELECT id_ambulancia AS id, matricula, modelo, estado_operativo FROM ambulancia ORDER BY matricula'
                )->fetchAll(),
                'personal' => $conexion->query(
                    "SELECT id_gestion_personal AS id, nombre, rol FROM gestion_personal WHERE estado = 'Activo' ORDER BY nombre"
                )->fetchAll(),
                'destinos' => $conexion->query(
                    "SELECT id_gestion_destino AS id, nombre, localidad FROM gestion_destino WHERE estado = 'Activo' ORDER BY nombre"
                )->fetchAll(),
                'pacientes' => $conexion->query(
                    'SELECT id_gestion_paciente AS id, nombre, documento FROM gestion_paciente ORDER BY nombre'
                )->fetchAll()
            ]]);
        }

        if (isset($_GET['id'])) {
            $consulta = $conexion->prepare(CONSULTA_TRASLADOS . ' WHERE t.id_gestion_traslado = ?');
            $consulta->execute([(int) $_GET['id']]);
            $traslado = $consulta->fetch();
            if (!$traslado) traslados_error(404, 'No se encontró el traslado.');
            traslados_responder(200, ['success' => true, 'data' => $traslado]);
        }

        $lista = $conexion->query(CONSULTA_TRASLADOS . ' ORDER BY t.fecha_salida DESC')->fetchAll();
        traslados_responder(200, ['success' => true, 'data' => $lista]);
    } catch (Throwable $error) {
        error_log('[traslados_leer] ' . $error->getMessage());
        traslados_error(500, 'No se pudieron cargar los traslados.');
    }
}

// ---------- Guardar (hay que haber iniciado sesión) ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    traslados_error(405, 'Método no permitido.');
}

session_start();
if (empty($_SESSION['id_usuario'])) traslados_error(401, 'La sesión no está iniciada.');

$datos = json_decode(file_get_contents('php://input') ?: '', true);
$accion = (string) ($datos['accion'] ?? '');

try {
    // Cambiar de estado
    if ($accion === 'estado') {
        $id = (int) ($datos['id'] ?? 0);
        $nuevo = (string) ($datos['estado'] ?? '');

        $buscar = $conexion->prepare('SELECT estado FROM gestion_traslado WHERE id_gestion_traslado = ?');
        $buscar->execute([$id]);
        $actual = $buscar->fetchColumn();
        if ($actual === false) traslados_error(404, 'No se encontró el traslado.');
        if (!in_array($nuevo, PASOS[$actual] ?? [], true)) traslados_error(422, 'Ese cambio de estado no está permitido.');

        // Al finalizar o cancelar se guarda la hora
        $actualizar = $conexion->prepare(
            "UPDATE gestion_traslado
             SET estado = ?, fecha_fin = IF(? IN ('FINALIZADO', 'CANCELADO'), NOW(), NULL)
             WHERE id_gestion_traslado = ?"
        );
        $actualizar->execute([$nuevo, $nuevo, $id]);
        traslados_responder(200, ['success' => true]);
    }

    if ($accion !== 'guardar' || !is_array($datos['traslado'] ?? null)) traslados_error(422, 'Acción no válida.');

    $t = $datos['traslado'];
    $id = (int) ($t['id'] ?? 0);
    $entero = fn(string $campo) => (int) ($t[$campo] ?? 0) ?: null;
    $texto = fn(string $campo) => trim((string) ($t[$campo] ?? ''));

    $valores = [
        'id_ambulancia' => $entero('id_ambulancia'),
        'id_chofer' => $entero('id_chofer'),
        'id_acompanante' => $entero('id_acompanante'),
        'id_origen' => $entero('id_origen'),
        'id_destino' => $entero('id_destino'),
        'id_gestion_paciente' => $entero('id_gestion_paciente'),
        'tipo' => $texto('tipo'),
        'motivo' => $texto('motivo'),
        'prioridad' => $texto('prioridad'),
        'fecha_salida' => $texto('fecha_salida'),
        'llegada_estimada' => $texto('llegada_estimada') ?: null,
        'opciones' => $texto('opciones') ?: null,
        'notas' => $texto('notas') ?: null
    ];

    if (!$valores['id_ambulancia']) traslados_error(422, 'Elegí una ambulancia.');
    if (!$valores['id_chofer']) traslados_error(422, 'Elegí un conductor.');
    if ($valores['id_acompanante'] === $valores['id_chofer']) traslados_error(422, 'El acompañante no puede ser el mismo conductor.');
    if (!$valores['id_origen'] || !$valores['id_destino']) traslados_error(422, 'Elegí el origen y el destino.');
    if ($valores['id_origen'] === $valores['id_destino']) traslados_error(422, 'El origen y el destino no pueden ser el mismo.');
    if (!in_array($valores['tipo'], TIPOS, true)) traslados_error(422, 'Elegí el tipo de traslado.');
    if ($valores['tipo'] === 'PACIENTE' && !$valores['id_gestion_paciente']) traslados_error(422, 'Elegí el paciente.');
    if ($valores['motivo'] === '' || mb_strlen($valores['motivo']) > 100) traslados_error(422, 'Elegí el motivo del traslado.');
    if (!in_array($valores['prioridad'], PRIORIDADES, true)) traslados_error(422, 'Elegí la prioridad.');
    if (!DateTime::createFromFormat('!Y-m-d\TH:i', $valores['fecha_salida'])) traslados_error(422, 'La fecha y hora de inicio no son válidas.');
    if ($valores['llegada_estimada'] !== null && $valores['llegada_estimada'] <= $valores['fecha_salida']) {
        traslados_error(422, 'La llegada estimada tiene que ser después de la salida.');
    }
    if (mb_strlen((string) $valores['notas']) > 500) traslados_error(422, 'Las notas pueden tener hasta 500 caracteres.');

    // La misma ambulancia no puede tener dos traslados activos
    $ocupada = $conexion->prepare(
        "SELECT id_gestion_traslado FROM gestion_traslado
         WHERE id_ambulancia = ? AND id_gestion_traslado <> ? AND estado IN ('ASIGNADO', 'EN_CURSO', 'EN_DESTINO')
         LIMIT 1"
    );
    $ocupada->execute([$valores['id_ambulancia'], $id]);
    if ($otro = $ocupada->fetchColumn()) traslados_error(409, "Esa ambulancia ya está en el traslado $otro, que sigue activo.");

    $columnas = array_keys($valores);
    if ($id > 0) {
        $buscar = $conexion->prepare('SELECT estado FROM gestion_traslado WHERE id_gestion_traslado = ?');
        $buscar->execute([$id]);
        $estado = $buscar->fetchColumn();
        if ($estado === false) traslados_error(404, 'No se encontró el traslado.');
        if (in_array($estado, ['FINALIZADO', 'CANCELADO'], true)) traslados_error(409, 'Un traslado finalizado o cancelado no se puede editar.');

        $set = implode(', ', array_map(fn($c) => "$c = ?", $columnas));
        $conexion->prepare("UPDATE gestion_traslado SET $set WHERE id_gestion_traslado = ?")
            ->execute([...array_values($valores), $id]);
    } else {
        $marcas = implode(', ', array_fill(0, count($columnas), '?'));
        $conexion->prepare('INSERT INTO gestion_traslado (' . implode(', ', $columnas) . ") VALUES ($marcas)")
            ->execute(array_values($valores));
        $id = (int) $conexion->lastInsertId();
    }

    traslados_responder(200, ['success' => true, 'id' => $id]);
} catch (Throwable $error) {
    error_log('[traslados_guardar] ' . $error->getMessage());
    $mensaje = ($error instanceof PDOException && ($error->errorInfo[1] ?? 0) === 1452)
        ? 'Alguno de los datos elegidos ya no existe. Recargá la página.'
        : 'No se pudo guardar el traslado.';
    traslados_error(500, $mensaje);
}
