<?php

header('Content-Type: application/json; charset=utf-8');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {


    //conexion con mysql
    $conexion = new mysqli(
        'localhost',
        'root',
        '',
        'altf4',
        3306
    );

    $conexion->set_charset('utf8mb4');


    //comprobar datos del archivo
    if (!isset($_FILES['archivo'])) {
        throw new Exception('No se recibió ningún archivo.');
    }

    if ($_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Hubo un error al subir el archivo.');
    }


    //datos del formulario
    $nombre = trim($_POST['nombre'] ?? '');
    $paciente = trim($_POST['paciente'] ?? '');
    $fecha = $_POST['fecha'] ?? '';
    $categoria = $_POST['categoria'] ?? '';
    $descripcion = trim($_POST['descripcion'] ?? '');


    if ($nombre === '') {
        throw new Exception('El nombre del documento es obligatorio.');
    }

    if ($paciente === '') {
        throw new Exception('El paciente es obligatorio.');
    }

    if ($fecha === '') {
        throw new Exception('La fecha del documento es obligatoria.');
    }

    if ($categoria === '') {
        throw new Exception('La categoría es obligatoria.');
    }

    //validar archivo
    $archivo = $_FILES['archivo'];

    $nombreOriginal = $archivo['name'];
    $tamano = $archivo['size'];

    $extension = strtolower(
        pathinfo($nombreOriginal, PATHINFO_EXTENSION)
    );

    $extensionesPermitidas = [
        'pdf',
        'docx',
        'jpg',
        'jpeg',
        'png'
    ];

    if (!in_array($extension, $extensionesPermitidas, true)) {
        throw new Exception(
            'Formato no permitido. Usá PDF, DOCX, JPG o PNG.'
        );
    }

    if ($tamano > 10 * 1024 * 1024) {
        throw new Exception(
            'El archivo supera el límite de 10 MB.'
        );
    }



     //buscar el tipo de docuemento
    $tipos = [
        'informe' => 'Informe medico',
        'estudio' => 'Resultado de estudio',
        'administrativo' => 'Documento Administrativo'
    ];

    if (!isset($tipos[$categoria])) {
        throw new Exception('Categoría de documento no válida.');
    }

    $nombreTipo = $tipos[$categoria];


    $consultaTipo = $conexion->prepare(
        'SELECT id_tipo_documento
         FROM tipo_documento
         WHERE nombre = ?
         LIMIT 1'
    );

    $consultaTipo->bind_param('s', $nombreTipo);
    $consultaTipo->execute();

    $resultadoTipo = $consultaTipo->get_result();

    if ($resultadoTipo->num_rows > 0) {

        $filaTipo = $resultadoTipo->fetch_assoc();
        $idTipoDocumento = $filaTipo['id_tipo_documento'];

    } else {

        // si el tipo no existe, lo creamos
        $crearTipo = $conexion->prepare(
            'INSERT INTO tipo_documento
                (nombre, descripcion)
             VALUES
                (?, ?)'
        );

        $descripcionTipo = 'Tipo de documento utilizado por el sistema.';

        $crearTipo->bind_param(
            'ss',
            $nombreTipo,
            $descripcionTipo
        );

        $crearTipo->execute();

        $idTipoDocumento = $conexion->insert_id;

        $crearTipo->close();
    }

    $consultaTipo->close();


    //crea carpeta de destino
    $carpetaUploads = __DIR__ . '/../../uploads/documentos';

    if (!is_dir($carpetaUploads)) {

        if (!mkdir($carpetaUploads, 0775, true)) {
            throw new Exception(
                'No se pudo crear la carpeta de documentos.'
            );
        }
    }


    //genera nombre unico
    $nombreArchivo = 'doc_' .
        uniqid('', true) .
        '.' .
        $extension;

    $rutaFisica = $carpetaUploads . '/' . $nombreArchivo;

    $rutaBD = 'uploads/documentos/' . $nombreArchivo;


    //mover archivo
    if (!move_uploaded_file(
        $archivo['tmp_name'],
        $rutaFisica
    )) {

        throw new Exception(
            'No se pudo guardar el archivo en el servidor.'
        );
    }



    //funcionario que carga
    // temporalmente usamos el funcionario 3
    // (administrativo/documentación)
    //mas adelante lo vamos a obtener del
    // usuario que inicio sesion

    $idFuncionarioCarga = 3;


//guardar doc en sql
    $insertar = $conexion->prepare(
        'INSERT INTO documento
        (
            id_tipo_documento,
            id_funcionario_carga,
            titulo,
            descripcion,
            ruta_archivo,
            fecha_carga,
            version,
            estado
        )
        VALUES
        (?, ?, ?, ?, ?, NOW(), 1, ?)'
    );

    $estado = 'ACTIVO';

    $insertar->bind_param(
        'iissss',
        $idTipoDocumento,
        $idFuncionarioCarga,
        $nombre,
        $descripcion,
        $rutaBD,
        $estado
    );

    $insertar->execute();

    $idDocumento = $conexion->insert_id;

    $insertar->close();


//respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Documento cargado correctamente.',
        'id_documento' => $idDocumento
    ]);


    $conexion->close();


} catch (Throwable $error) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => $error->getMessage()
    ]);
}