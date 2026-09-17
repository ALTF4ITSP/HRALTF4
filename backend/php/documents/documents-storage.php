<?php
declare(strict_types=1);

function document_storage_directories(): array
{
    $projectDirectory = dirname(__DIR__, 2) . '/uploads/documentos';
    $temporaryRoot = ini_get('upload_tmp_dir') ?: sys_get_temp_dir();
    $temporaryDirectory = rtrim($temporaryRoot, DIRECTORY_SEPARATOR) . '/hraltf4-documentos';

    return [$projectDirectory, $temporaryDirectory];
}

function document_storage_directory(): string
{
    [$projectDirectory, $temporaryDirectory] = document_storage_directories();

    if (is_dir($projectDirectory) && is_writable($projectDirectory)) {
        return $projectDirectory;
    }

    if (!is_dir($temporaryDirectory)
        && !mkdir($temporaryDirectory, 0770, true)
        && !is_dir($temporaryDirectory)) {
        throw new RuntimeException('No se pudo preparar la carpeta de documentos.');
    }

    return $temporaryDirectory;
}
