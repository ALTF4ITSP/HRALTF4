<?php
declare(strict_types=1);

final class DocumentRepositoryException extends RuntimeException
{
}

function document_repository_find(int $id, array $config): ?array
{
    if ($config['storage_driver'] === 'json') {
        foreach (document_json_read($config['json_path']) as $record) {
            if ((int) ($record['id_documento'] ?? 0) === $id) {
                return $record;
            }
        }

        return null;
    }

    $pdo = document_pdo($config);
    $statement = $pdo->prepare('SELECT * FROM documentos WHERE id_documento = :id_documento');
    $statement->execute(['id_documento' => $id]);
    $row = $statement->fetch();

    return $row ? document_record_from_row($row) : null;
}

function document_repository_create(array $record, array $config): array
{
    if ($config['storage_driver'] === 'json') {
        return document_json_mutate($config['json_path'], function (array &$records) use ($record): array {
            $nextId = 1;

            foreach ($records as $existing) {
                $nextId = max($nextId, (int) ($existing['id_documento'] ?? 0) + 1);
            }

            $record['id_documento'] = $nextId;
            $records[] = $record;

            return $record;
        });
    }

    $pdo = document_pdo($config);
    $statement = $pdo->prepare(
        'INSERT INTO documentos (
            nombre,
            paciente_referencia,
            fecha_documento,
            categoria,
            archivo_nombre_original,
            archivo_nombre_almacenado,
            archivo_tipo_mime,
            archivo_tamano_bytes,
            fecha_subida,
            fecha_modificacion
        ) VALUES (
            :nombre,
            :paciente_referencia,
            :fecha_documento,
            :categoria,
            :archivo_nombre_original,
            :archivo_nombre_almacenado,
            :archivo_tipo_mime,
            :archivo_tamano_bytes,
            :fecha_subida,
            :fecha_modificacion
        )'
    );
    $statement->execute(document_record_parameters($record));
    $record['id_documento'] = (int) $pdo->lastInsertId();

    return $record;
}

function document_repository_update(array $record, array $config): array
{
    if ($config['storage_driver'] === 'json') {
        return document_json_mutate($config['json_path'], function (array &$records) use ($record): array {
            foreach ($records as $index => $existing) {
                if ((int) ($existing['id_documento'] ?? 0) === (int) $record['id_documento']) {
                    $records[$index] = $record;
                    return $record;
                }
            }

            throw new DocumentRepositoryException('Document not found.');
        });
    }

    $pdo = document_pdo($config);
    $statement = $pdo->prepare(
        'UPDATE documentos SET
            nombre = :nombre,
            paciente_referencia = :paciente_referencia,
            fecha_documento = :fecha_documento,
            categoria = :categoria,
            archivo_nombre_original = :archivo_nombre_original,
            archivo_nombre_almacenado = :archivo_nombre_almacenado,
            archivo_tipo_mime = :archivo_tipo_mime,
            archivo_tamano_bytes = :archivo_tamano_bytes,
            fecha_subida = :fecha_subida,
            fecha_modificacion = :fecha_modificacion
        WHERE id_documento = :id_documento'
    );
    $parameters = document_record_parameters($record);
    $parameters['id_documento'] = $record['id_documento'];
    $statement->execute($parameters);

    if ($statement->rowCount() === 0 && document_repository_find((int) $record['id_documento'], $config) === null) {
        throw new DocumentRepositoryException('Document not found.');
    }

    return $record;
}

function document_json_read(string $path): array
{
    if (!is_file($path)) {
        return [];
    }

    $handle = fopen($path, 'r');
    if ($handle === false) {
        throw new DocumentRepositoryException('The JSON document store could not be opened.');
    }

    try {
        if (!flock($handle, LOCK_SH)) {
            throw new DocumentRepositoryException('The JSON document store could not be locked.');
        }

        $contents = stream_get_contents($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }

    if ($contents === false || trim($contents) === '') {
        return [];
    }

    $records = json_decode($contents, true);
    if (!is_array($records)) {
        throw new DocumentRepositoryException('The JSON document store is invalid.');
    }

    return $records;
}

function document_json_mutate(string $path, callable $mutation): array
{
    $directory = dirname($path);
    if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
        throw new DocumentRepositoryException('The JSON storage directory could not be created.');
    }

    $handle = fopen($path, 'c+');
    if ($handle === false) {
        throw new DocumentRepositoryException('The JSON document store could not be opened.');
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            throw new DocumentRepositoryException('The JSON document store could not be locked.');
        }

        rewind($handle);
        $contents = stream_get_contents($handle);
        $records = trim((string) $contents) === '' ? [] : json_decode((string) $contents, true);

        if (!is_array($records)) {
            throw new DocumentRepositoryException('The JSON document store is invalid.');
        }

        $result = $mutation($records);
        $encoded = json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($encoded === false) {
            throw new DocumentRepositoryException('The document records could not be encoded.');
        }

        rewind($handle);
        if (!ftruncate($handle, 0) || fwrite($handle, $encoded . PHP_EOL) === false || !fflush($handle)) {
            throw new DocumentRepositoryException('The JSON document store could not be written.');
        }

        flock($handle, LOCK_UN);
        return $result;
    } finally {
        fclose($handle);
    }
}

function document_pdo(array $config): PDO
{
    static $connection = null;

    if ($connection instanceof PDO) {
        return $connection;
    }

    if ($config['storage_driver'] !== 'pdo') {
        throw new DocumentRepositoryException('Unsupported document storage driver.');
    }

    if ($config['pdo']['dsn'] === '') {
        throw new DocumentRepositoryException('DOCUMENT_DB_DSN is not configured.');
    }

    $connection = new PDO(
        $config['pdo']['dsn'],
        $config['pdo']['username'],
        $config['pdo']['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $connection;
}

function document_record_parameters(array $record): array
{
    return [
        'nombre' => $record['nombre'],
        'paciente_referencia' => $record['paciente'],
        'fecha_documento' => $record['fecha_documento'],
        'categoria' => $record['categoria'],
        'archivo_nombre_original' => $record['archivo']['nombre_original'],
        'archivo_nombre_almacenado' => $record['archivo']['nombre_almacenado'],
        'archivo_tipo_mime' => $record['archivo']['tipo_mime'],
        'archivo_tamano_bytes' => $record['archivo']['tamano_bytes'],
        'fecha_subida' => document_sql_timestamp($record['fecha_subida']),
        'fecha_modificacion' => document_sql_timestamp($record['fecha_modificacion']),
    ];
}

function document_record_from_row(array $row): array
{
    return [
        'id_documento' => (int) $row['id_documento'],
        'nombre' => $row['nombre'],
        'paciente' => $row['paciente_referencia'],
        'fecha_documento' => $row['fecha_documento'],
        'categoria' => $row['categoria'],
        'archivo' => [
            'nombre_original' => $row['archivo_nombre_original'],
            'nombre_almacenado' => $row['archivo_nombre_almacenado'],
            'tipo_mime' => $row['archivo_tipo_mime'],
            'tamano_bytes' => (int) $row['archivo_tamano_bytes'],
        ],
        'fecha_subida' => document_iso_timestamp($row['fecha_subida']),
        'fecha_modificacion' => document_iso_timestamp($row['fecha_modificacion']),
    ];
}

function document_sql_timestamp(string $timestamp): string
{
    return gmdate('Y-m-d H:i:s', strtotime($timestamp));
}

function document_iso_timestamp(string $timestamp): string
{
    return gmdate('Y-m-d\TH:i:s\Z', strtotime($timestamp));
}
