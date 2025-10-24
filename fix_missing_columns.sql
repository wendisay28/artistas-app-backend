-- Script para agregar columnas faltantes en las tablas
-- Ejecutar en Neon SQL Editor

-- ============================================================
-- FIX 1: Agregar columnas faltantes en la tabla artists
-- ============================================================

-- Agregar discipline_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artists' AND column_name = 'discipline_id'
    ) THEN
        ALTER TABLE artists ADD COLUMN discipline_id INTEGER REFERENCES disciplines(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Agregar role_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artists' AND column_name = 'role_id'
    ) THEN
        ALTER TABLE artists ADD COLUMN role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Agregar specialization_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artists' AND column_name = 'specialization_id'
    ) THEN
        ALTER TABLE artists ADD COLUMN specialization_id INTEGER REFERENCES specializations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Agregar additional_talents si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artists' AND column_name = 'additional_talents'
    ) THEN
        ALTER TABLE artists ADD COLUMN additional_talents INTEGER[] DEFAULT '{}';
    END IF;
END $$;

-- Agregar custom_stats si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'artists' AND column_name = 'custom_stats'
    ) THEN
        ALTER TABLE artists ADD COLUMN custom_stats JSONB DEFAULT '{}';
    END IF;
END $$;

-- ============================================================
-- FIX 2: Agregar columna is_primary en la tabla companies
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'is_primary'
    ) THEN
        ALTER TABLE companies ADD COLUMN is_primary BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar columnas de artists
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'artists'
    AND column_name IN ('discipline_id', 'role_id', 'specialization_id', 'additional_talents', 'custom_stats')
ORDER BY column_name;

-- Verificar columna de companies
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'companies'
    AND column_name = 'is_primary';
