-- ============================================================
-- Migración 0054: Merge tabla artists → users
-- + Corregir typos de columnas en companies
-- Ambiente: solo desarrollo (sin copia de datos)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- A. Agregar columnas de artista en users (todas nullable)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS artist_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stage_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS discipline_id INTEGER REFERENCES disciplines(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization_id INTEGER REFERENCES specializations(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_talents INTEGER[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_stats JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subcategories TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS artist_type VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS presentation_type TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS service_types TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS video_presentation VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_city VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS travel_availability BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS travel_distance INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS price_per_hour NUMERIC(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS price_range JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS artist_services JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_type VARCHAR DEFAULT 'depends';
ALTER TABLE users ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS licenses JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_accounts JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS artist_metadata JSONB DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────
-- B. Eliminar tabla artists (solo desarrollo — sin migración de datos)
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS artists CASCADE;

-- ─────────────────────────────────────────────────────────────
-- C. Corregir typos de columnas en companies
-- ─────────────────────────────────────────────────────────────
ALTER TABLE companies RENAME COLUMN teamsize       TO team_size;
ALTER TABLE companies RENAME COLUMN foundedyear    TO founded_year;
ALTER TABLE companies RENAME COLUMN linkedaccounts TO linked_accounts;
ALTER TABLE companies RENAME COLUMN workexperience TO work_experience;
ALTER TABLE companies RENAME COLUMN fancount       TO fan_count;
