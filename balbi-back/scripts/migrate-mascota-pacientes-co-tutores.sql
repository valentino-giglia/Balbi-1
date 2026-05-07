-- =============================================================================
-- Migración: Co-tutores de mascotas (N:M adicional al tutor principal en mascotas.pacienteID)
-- Ejecutar sobre la base de datos existente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS mascota_pacientes (
  mascotaID INT NOT NULL,
  pacienteID INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (mascotaID, pacienteID),
  KEY idx_mascota_pacientes_pacienteID (pacienteID),
  CONSTRAINT fk_mp_mascota FOREIGN KEY (mascotaID) REFERENCES mascotas (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mp_paciente FOREIGN KEY (pacienteID) REFERENCES pacientes (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
