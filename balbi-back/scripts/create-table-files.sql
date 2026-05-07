-- Tabla files: archivos/imágenes del paciente almacenados en Firebase Storage
-- Ejecutar sobre la base de datos existente (ej: USE cordoba_nutricion;)

CREATE TABLE IF NOT EXISTS files (
  id INT NOT NULL AUTO_INCREMENT,
  storagePath VARCHAR(512) NOT NULL COMMENT 'Ruta del archivo en el bucket (ej: pacientes/123/abc.jpg)',
  pacienteID INT NOT NULL,
  nombreArchivo VARCHAR(255) NULL COMMENT 'Nombre original del archivo',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_files_pacienteID (pacienteID),
  CONSTRAINT fk_files_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
