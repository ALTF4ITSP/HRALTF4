<?php
declare(strict_types=1);

/*
 * Código QR de un documento (tabla `qr`).
 * Cada documento tiene un token único y difícil de adivinar. El QR lleva el enlace
 * documents-file.php?qr=<token>, que abre el archivo sin tener que saber su número.
 */

// Devuelve el token del documento; si todavía no tiene uno, lo crea.
function documento_qr(PDO $conexion, int $idDocumento): string
{
    $buscar = $conexion->prepare("SELECT token FROM qr WHERE id_documento = ? AND estado = 'ACTIVO'");
    $buscar->execute([$idDocumento]);
    $token = $buscar->fetchColumn();
    if ($token !== false) {
        return (string) $token;
    }

    $token = bin2hex(random_bytes(16));   // 32 caracteres al azar
    $crear = $conexion->prepare(
        "INSERT INTO qr (id_documento, token, fecha_generacion, estado) VALUES (?, ?, NOW(), 'ACTIVO')"
    );
    $crear->execute([$idDocumento, $token]);
    return $token;
}
