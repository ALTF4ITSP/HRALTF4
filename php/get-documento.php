<?php

//arhcivo con el trabajo de dado un id, buscar ese documento en la base y devolver sus datos en json, para que document-form.js pueda precargar el formulario


header('Content-Type: application/json; charset=utf-8');


try {


    //el id viene por get (en la url: ?id=7), no por post, porque estamos pidiendo datos, no enviando un formulario
    $id = $_GET['id'] ?? '';

    //verifica que sea un número entero positivo antes de usarlo
    if (!preg_match('/^[1-9]\d*$/', $id)) {
    throw new Exception('ID de documento inválido.');
}

    // Traemos el documento, y de passo "traducimos" sus dos FKs
    // (id_tipo_documento e id_paciente) a algo legible con JOIN: - INNER JOIN con tipo_documento: obligatorio, todo documento SIEMPRE tiene un tipo - LEFT JOIN con paciente/persona: por si en algún momento id_paciente pudiera ser NULL (con LEFT JOIN, si no hay paciente asociado, el documento igual aparece, solo que cedula_paciente viene vacía en vez de desaparecer toda la fila)
    $consulta = $conexion->prepare(
        'SELECT
            d.id_documento, d.titulo, d.descripcion, d.fecha_documento,
            d.ruta_archivo, d.estado, t.nombre AS tipo_nombre,
            per.cedula AS cedula_paciente
         FROM documento d
         INNER JOIN tipo_documento t ON t.id_tipo_documento = d.id_tipo_documento
         LEFT JOIN paciente pac ON pac.id_persona = d.id_paciente
         LEFT JOIN persona per ON per.id_persona = pac.id_persona
         WHERE d.id_documento = ?
         LIMIT 1'
    );

    $consulta->bind_param('i', $id);
    $consulta->execute();

    $resultado = $consulta->get_result();

    if ($resultado->num_rows === 0) {
        throw new Exception('Documento no encontrado.');
    }

    $documento = $resultado->fetch_assoc();

    //el <select> de categoría usa claves cortas ("informe", "estudio", "administrativo"), pero en la base guardamos el nombre completo ("Informe medico").
    //este mapeo "inverso" traduce de vuelta al valor que el <option> espera, para que quede seleccionada la opción correcta al precargar.
    $tiposInverso = [
        'Informe medico' => 'informe',
        'Resultado de estudio' => 'estudio',
        'Documento Administrativo' => 'administrativo'
    ];

    $documento['categoria'] = $tiposInverso[$documento['tipo_nombre']] ?? '';

    echo json_encode(['success' => true, 'documento' => $documento]);
    $conexion->close();

} catch (Throwable $error) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => ['message' => $error->getMessage()]]);
}