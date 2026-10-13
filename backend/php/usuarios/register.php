<?php

try {
    require '../../../connection.php';
    $conexion = db();
}

//datos del formulario
$usuario = trim($POST['usuario'] ?? '');
$contrasena = ($_POST['contrasena'] ?? '');
$email = trim($_POST['email'] ?? '');
$cedula = trim($_POST['CI'] ?? '');

//campos obligatorios
if (
    $usuario === '' ||
    $contrasena === '' ||
    $email === '' ||
    $cedula === '' ||
) {
    throw new Exception(
        'Todos los campos son obligatorios'
    );
}

//email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new Exception(
        'El email no es vàlido'
    );
}

//validar contraseña
if (!preg_match('/[A-Z]/', $contrasena)) {
    throw new Exception(
        'La contraseña debe contener al menos una mayusucula'
    );
}

if (!preg_match('/[a-z]/', $contrasena)) {
    throw new Exception(
        'La contraseña debe contener al menos una minuscula'
    );
}

if (!preg_match('/[^a-zA-Z0-9]/', $contrasena)) ̣{
    throw new Exception(
        'La contraseña debe contener al menos un simbolo especial'
    );
}

//comprobar q el ci no exista en la base de datos
$consultaCedula = $conexion->prepare(
    'SELECT id_persona
    FROM persona
    WHERE cedula = ?
    LIMIT 1'
);

$consultaCedula->bind_param('s', $cedula);
$consultaCedula->execute();

$resultadoCedula = $consultaCedula->get_result();
if ($resultadoCedula->num_rows > 0) {
    throw new Exception(
        'La cedula ya esta registrada'
    );
}

//comprobar que el mail no exista
$consultaEmail = $conexion->prepare(
    'SELECT id_persona
    FROM persona
    WHERE email = ?
    LIMIT 1'
);

$consultaEmail->bind_param('s', $email)
$consultaEmail->execute();

$resultadoEmail = $consultaEmail->get_result();

if ($resultadoEmail->num_rows > 0) {
    throw new Exception(
        'El email ya esta cargado'
    );
}

//comprobar que el usuario no exista
$consultaUsuario = $conexion->prepare(
    'SELECT id_usuario
    FROM usuario
    WHERE nombre_usuario
    LIMIT 1'
);

$consultaUsuario->bind_param('s' $usuario)
$consultaUsuario->execute();

$resultadoUsuario = $consultaUsuario->get_result();

if ($resultadoUsuario->num_rows > 0) {
    throw new Exception(
        'Ese nombre de usuario ya esta registrado'
    );
}

    $conexion->begin_transaction();

    try {

//crear persona
$insertarPersona = $conexion->prepare(
    'INSERT INTO persona
    (
    cedula,
    email
    )
    VALUES (?, ?)'
);

$insertarPersona->bind_param(
    'ss',
    $cedula
    $email
);

$insertarPersona->execute();
$idPersona = $conexion->insert_id;

//crear funcioonario
$insertarFuncionario = $conexion->prepare(
    'INSERT INTO funcionario
    (
    id_persona
    )
    VALUES (?)'
);

$insertarFuncionario->bind_param(
    'i',
    $idPersona
);

$insertarFuncionario->execute();

//crear usario
$passwordHash = password_hash(
    $contrasena,
    PASSWORD_DEFAULT
);

$estado = 'ACTIVO';
$insertarUsuario = $conexion->prepare(
    'INSERT INTO usuario
    (
    id_funcionario,
    nombre_usuario
    password_hash
    estado
    )
    VALUES (?, ?, ?, ?)'
);

$insertarUsuario->bind_param(
    'isss'
    $idPersona,
    $usuario,
    $passwordHash,
    $estado
);

$insertarUsuario->execute();
$idUsuario = $conexion->insert_id;

//confirma
$conexion->commit();

echo json_encode([
    'success' => true,
    'message' => 'Usuario registrado correctamente',
    'id_persona' => $idPersona,
    'id_usuario' =>
]);

    } catch (Throwable $error) {
//(si falla cualquier insert se deshace todo)

      $conexion->rollback();
      throw $error;
    }

    $conexion->close();

    } catch (Throwable $error) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => [
            'message' => $error->getMessage()
        ]
    ])
    }


