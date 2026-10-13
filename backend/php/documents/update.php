<?php

header('Content-Type: application/json; charset=utf-8');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {

    //a diferencia del alta, se necesita saber cual documento tocar
    $idDocumento = $_POST['id_documento'] ?? '';
    if (!preg_match('/^[1-9]\d*$/', $idDocumento)) {
        throw new Exception('ID de documento inválido.');
    }

    $nombre = trim($_POST['nombre'] ?? '');
    $paciente = trim($_POST['paciente'] ?? '');
    $fecha = $_POST['fecha'] ?? '';
    $categoria = $_POST['categoria'] ?? '';
    $descripcion = trim($_POST['descripcion'] ?? '');

    if ($nombre === '' || $paciente === '' || $fecha === '' || $categoria === '') {
        throw new Exception('Todos los campos obligatorios deben completarse.');
    }

    //mismo mapeo categoria, nombre real que en el alta
    $tipos = [
        'informe' => 'Informe medico',
        'estudio' => 'Resultado de estudio',
        'administrativo' => 'Documento Administrativo'
    ];

    if (!isset($tipos[$categoria])) {
        throw new Exception('Categoría no válida.');
    }

    $consultaTipo = $conexion->prepare(
        'SELECT id_tipo_documento FROM tipo_documento WHERE nombre = ? LIMIT 1'
    );
    $nombreTipo = $tipos[$categoria];
    $consultaTipo->bind_param('s', $nombreTipo);
    $consultaTipo->execute();
    $filaTipo = $consultaTipo->get_result()->fetch_assoc();

    if (!$filaTipo) {
        throw new Exception('El tipo de documento no existe en la base.');
    }

    $idTipoDocumento = $filaTipo['id_tipo_documento'];
    $consultaTipo->close();

    //mismo patron de búsqueda de paciente 
    $consultaPaciente = $conexion->prepare(
        'SELECT pac.id_persona FROM paciente pac
         INNER JOIN persona per ON per.id_persona = pac.id_persona
         WHERE per.cedula = ? LIMIT 1'
    );
    $consultaPaciente->bind_param('s', $paciente);
    $consultaPaciente->execute();
    $resultadoPaciente = $consultaPaciente->get_result();

    if ($resultadoPaciente->num_rows === 0) {
        throw new Exception('No existe un paciente con esa cédula.');
    }

    $idPaciente = $resultadoPaciente->fetch_assoc()['id_persona'];
    $consultaPaciente->close();

    // El archivo es opcional en la edición: solo lo procesamos si el usuario realmente eligió uno nuevo en el <input type="file">
    $rutaBD = null;

    if (isset($_FILES['archivo']) && $_FILES['archivo']['error'] === UPLOAD_ERR_OK) {

        $extension = strtolower(pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION));
        $permitidas = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];

        if (!in_array($extension, $permitidas, true)) {
            throw new Exception('Formato no permitido.');
        }

        $carpetaUploads = __DIR__ . '/../../uploads/documentos';
        $nombreArchivo = 'doc_' . uniqid('', true) . '.' . $extension;
        $rutaFisica = $carpetaUploads . '/' . $nombreArchivo;

        if (!move_uploaded_file($_FILES['archivo']['tmp_name'], $rutaFisica)) {
            throw new Exception('No se pudo guardar el nuevo archivo.');
        }

        $rutaBD = 'uploads/documentos/' . $nombreArchivo;

        //nota: el archivo viejo queda en el servidor sin usarse.
 
    }

    //armamos el UPDATE distinto según si hay archivo nuevo o no, porque si no mandaron archivo, NO queremos pisar ruta_archivo con vacío
    if ($rutaBD !== null) {
        $actualizar = $conexion->prepare(
            'UPDATE documento
             SET id_tipo_documento = ?, id_paciente = ?, titulo = ?, descripcion = ?, fecha_documento = ?, ruta_archivo = ?
             WHERE id_documento = ?'
        );
        $actualizar->bind_param(
            'iisssss',
            $idTipoDocumento, $idPaciente, $nombre, $descripcion, $fecha, $rutaBD, $idDocumento
        );
    } else {
        $actualizar = $conexion->prepare(
            'UPDATE documento
             SET id_tipo_documento = ?, id_paciente = ?, titulo = ?, descripcion = ?, fecha_documento = ?
             WHERE id_documento = ?'
        );
        $actualizar->bind_param(
            'iissss',
            $idTipoDocumento, $idPaciente, $nombre, $descripcion, $fecha, $idDocumento
        );
    }

    $actualizar->execute();
    $actualizar->close();

    echo json_encode(['success' => true, 'message' => 'Documento actualizado correctamente.']);
    $conexion->close();

} catch (Throwable $error) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => ['message' => $error->getMessage()]]);
}