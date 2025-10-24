-- Script para agregar columnas faltantes en la tabla companies
-- Ejecutar en Neon SQL Editor

-- ============================================================
-- FIX: Agregar columnas básicas en la tabla companies
-- ============================================================

-- Agregar company_name si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'company_name'
    ) THEN
        ALTER TABLE companies ADD COLUMN company_name VARCHAR NOT NULL DEFAULT 'Mi Empresa';
    END IF;
END $$;

-- Agregar legal_name si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'legal_name'
    ) THEN
        ALTER TABLE companies ADD COLUMN legal_name VARCHAR;
    END IF;
END $$;

-- Agregar tax_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'tax_id'
    ) THEN
        ALTER TABLE companies ADD COLUMN tax_id VARCHAR;
    END IF;
END $$;

-- Agregar description si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'description'
    ) THEN
        ALTER TABLE companies ADD COLUMN description TEXT;
    END IF;
END $$;

-- Agregar company_type si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'company_type'
    ) THEN
        ALTER TABLE companies ADD COLUMN company_type VARCHAR;
    END IF;
END $$;

-- Agregar phone si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'phone'
    ) THEN
        ALTER TABLE companies ADD COLUMN phone VARCHAR;
    END IF;
END $$;

-- Agregar email si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'email'
    ) THEN
        ALTER TABLE companies ADD COLUMN email VARCHAR;
    END IF;
END $$;

-- Agregar website si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'website'
    ) THEN
        ALTER TABLE companies ADD COLUMN website VARCHAR;
    END IF;
END $$;

-- Agregar address si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'address'
    ) THEN
        ALTER TABLE companies ADD COLUMN address TEXT;
    END IF;
END $$;

-- Agregar city si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'city'
    ) THEN
        ALTER TABLE companies ADD COLUMN city VARCHAR;
    END IF;
END $$;

-- Agregar logo_url si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE companies ADD COLUMN logo_url VARCHAR;
    END IF;
END $$;

-- Agregar is_verified si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE companies ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Agregar is_active si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE companies ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Agregar created_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE companies ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Agregar updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE companies ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar todas las columnas de companies
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;
