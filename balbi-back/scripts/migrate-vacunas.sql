-- =============================================================================
-- Migración: Vacunas (vinculadas a mascota)
-- Ejecutar después de migrate-mascotas.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS vacunas (
  id INT NOT NULL AUTO_INCREMENT,
  mascotaID INT NOT NULL,
  nombre VARCHAR(255) NOT NULL COMMENT 'Nombre de la vacuna',
  fechaAplicacion DATE NOT NULL,
  proximaDosis DATE NULL,
  notas TEXT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vacunas_mascotaID (mascotaID),
  CONSTRAINT fk_vacunas_mascota FOREIGN KEY (mascotaID) REFERENCES mascotas (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
