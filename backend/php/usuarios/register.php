<?php

header('Content-Type: application/json; charset=utf-8');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {

    //conexion a la base de datos
    $conexion = new mysqli(
        'localhost',
        'root',
        '',
        'altf4',
        3306
    );

    $conexion->set_charset('utf8mb4');

    //datos recibidos del formulario
    $usuario = trim($_POST['usuario'] ?? '');
    $contrasena = $_POST['contrasena'] ?? '';
    $email = trim($_POST['email'] ?? '');
    $cedula = trim($_POST['CI'] ?? '');

    // comprobar campos estèn ahi (cmpos obligatorios)
    if ($usuario === '' || $contrasena === '' || $email === '' || $cedula === '') {
        throw new Exception('Todos los campos son obligatorios.');
    }

    //validar usuario
    if (!preg_match('/^[a-zA-Z0-9._-]{6,50}$/', $usuario)) {
        throw new Exception(
            'El usuario debe tener entre 6 y 50 caracteres y solo puede contener letras, números, punto, guion o guion bajo.'
        );
    }

    //validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('El email no es válido.');
    }

    // Validar contraseña
    // Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo
    if (strlen($contrasena) < 8) {
        throw new Exception('La contraseña debe tener al menos 8 caracteres.');
    }

    if (!preg_match('/[A-Z]/', $contrasena)) {
        throw new Exception('La contraseña debe contener al menos una mayúscula.');
    }

    if (!preg_match('/[a-z]/', $contrasena)) {
        throw new Exception('La contraseña debe contener al menos una minúscula.');
    }

    if (!preg_match('/[0-9]/', $contrasena)) {
        throw new Exception('La contraseña debe contener al menos un número.');
    }

    if (!preg_match('/[^a-zA-Z0-9]/', $contrasena)) {
        throw new Exception('La contraseña debe contener al menos un símbolo especial.');
    }


    // Buscar al funcionario mediante cédula y email
    $consulta = $conexion->prepare(
        'SELECT
            p.id_persona,
            p.cedula,
            p.email,
            f.activo
         FROM persona p
         INNER JOIN funcionario f
            ON f.id_persona = p.id_persona
         WHERE p.cedula = ?
           AND p.email = ?
         LIMIT 1'
    );

    $consulta->bind_param('ss', $cedula, $email);
    $consulta->execute();

    $resultado = $consulta->get_result();

    if ($resultado->num_rows === 0) {
        throw new Exception(
            'No existe un funcionario registrado con esa cédula y email.'
        );
    }

    $funcionario = $resultado->fetch_assoc();

    $idFuncionario = $funcionario['id_persona'];


    // Comprobar que el funcionario esté activo
    if ((int)$funcionario['activo'] !== 1) {
        throw new Exception(
            'El funcionario no está activo y no puede crear un usuario.'
        );
    }


    // Comprobar que el nombre de usuario no exista
    $consultaUsuario = $conexion->prepare(
        'SELECT id_usuario
         FROM usuario
         WHERE nombre_usuario = ?
         LIMIT 1'
    );

    $consultaUsuario->bind_param('s', $usuario);
    $consultaUsuario->execute();

    $resultadoUsuario = $consultaUsuario->get_result();

    if ($resultadoUsuario->num_rows > 0) {
        throw new Exception(
            'Ese nombre de usuario ya está registrado.'
        );
    }


    // Comprobar que el funcionario no tenga ya una cuenta
    $consultaCuenta = $conexion->prepare(
        'SELECT id_usuario
         FROM usuario
         WHERE id_funcionario = ?
         LIMIT 1'
    );

    $consultaCuenta->bind_param('i', $idFuncionario);
    $consultaCuenta->execute();

    $resultadoCuenta = $consultaCuenta->get_result();

    if ($resultadoCuenta->num_rows > 0) {
        throw new Exception(
            'Este funcionario ya tiene una cuenta de usuario.'
        );
    }


    // Crear hash seguro de la contraseña
    $passwordHash = password_hash(
        $contrasena,
        PASSWORD_DEFAULT
    );


    // Crear usuario
    $insertar = $conexion->prepare(
        'INSERT INTO usuario
        (
            id_funcionario,
            nombre_usuario,
            password_hash,
            estado
        )
        VALUES
        (?, ?, ?, ?)'
    );

    $estado = 'ACTIVO';

    $insertar->bind_param(
        'isss',
        $idFuncionario,
        $usuario,
        $passwordHash,
        $estado
    );

    $insertar->execute();

    $idUsuario = $conexion->insert_id;


    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Usuario registrado correctamente.',
        'id_usuario' => $idUsuario
    ]);

    $conexion->close();

} catch (Throwable $error) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => [
            'message' => $error->getMessage()
        ]
    ]);
}