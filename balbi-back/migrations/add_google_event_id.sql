-- Agregar columna googleEventId a la tabla turnos
ALTER TABLE turnos
  ADD COLUMN IF NOT EXISTS googleEventId VARCHAR(255) NULL;
