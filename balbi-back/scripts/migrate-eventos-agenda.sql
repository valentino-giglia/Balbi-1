-- =============================================================================
-- Migración: Eventos de agenda (traslado, envío de muestras, cadetería)
-- Ejecutar sobre la base de datos existente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS eventos_agenda (
  id INT NOT NULL AUTO_INCREMENT,
  tipo ENUM('TRASLADO', 'ENVIO_MUESTRAS', 'CADETERIA') NOT NULL,
  profesionalID INT NOT NULL,
  horaInicio DATETIME NOT NULL,
  horaFin DATETIME NOT NULL,
  notas TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_eventos_agenda_profesionalID (profesionalID),
  KEY idx_eventos_agenda_horaInicio (horaInicio),
  CONSTRAINT fk_eventos_agenda_profesional FOREIGN KEY (profesionalID) REFERENCES profesionales (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
