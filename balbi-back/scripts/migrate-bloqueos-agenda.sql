-- =============================================================================
-- Migración: Bloqueos de agenda (inicio-fin por profesional)
-- Ejecutar sobre la base de datos existente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS bloqueos_agenda (
  id INT NOT NULL AUTO_INCREMENT,
  profesionalID INT NOT NULL,
  horaInicio DATETIME NOT NULL,
  horaFin DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bloqueos_agenda_profesionalID (profesionalID),
  KEY idx_bloqueos_agenda_horaInicio (horaInicio),
  CONSTRAINT fk_bloqueos_agenda_profesional FOREIGN KEY (profesionalID) REFERENCES profesionales (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
