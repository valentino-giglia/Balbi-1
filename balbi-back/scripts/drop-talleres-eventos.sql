-- =============================================================================
-- Script para eliminar talleres, eventos y funnel (estructura de BD)
-- Ejecutar ANTES de actualizar el backend/frontend
--
-- Uso: mysql -u USUARIO -p NOMBRE_BD < scripts/drop-talleres-eventos.sql
-- =============================================================================

-- 1. Limpiar referencias a talleres en pagos (poner NULL donde haya tallerID)
UPDATE pagos SET tallerID = NULL WHERE tallerID IS NOT NULL;

-- 2. Eliminar FK de pagos hacia talleres
ALTER TABLE pagos DROP FOREIGN KEY fk_pagos_taller;

-- 3. Eliminar columna tallerID de pagos
ALTER TABLE pagos DROP COLUMN tallerID;

-- 4. Eliminar tabla eventos_pacientes (N:M entre eventos y pacientes)
DROP TABLE IF EXISTS eventos_pacientes;

-- 5. Eliminar tabla eventos
DROP TABLE IF EXISTS eventos;

-- 6. Eliminar tabla talleres
DROP TABLE IF EXISTS talleres;

-- =============================================================================
-- Nota: El funnel de ventas solo existía en el frontend, no tiene tablas en BD
-- =============================================================================
