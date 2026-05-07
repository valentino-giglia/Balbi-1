-- =============================================================================
-- Migración: DNI y teléfono opcionales en pacientes (solo nombre obligatorio en app)
-- Idempotente: fuerza NULL permitido por si el esquema tenía NOT NULL.
-- =============================================================================

ALTER TABLE pacientes
  MODIFY COLUMN dni VARCHAR(20) NULL,
  MODIFY COLUMN telefono VARCHAR(50) NULL;
