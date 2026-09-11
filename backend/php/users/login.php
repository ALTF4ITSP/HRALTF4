<?php

header('Content-Type: application/json; charset=utf-8');
session_start();

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
     //conexion a la base de datos
    $conexion = new mysqli('localhost', 'root', '', 'altf4', 3306);
    $conexion->set_charset('utf8mb4');

    $usuario = trim($_POST['usuario'] ?? '');
    $contrasena = $_POST['contrasena'] ?? '';

    if ($usuario === '' || $contrasena === '') {
        throw new Exception('Usuario y contraseña son obligatorios.');
    }

    //busca el usuario
    $consulta = $conexion->prepare(
        'SELECT id_usuario, id_funcionario, nombre_usuario, password_hash, estado
         FROM usuario
         WHERE nombre_usuario = ?
         LIMIT 1'
    );

    $consulta->bind_param('s', $usuario);
    $consulta->execute();

    $resultado = $consulta->get_result();

    if ($resultado->num_rows === 0) {
        // mensaje generico a proposito  que no revela si el usuario existe o no
        throw new Exception('Usuario o contraseña incorrectos.');
    }

    $filaUsuario = $resultado->fetch_assoc();

    //verifica la contraseña
    if (!password_verify($contrasena, $filaUsuario['password_hash'])) {
        throw new Exception('Usuario o contraseña incorrectos.');
    }

    //verifica que la cuenta este activa
    if ($filaUsuario['estado'] !== 'ACTIVO') {
        throw new Exception('Esta cuenta no está activa.');
    }

    //actualiza el ultimo acceso
    $actualizar = $conexion->prepare(
        'UPDATE usuario SET ultimo_acceso = NOW() WHERE id_usuario = ?'
    );
    $actualizar->bind_param('i', $filaUsuario['id_usuario']);
    $actualizar->execute();
    $actualizar->close();

    //guarda datos en la sesion
    $_SESSION['id_usuario'] = $filaUsuario['id_usuario'];
    $_SESSION['id_funcionario'] = $filaUsuario['id_funcionario'];
    $_SESSION['nombre_usuario'] = $filaUsuario['nombre_usuario'];

    echo json_encode([
        'success' => true,
        'message' => 'Inicio de sesión correcto.'
    ]);

    $conexion->close();

} catch (Throwable $error) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => ['message' => $error->getMessage()]
    ]);
}