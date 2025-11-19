-- Migración: Agregar campos adicionales de perfil profesional a la tabla artists
-- Fecha: 2025-01-07
-- Descripción: Agrega campos para educación, idiomas, licencias, tarifas y enlaces

-- Agregar campos de pricing mejorados
ALTER TABLE artists ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);
ALTER TABLE artists ADD COLUMN IF NOT EXISTS pricing_type VARCHAR CHECK (pricing_type IN ('hourly', 'deliverable', 'depends')) DEFAULT 'depends';

-- Agregar campos de información académica y profesional
ALTER TABLE artists ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS licenses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS linked_accounts JSONB DEFAULT '{}'::jsonb;

-- Comentarios para documentación
COMMENT ON COLUMN artists.hourly_rate IS 'Tarifa por hora o precio base del artista';
COMMENT ON COLUMN artists.pricing_type IS 'Tipo de cobro: por hora, por entregable, o depende del proyecto';
COMMENT ON COLUMN artists.education IS 'Array de objetos con formación académica: [{degree, institution, year}]';
COMMENT ON COLUMN artists.languages IS 'Array de idiomas: [{language, level}]';
COMMENT ON COLUMN artists.licenses IS 'Array de licencias/certificaciones: [{name, issuer, date}]';
COMMENT ON COLUMN artists.linked_accounts IS 'Objeto con redes sociales y portafolios: {instagram, behance, linkedin, website}';
