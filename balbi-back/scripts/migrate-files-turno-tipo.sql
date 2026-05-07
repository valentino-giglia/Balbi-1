-- =============================================================================
-- Migración: Archivos por turno y tipo (imagen/documento)
-- Ejecutar después de migrate-mascota-relations.sql.
-- =============================================================================

ALTER TABLE files
  ADD COLUMN turnoID INT NULL AFTER mascotaID,
  ADD COLUMN tipoArchivo VARCHAR(32) NULL COMMENT 'IMAGEN, DOCUMENTO' AFTER nombreArchivo,
  ADD KEY idx_files_turnoID (turnoID),
  ADD CONSTRAINT fk_files_turno FOREIGN KEY (turnoID) REFERENCES turnos (id) ON DELETE SET NULL ON UPDATE CASCADE;
