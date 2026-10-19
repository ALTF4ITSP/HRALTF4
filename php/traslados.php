<?php
declare(strict_types=1);

/*
 * Traslados de ambulancias (página trace.html).
 *
 *   GET  traslados.php                                   → traslados + listas para el formulario
 *   POST traslados.php {"accion": "nuevo", "traslado": {...}}
 *        Lo que lleva (Paciente, Elemento biológico u Otro) se guarda en carga_transportada.
 *        El destino es id_destino (uno de Gestión → Destinos) o una dirección escrita a mano
 *        (destino_direccion + destino_lat + destino_lng), por ejemplo la casa de un paciente.
 *   POST traslados.php {"accion": "avanzar", "id": 3}    → pasa al siguiente estado y guarda la hora
 *   POST traslados.php {"accion": "cancelar", "id": 3}
 */

require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

const TIPOS_CARGA = ['Paciente', 'Elemento biológico', 'Otro'];

// Orden de los estados y qué hora se guarda al llegar a cada uno
const SIGUIENTE = [
    'PROGRAMADO' => 'EN_CAMINO',
    'EN_CAMINO' => 'EN_DESTINO',
    'EN_DESTINO' => 'RETORNANDO',
    'RETORNANDO' => 'FINALIZADO'
];
const HORA_DEL_ESTADO = [
    'EN_CAMINO' => 'salida_real',
    'EN_DESTINO' => 'llegada_real',
    'FINALIZADO' => 'retorno_real'
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

$conexion = db();

// ---------- Leer ----------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    try {
        $traslados = $conexion->query(
            "SELECT t.id_gestion_traslado AS id, t.estado, t.notas,
                    c.tipo AS tipo_carga, c.descripcion AS carga,
                    DATE_FORMAT(t.salida_programada, '%Y-%m-%d %H:%i') AS salida_programada,
                    DATE_FORMAT(t.llegada_estimada, '%Y-%m-%d %H:%i') AS llegada_estimada,
                    DATE_FORMAT(t.salida_real, '%Y-%m-%d %H:%i') AS salida_real,
                    DATE_FORMAT(t.llegada_real, '%Y-%m-%d %H:%i') AS llegada_real,
                    DATE_FORMAT(t.retorno_real, '%Y-%m-%d %H:%i') AS retorno_real,
                    a.matricula, ch.nombre AS chofer, ac.nombre AS acompanante, p.nombre AS paciente,
                    o.nombre AS origen, o.latitud AS origen_lat, o.longitud AS origen_lng,
                    COALESCE(d.nombre, t.destino_direccion) AS destino,
                    COALESCE(d.latitud, t.destino_lat) AS destino_lat,
                    COALESCE(d.longitud, t.destino_lng) AS destino_lng
             FROM gestion_traslado t
             INNER JOIN ambulancia a ON a.id_ambulancia = t.id_ambulancia
             INNER JOIN gestion_personal ch ON ch.id_gestion_personal = t.id_chofer
             LEFT JOIN gestion_personal ac ON ac.id_gestion_personal = t.id_acompanante
             LEFT JOIN gestion_paciente p ON p.id_gestion_paciente = t.id_gestion_paciente
             LEFT JOIN carga_transportada c ON c.id_gestion_traslado = t.id_gestion_traslado
             INNER JOIN gestion_destino o ON o.id_gestion_destino = t.id_origen
             LEFT JOIN gestion_destino d ON d.id_gestion_destino = t.id_destino   -- vacío si es una dirección
             ORDER BY t.salida_programada DESC"
        )->fetchAll();

        traslados_responder(200, [
            'success' => true,
            'traslados' => $traslados,
            'ambulancias' => $conexion->query(
                "SELECT id_ambulancia AS id, matricula, modelo FROM ambulancia
                 WHERE estado_operativo = 'OPERATIVA' ORDER BY matricula"
            )->fetchAll(),
            'personal' => $conexion->query(
                "SELECT id_gestion_personal AS id, nombre, rol FROM gestion_personal
                 WHERE estado = 'Activo' ORDER BY nombre"
            )->fetchAll(),
            'destinos' => $conexion->query(
                "SELECT id_gestion_destino AS id, codigo, nombre, localidad, latitud AS lat, longitud AS lng
                 FROM gestion_destino WHERE estado = 'Activo' ORDER BY nombre"
            )->fetchAll(),
            'pacientes' => $conexion->query(
                'SELECT id_gestion_paciente AS id, nombre, documento FROM gestion_paciente ORDER BY nombre'
            )->fetchAll(),
            'rutas' => $conexion->query(
                "SELECT numero, nombre, origen, destino, duracion_min FROM gestion_ruta
                 WHERE estado = 'Activa' ORDER BY numero"
            )->fetchAll()
        ]);
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
    // Avanzar o cancelar un traslado que ya existe
    if ($accion === 'avanzar' || $accion === 'cancelar') {
        $id = (int) ($datos['id'] ?? 0);
        $buscar = $conexion->prepare('SELECT estado FROM gestion_traslado WHERE id_gestion_traslado = ?');
        $buscar->execute([$id]);
        $actual = $buscar->fetchColumn();
        if ($actual === false) traslados_error(404, 'No se encontró el traslado.');
        if (!isset(SIGUIENTE[$actual])) traslados_error(409, 'Este traslado ya terminó.');

        $nuevo = $accion === 'cancelar' ? 'CANCELADO' : SIGUIENTE[$actual];
        $hora = HORA_DEL_ESTADO[$nuevo] ?? null;
        $sql = $hora
            ? "UPDATE gestion_traslado SET estado = ?, $hora = NOW() WHERE id_gestion_traslado = ?"
            : 'UPDATE gestion_traslado SET estado = ? WHERE id_gestion_traslado = ?';
        $conexion->prepare($sql)->execute([$nuevo, $id]);
        traslados_responder(200, ['success' => true, 'estado' => $nuevo]);
    }

    if ($accion !== 'nuevo' || !is_array($datos['traslado'] ?? null)) traslados_error(422, 'Acción no válida.');

    // Nuevo traslado
    $t = $datos['traslado'];
    $numero = fn(string $campo) => (int) ($t[$campo] ?? 0) ?: null;   // 0 o vacío = null
    $texto = fn(string $campo) => trim((string) ($t[$campo] ?? '')) ?: null;

    $ambulancia = $numero('id_ambulancia');
    $chofer = $numero('id_chofer');
    $acompanante = $numero('id_acompanante');
    $tipoCarga = (string) $texto('tipo_carga');
    $paciente = $tipoCarga === 'Paciente' ? $numero('id_gestion_paciente') : null;
    $carga = $tipoCarga === 'Paciente' ? null : $texto('carga');   // qué se lleva si no es un paciente
    $origen = $numero('id_origen');
    $destino = $numero('id_destino');
    $direccion = $destino ? null : $texto('destino_direccion');
    $latitud = $destino ? null : (float) ($t['destino_lat'] ?? 0);
    $longitud = $destino ? null : (float) ($t['destino_lng'] ?? 0);
    $salida = str_replace('T', ' ', (string) $texto('salida_programada'));
    $llegada = $texto('llegada_estimada') ? str_replace('T', ' ', $texto('llegada_estimada')) : null;
    $notas = $texto('notas');

    if (!$ambulancia) traslados_error(422, 'Elegí una ambulancia.');
    if (!$chofer) traslados_error(422, 'Elegí el conductor.');
    if ($acompanante === $chofer) traslados_error(422, 'El acompañante no puede ser el mismo conductor.');
    if (!in_array($tipoCarga, TIPOS_CARGA, true)) traslados_error(422, 'Elegí qué lleva la ambulancia.');
    if ($tipoCarga === 'Paciente' && !$paciente) traslados_error(422, 'Elegí el paciente.');
    if ($tipoCarga !== 'Paciente' && !$carga) traslados_error(422, 'Escribí qué se traslada.');
    if (!$origen) traslados_error(422, 'Elegí el origen.');
    if (!$destino && !$direccion) traslados_error(422, 'Elegí el destino o escribí la dirección.');
    // La dirección tiene que estar marcada en el mapa, dentro de Uruguay (aproximadamente)
    if ($direccion && ($latitud < -35.1 || $latitud > -30 || $longitud < -58.6 || $longitud > -53)) {
        traslados_error(422, 'Buscá la dirección o marcala en el mapa (tiene que estar en Uruguay).');
    }
    if ($origen === $destino) traslados_error(422, 'El origen y el destino no pueden ser el mismo.');
    if (!DateTime::createFromFormat('!Y-m-d H:i', $salida)) traslados_error(422, 'La hora de salida no es válida.');
    if ($llegada !== null && $llegada <= $salida) traslados_error(422, 'La llegada estimada tiene que ser después de la salida.');
    if (mb_strlen((string) $direccion) > 200 || mb_strlen((string) $carga) > 150 || mb_strlen((string) $notas) > 300) traslados_error(422, 'El texto es demasiado largo.');

    // La ambulancia no puede estar en otro traslado sin terminar
    $ocupada = $conexion->prepare(
        "SELECT id_gestion_traslado FROM gestion_traslado
         WHERE id_ambulancia = ? AND estado NOT IN ('FINALIZADO', 'CANCELADO') LIMIT 1"
    );
    $ocupada->execute([$ambulancia]);
    if ($otro = $ocupada->fetchColumn()) traslados_error(409, "Esa ambulancia ya está en el traslado #$otro, que no terminó.");

    // El traslado y su carga se guardan juntos: si falla uno, no se guarda ninguno
    $conexion->beginTransaction();
    $conexion->prepare(
        'INSERT INTO gestion_traslado (id_ambulancia, id_chofer, id_acompanante, id_gestion_paciente,
                                       id_origen, id_destino, destino_direccion, destino_lat, destino_lng,
                                       salida_programada, llegada_estimada, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([$ambulancia, $chofer, $acompanante, $paciente, $origen, $destino, $direccion, $latitud, $longitud,
                $salida, $llegada, $notas]);
    $id = (int) $conexion->lastInsertId();
    $conexion->prepare('INSERT INTO carga_transportada (id_gestion_traslado, tipo, descripcion) VALUES (?, ?, ?)')
        ->execute([$id, $tipoCarga, $carga]);
    $conexion->commit();

    traslados_responder(200, ['success' => true, 'id' => $id]);
} catch (Throwable $error) {
    if ($conexion->inTransaction()) $conexion->rollBack();
    error_log('[traslados_guardar] ' . $error->getMessage());
    $mensaje = ($error instanceof PDOException && ($error->errorInfo[1] ?? 0) === 1452)
        ? 'Alguno de los datos elegidos ya no existe. Recargá la página.'
        : 'No se pudo guardar el traslado.';
    traslados_error(500, $mensaje);
}
