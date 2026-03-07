-- Migration: Agregar columna unit a la tabla services
-- Date: 2026-03-05
-- Campo: unit (unidad de medida del servicio)

DO $$
BEGIN
    -- Unidad de medida (Fotos, Horas, Sesiones, etc.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='services' AND column_name='unit') THEN
        ALTER TABLE services ADD COLUMN unit VARCHAR(100);
    END IF;
END $$;

-- Verificar columna agregada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'services'
  AND column_name = 'unit';
