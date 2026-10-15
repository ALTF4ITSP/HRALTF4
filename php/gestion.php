<?php
declare(strict_types=1);

/*
 * Guarda y carga las listas de las pantallas de Gestión.
 *
 *   GET  gestion.php?modulo=pacientes          → devuelve la lista
 *   POST gestion.php  {"modulo": "...", "lista": [...]}
 *        → guarda la lista completa: actualiza lo que existe, agrega lo nuevo
 *          y borra lo que ya no está.
 *
 * Para cada módulo se indica su tabla y qué columna corresponde a cada dato del JS.
 * Un dato con punto ("emergencyContact.name") es un objeto dentro de otro.
 */

require_once __DIR__ . '/connection.php';
header('Content-Type: application/json; charset=utf-8');

const MODULOS = [
    'pacientes' => [
        'tabla' => 'gestion_paciente',
        'campos' => [
            'id' => 'codigo',
            'name' => 'nombre',
            'age' => 'edad',
            'dni' => 'documento',
            'phone' => 'telefono',
            'status' => 'estado',
            'room' => 'habitacion',
            'department' => 'servicio',
            'doctor' => 'medico',
            'doctorSpecialty' => 'especialidad_medico',
            'admissionDate' => 'fecha_ingreso',
            'bloodType' => 'grupo_sanguineo',
            'allergies' => 'alergias',
            'diagnosis' => 'diagnostico',
            'clinicalState' => 'estado_clinico',
            'emergencyContact.name' => 'contacto_nombre',
            'emergencyContact.phone' => 'contacto_telefono',
            'emergencyContact.relationship' => 'contacto_parentesco'
        ],
        'numeros' => ['age']
    ],
    'medicos' => [
        'tabla' => 'gestion_medico',
        'campos' => [
            'id' => 'codigo',
            'title' => 'titulo',
            'name' => 'nombre',
            'document' => 'documento',
            'license' => 'registro_msp',
            'specialty' => 'especialidad',
            'service' => 'servicio',
            'office' => 'consultorio',
            'phone' => 'telefono',
            'email' => 'email',
            'status' => 'estado',
            'shift' => 'turno',
            'days' => 'dias',
            'startTime' => 'hora_inicio',
            'endTime' => 'hora_fin',
            'notes' => 'observaciones'
        ]
    ],
    'personal' => [
        'tabla' => 'gestion_personal',
        'campos' => [
            'id' => 'codigo',
            'name' => 'nombre',
            'role' => 'rol',
            'phone' => 'telefono',
            'document' => 'documento',
            'license' => 'licencia',
            'status' => 'estado'
        ]
    ],
    'destinos' => [
        'tabla' => 'gestion_destino',
        'campos' => [
            'id' => 'codigo',
            'name' => 'nombre',
            'address' => 'direccion',
            'locality' => 'localidad',
            'type' => 'tipo',
            'phone' => 'telefono',
            'notes' => 'referencia',
            'status' => 'estado',
            'lat' => 'latitud',
            'lng' => 'longitud'
        ],
        'numeros' => ['lat', 'lng']
    ],
    'rutas' => [
        'tabla' => 'gestion_ruta',
        'campos' => [
            'id' => 'codigo',
            'code' => 'numero',
            'name' => 'nombre',
            'category' => 'categoria',
            'direction' => 'sentido',
            'status' => 'estado',
            'origin.name' => 'origen_nombre',
            'origin.address' => 'origen_direccion',
            'destination.name' => 'destino_nombre',
            'destination.address' => 'destino_direccion',
            'stops' => 'paradas',
            'distance' => 'distancia_km',
            'duration' => 'duracion_min',
            'notes' => 'notas'
        ],
        'numeros' => ['distance', 'duration'],
        'listas' => ['stops']
    ],
    'ambulancias' => [
        'tabla' => 'ambulancia',
        'campos' => [
            'id' => 'id_ambulancia',
            'plate' => 'matricula',
            'model' => 'modelo',
            'capacity' => 'capacidad',
            'status' => 'estado_operativo'
        ],
        'numeros' => ['id', 'capacity']
    ]
];

function gestion_responder(int $status, array $cuerpo): never
{
    http_response_code($status);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    exit;
}

function gestion_error(int $status, string $mensaje): never
{
    gestion_responder($status, ['success' => false, 'error' => ['message' => $mensaje]]);
}

// Fila de la base → objeto del JS
function gestion_a_objeto(array $fila, array $modulo): array
{
    $objeto = [];

    foreach ($modulo['campos'] as $dato => $columna) {
        $valor = $fila[$columna];

        if (in_array($dato, $modulo['numeros'] ?? [], true) && $valor !== null) {
            $valor = $valor + 0;
        } elseif (in_array($dato, $modulo['listas'] ?? [], true)) {
            $valor = json_decode((string) $valor, true) ?: [];
        } elseif ($valor === null) {
            $valor = '';
        }

        // "emergencyContact.name" → $objeto['emergencyContact']['name']
        $partes = explode('.', $dato);
        if (count($partes) === 2) {
            $objeto[$partes[0]][$partes[1]] = $valor;
        } else {
            $objeto[$dato] = $valor;
        }
    }

    return $objeto;
}

// Objeto del JS → valores para las columnas
function gestion_a_fila(array $objeto, array $modulo): array
{
    $fila = [];

    foreach ($modulo['campos'] as $dato => $columna) {
        $partes = explode('.', $dato);
        $valor = count($partes) === 2
            ? ($objeto[$partes[0]][$partes[1]] ?? null)
            : ($objeto[$dato] ?? null);

        if (in_array($dato, $modulo['listas'] ?? [], true)) {
            $valor = json_encode(is_array($valor) ? $valor : [], JSON_UNESCAPED_UNICODE);
        } elseif (in_array($dato, $modulo['numeros'] ?? [], true) && !is_numeric($valor)) {
            $valor = null;
        } elseif (is_array($valor) || is_bool($valor)) {
            $valor = null;
        }

        $fila[$columna] = $valor;
    }

    return $fila;
}

$conexion = db();

// ---------- Leer ----------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $nombre = (string) ($_GET['modulo'] ?? '');
    if (!isset(MODULOS[$nombre])) gestion_error(422, 'Módulo no válido.');

    $modulo = MODULOS[$nombre];
    $clave = $modulo['campos']['id'];

    try {
        $filas = $conexion->query("SELECT * FROM `{$modulo['tabla']}` ORDER BY `$clave`")->fetchAll();
        $lista = array_map(fn(array $fila) => gestion_a_objeto($fila, $modulo), $filas);
        gestion_responder(200, ['success' => true, 'data' => $lista]);
    } catch (Throwable $error) {
        error_log('[gestion_listar] ' . $error->getMessage());
        gestion_error(500, 'No se pudieron cargar los datos.');
    }
}

// ---------- Guardar (hay que haber iniciado sesión) ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    gestion_error(405, 'Método no permitido.');
}

session_start();
if (empty($_SESSION['id_usuario'])) gestion_error(401, 'La sesión no está iniciada.');

$datos = json_decode(file_get_contents('php://input') ?: '', true);
$nombre = (string) ($datos['modulo'] ?? '');
$lista = $datos['lista'] ?? null;

if (!isset(MODULOS[$nombre])) gestion_error(422, 'Módulo no válido.');
if (!is_array($lista)) gestion_error(422, 'La lista no es válida.');

$modulo = MODULOS[$nombre];
$tabla = $modulo['tabla'];
$columnas = array_values($modulo['campos']);
$clave = $modulo['campos']['id'];

// INSERT ... ON DUPLICATE KEY UPDATE: agrega la fila o la actualiza si ya existe
$listaColumnas = implode(', ', array_map(fn($c) => "`$c`", $columnas));
$marcas = implode(', ', array_fill(0, count($columnas), '?'));
$actualizar = implode(', ', array_map(fn($c) => "`$c` = VALUES(`$c`)", $columnas));
$guardar = $conexion->prepare(
    "INSERT INTO `$tabla` ($listaColumnas) VALUES ($marcas) ON DUPLICATE KEY UPDATE $actualizar"
);

try {
    $conexion->beginTransaction();

    $claves = [];
    foreach ($lista as $objeto) {
        if (!is_array($objeto) || ($objeto['id'] ?? '') === '') {
            throw new InvalidArgumentException('Hay un elemento sin id.');
        }
        $fila = gestion_a_fila($objeto, $modulo);
        $guardar->execute(array_values($fila));
        $claves[] = $fila[$clave];
    }

    // Borrar lo que ya no está en la lista
    if ($claves) {
        $marcasClaves = implode(', ', array_fill(0, count($claves), '?'));
        $conexion->prepare("DELETE FROM `$tabla` WHERE `$clave` NOT IN ($marcasClaves)")->execute($claves);
    } else {
        $conexion->exec("DELETE FROM `$tabla`");
    }

    $conexion->commit();
    gestion_responder(200, ['success' => true]);
} catch (Throwable $error) {
    if ($conexion->inTransaction()) $conexion->rollBack();
    error_log('[gestion_guardar] ' . $error->getMessage());

    // 1451 = otra tabla usa esa fila (por ejemplo, una ambulancia con traslados)
    $mensaje = ($error instanceof PDOException && ($error->errorInfo[1] ?? 0) === 1451)
        ? 'No se puede borrar: está en uso en otra parte del sistema.'
        : 'No se pudieron guardar los cambios.';
    gestion_error($error instanceof InvalidArgumentException ? 422 : 500, $mensaje);
}
