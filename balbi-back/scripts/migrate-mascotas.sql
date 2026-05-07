-- =============================================================================
-- Migración: Mascotas (relación N:1 con pacientes)
-- Ejecutar sobre la base de datos existente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS mascotas (
  id INT NOT NULL AUTO_INCREMENT,
  pacienteID INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  especie VARCHAR(100) NULL,
  raza VARCHAR(100) NULL,
  fechaNacimiento DATE NULL,
  notas TEXT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'BAJA') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mascotas_pacienteID (pacienteID),
  CONSTRAINT fk_mascotas_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
