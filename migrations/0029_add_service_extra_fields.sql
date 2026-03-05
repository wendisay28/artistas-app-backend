-- Migration: Agregar campos extendidos a la tabla services
-- Date: 2026-02-28
-- Campos: currency, icon, delivery_tag, package_type, included_count, delivery_days, weekly_frequency

DO $$
BEGIN
    -- Moneda del precio (COP, USD, EUR)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='services' AND column_name='currency') THEN
        ALTER TABLE services ADD COLUMN currency VARCHAR(10) DEFAULT 'COP';
    END IF;

    -- Ícono seleccionado en el modal (nombre de Ionicons)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='services' AND column_name='icon') THEN
        ALTER TABLE services ADD COLUMN icon VARCHAR(100) DEFAULT 'brush-outline';
    END IF;

    -- Etiqueta de entrega (Express, Estándar, A medida)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='services' AND column_name='deliveryTag') THEN
        ALTER TABLE services ADD COLUMN deliveryTag VARCHAR(50);
    END IF;

    -- Tipo de paquete (single, weekly, monthly)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='services' AND column_name='packageType') THEN
        ALTER TABLE services ADD COLUMN packageType VARCHAR(20) DEFAULT 'single';
    END IF;

    -- Cantidad incluida en el paquete
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='services' AND column_name='includedCount') THEN
        ALTER TABLE services ADD COLUMN includedCount INTEGER DEFAULT 1;
    END IF;

    -- Plazo máximo de entrega en días (0 = no aplica)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='services' AND column_name='deliveryDays') THEN
        ALTER TABLE services ADD COLUMN deliveryDays INTEGER DEFAULT 0;
    END IF;

    -- Frecuencia semanal (solo para packageType = weekly)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='services' AND column_name='weeklyFrequency') THEN
        ALTER TABLE services ADD COLUMN weeklyFrequency INTEGER;
    END IF;
END $$;

-- Verificar columnas agregadas
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'services'
  AND column_name IN ('currency', 'icon', 'deliveryTag', 'packageType', 'includedCount', 'deliveryDays', 'weeklyFrequency')
ORDER BY column_name;
