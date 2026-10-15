<?php

require_once dirname(__DIR__) . '/connection.php';

header('Content-Type: application/json; charset=utf-8');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {

    //conexion a la base de datos
    $conexion = db_mysqli();

    //datos recibidos del formulario
    $nombre = trim($_POST['nombre'] ?? '');
    $apellido = trim($_POST['apellido'] ?? '');
    $fechaNacimiento = trim($_POST['fecha_nacimiento'] ?? '');
    $usuario = trim($_POST['usuario'] ?? '');
    $contrasena = $_POST['contrasena'] ?? '';
    $email = trim($_POST['email'] ?? '');
    $cedula = trim($_POST['CI'] ?? '');

    // comprobar campos obligatorios
    if (
        $nombre === '' || $apellido === '' || $fechaNacimiento === '' ||
        $usuario === '' || $contrasena === '' || $email === '' || $cedula === ''
    ) {
        throw new Exception('Todos los campos son obligatorios.');
    }

    //validar nombre y apellido
    if (mb_strlen($nombre) > 100 || mb_strlen($apellido) > 100) {
        throw new Exception('El nombre y el apellido pueden tener hasta 100 caracteres.');
    }

    //validar fecha de nacimiento (formato AAAA-MM-DD y no puede ser futura)
    $fecha = DateTime::createFromFormat('!Y-m-d', $fechaNacimiento);
    if (!$fecha || $fecha->format('Y-m-d') !== $fechaNacimiento || $fecha > new DateTime('today')) {
        throw new Exception('La fecha de nacimiento no es válida.');
    }

    //validar cedula (solo números, sin puntos ni guion)
    if (!preg_match('/^[0-9]{7,8}$/', $cedula)) {
        throw new Exception('La cédula debe tener 7 u 8 números, sin puntos ni guion.');
    }

    //validar usuario
    if (!preg_match('/^[a-zA-Z0-9._-]{6,50}$/', $usuario)) {
        throw new Exception(
            'El usuario debe tener entre 6 y 50 caracteres y solo puede contener letras, números, punto, guion o guion bajo.'
        );
    }

    //validar email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
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


    // Comprobar que el nombre de usuario no exista
    $consultaUsuario = $conexion->prepare(
        'SELECT id_usuario
         FROM usuario
         WHERE nombre_usuario = ?
         LIMIT 1'
    );

    $consultaUsuario->bind_param('s', $usuario);
    $consultaUsuario->execute();

    if ($consultaUsuario->get_result()->num_rows > 0) {
        throw new Exception('Ese nombre de usuario ya está registrado.');
    }


    // Comprobar que el email no lo use otra persona
    $consultaEmail = $conexion->prepare(
        'SELECT id_persona
         FROM persona
         WHERE email = ? AND cedula <> ?
         LIMIT 1'
    );

    $consultaEmail->bind_param('ss', $email, $cedula);
    $consultaEmail->execute();

    if ($consultaEmail->get_result()->num_rows > 0) {
        throw new Exception('Ese email ya está registrado.');
    }


    // Buscar si la persona ya existe (por ejemplo, un funcionario cargado desde Gestión)
    $consultaPersona = $conexion->prepare(
        'SELECT
            p.id_persona,
            p.email,
            f.id_persona AS id_funcionario,
            f.activo,
            u.id_usuario
         FROM persona p
         LEFT JOIN funcionario f ON f.id_persona = p.id_persona
         LEFT JOIN usuario u ON u.id_funcionario = f.id_persona
         WHERE p.cedula = ?
         LIMIT 1'
    );

    $consultaPersona->bind_param('s', $cedula);
    $consultaPersona->execute();

    $persona = $consultaPersona->get_result()->fetch_assoc();

    if ($persona) {
        if ($persona['id_usuario'] !== null) {
            throw new Exception('Esta cédula ya tiene una cuenta de usuario.');
        }

        // Si la persona ya existía, el email tiene que coincidir con el registrado
        if ($persona['email'] !== null && strcasecmp($persona['email'], $email) !== 0) {
            throw new Exception('La cédula ya está registrada con otro email.');
        }

        if ($persona['id_funcionario'] !== null && (int)$persona['activo'] !== 1) {
            throw new Exception('El funcionario no está activo y no puede crear un usuario.');
        }
    }


    // Si falla cualquier insert se deshace todo
    $conexion->begin_transaction();

    try {

        // 1. Persona (solo si no existía)
        if ($persona) {
            $idPersona = (int)$persona['id_persona'];

            $actualizarPersona = $conexion->prepare(
                'UPDATE persona SET email = ? WHERE id_persona = ? AND email IS NULL'
            );
            $actualizarPersona->bind_param('si', $email, $idPersona);
            $actualizarPersona->execute();
        } else {
            $insertarPersona = $conexion->prepare(
                'INSERT INTO persona (cedula, nombre, apellido, fecha_nacimiento, email)
                 VALUES (?, ?, ?, ?, ?)'
            );
            $insertarPersona->bind_param('sssss', $cedula, $nombre, $apellido, $fechaNacimiento, $email);
            $insertarPersona->execute();

            $idPersona = (int)$conexion->insert_id;
        }


        // 2. Funcionario (solo si no existía). Cargo y sector se completan después desde Gestión
        if (!$persona || $persona['id_funcionario'] === null) {
            $sinAsignar = 'Sin asignar';

            $insertarFuncionario = $conexion->prepare(
                'INSERT INTO funcionario (id_persona, cargo, sector, activo)
                 VALUES (?, ?, ?, 1)'
            );
            $insertarFuncionario->bind_param('iss', $idPersona, $sinAsignar, $sinAsignar);
            $insertarFuncionario->execute();
        }


        // 3. Usuario
        $passwordHash = password_hash($contrasena, PASSWORD_DEFAULT);
        $estado = 'ACTIVO';

        $insertarUsuario = $conexion->prepare(
            'INSERT INTO usuario (id_funcionario, nombre_usuario, password_hash, estado)
             VALUES (?, ?, ?, ?)'
        );
        $insertarUsuario->bind_param('isss', $idPersona, $usuario, $passwordHash, $estado);
        $insertarUsuario->execute();

        $idUsuario = (int)$conexion->insert_id;

        $conexion->commit();

    } catch (Throwable $error) {
        $conexion->rollback();
        throw $error;
    }


    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Usuario registrado correctamente.',
        'id_usuario' => $idUsuario
    ]);

    $conexion->close();

} catch (mysqli_sql_exception $error) {

    // Errores de la base: no se muestra el detalle técnico al usuario
    error_log('[register] ' . $error->getMessage());
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => [
            'message' => 'No se pudo registrar el usuario. Intentá de nuevo.'
        ]
    ]);

} catch (Throwable $error) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => [
            'message' => $error->getMessage()
        ]
    ]);
}
