<?php
declare(strict_types=1);

/*
 * Conexión central a la base de datos altf4.
 * En XAMPP se utilizan por defecto:
 * servidor: localhost
 * usuario: root
 * contraseña: vacía
 * base de datos: altf4
 *
 * En el servidor institucional se pueden definir estas variables
 * como variables de entorno sin cambiar el código:
 * DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
 */

function db_config(): array
{
    $puerto = filter_var(
        getenv('DB_PORT') ?: 3306,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 65535]]
    );

    return [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'name' => getenv('DB_NAME') ?: 'altf4',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') ?: '',
        'port' => $puerto !== false ? $puerto : 3306
    ];
}

function db(): PDO
{
    static $conexion = null;

    if ($conexion instanceof PDO) {
        return $conexion;
    }

    $configuracion = db_config();

    $dsn = 'mysql:host=' . $configuracion['host']
        . ';port=' . $configuracion['port']
        . ';dbname=' . $configuracion['name']
        . ';charset=utf8mb4';

    $conexion = new PDO(
        $dsn,
        $configuracion['user'],
        $configuracion['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    return $conexion;
}

function db_mysqli(): mysqli
{
    $configuracion = db_config();

    $conexion = new mysqli(
        $configuracion['host'],
        $configuracion['user'],
        $configuracion['pass'],
        $configuracion['name'],
        $configuracion['port']
    );
    $conexion->set_charset('utf8mb4');

    return $conexion;
}
