CREATE TABLE documentos (
    id_documento BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    paciente_referencia VARCHAR(80) NOT NULL,
    fecha_documento DATE NOT NULL,
    categoria VARCHAR(32) NOT NULL,
    archivo_nombre_original VARCHAR(255) NOT NULL,
    archivo_nombre_almacenado VARCHAR(255) NOT NULL,
    archivo_tipo_mime VARCHAR(127) NOT NULL,
    archivo_tamano_bytes BIGINT UNSIGNED NOT NULL,
    fecha_subida DATETIME NOT NULL,
    fecha_modificacion DATETIME NOT NULL,
    PRIMARY KEY (id_documento),
    UNIQUE KEY uq_documentos_archivo_almacenado (archivo_nombre_almacenado),
    KEY idx_documentos_paciente (paciente_referencia),
    KEY idx_documentos_fecha (fecha_documento),
    KEY idx_documentos_categoria (categoria),
    CONSTRAINT chk_documentos_categoria
        CHECK (categoria IN ('informe', 'estudio', 'administrativo')),
    CONSTRAINT chk_documentos_archivo_tamano
        CHECK (archivo_tamano_bytes BETWEEN 1 AND 10485760)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
