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
 * DB_HOST, DB_NAME, DB_USER, DB_PASS
 */

function db(): PDO
{
    static $conexion = null;

    if ($conexion instanceof PDO) {
        return $conexion;
    }

    $servidor = getenv('DB_HOST') ?: 'localhost';
    $baseDeDatos = getenv('DB_NAME') ?: 'altf4';
    $usuario = getenv('DB_USER') ?: 'root';
    $contrasena = getenv('DB_PASS') ?: '';

    $dsn = 'mysql:host=' . $servidor . ';dbname=' . $baseDeDatos . ';charset=utf8mb4';

    $conexion = new PDO(
        $dsn,
        $usuario,
        $contrasena,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    return $conexion;
}
