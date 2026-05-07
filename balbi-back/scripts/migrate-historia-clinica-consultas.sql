/* =============================================================================
   Migración: Campos clínicos estructurados en consultas
   Si una columna ya existe, ejecutar solo los ALTER faltantes o ignorar error 1060.
   ============================================================================= */

ALTER TABLE consultas
  ADD COLUMN motivoConsulta TEXT NULL COMMENT 'Motivo de consulta / anamnesis' AFTER extra;

ALTER TABLE consultas
  ADD COLUMN examenClinico TEXT NULL COMMENT 'Examen clínico' AFTER motivoConsulta;

ALTER TABLE consultas
  ADD COLUMN diagnostico TEXT NULL COMMENT 'Diagnóstico' AFTER examenClinico;

ALTER TABLE consultas
  ADD COLUMN planTratamiento TEXT NULL COMMENT 'Plan / tratamiento' AFTER diagnostico;

ALTER TABLE consultas
  ADD COLUMN pesoKg DECIMAL(6, 2) NULL COMMENT 'Peso en kg al momento de la atención' AFTER planTratamiento;
