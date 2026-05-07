-- =============================================================================
-- Migración: Relaciones a mascota (turnos, fichas, files)
-- Ejecutar después de migrate-mascotas.sql.
-- =============================================================================

-- Turnos: mascotaID nullable para migración
ALTER TABLE turnos
  ADD COLUMN mascotaID INT NULL AFTER pacienteID,
  ADD KEY idx_turnos_mascotaID (mascotaID),
  ADD CONSTRAINT fk_turnos_mascota FOREIGN KEY (mascotaID) REFERENCES mascotas (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Fichas: mascotaID nullable (se mantiene pacienteID para transición)
ALTER TABLE fichas
  ADD COLUMN mascotaID INT NULL AFTER pacienteID,
  ADD KEY idx_fichas_mascotaID (mascotaID),
  ADD CONSTRAINT fk_fichas_mascota FOREIGN KEY (mascotaID) REFERENCES mascotas (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Files: mascotaID nullable (se mantiene pacienteID para transición)
ALTER TABLE files
  ADD COLUMN mascotaID INT NULL AFTER pacienteID,
  ADD KEY idx_files_mascotaID (mascotaID),
  ADD CONSTRAINT fk_files_mascota FOREIGN KEY (mascotaID) REFERENCES mascotas (id) ON DELETE SET NULL ON UPDATE CASCADE;
