-- Migration: Portfolio Featured Logic
-- Description: Crea tablas gallery y featured_items si no existen,
--              agrega is_featured a featured_items y profile_complete a users.
-- Date: 2026-03-16

-- ============================================================================
-- 1. CREAR TABLA gallery (fotos del portafolio)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gallery (
  id              SERIAL PRIMARY KEY,
  user_id         VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR,
  description     TEXT,
  image_url       VARCHAR NOT NULL,
  tags            TEXT[]  DEFAULT '{}',
  is_public       BOOLEAN DEFAULT true,
  is_featured     BOOLEAN DEFAULT false,
  order_position  INTEGER DEFAULT 0,
  metadata        JSONB   DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CREAR TABLA featured_items (videos/enlaces del portafolio)
-- ============================================================================
CREATE TABLE IF NOT EXISTS featured_items (
  id            SERIAL PRIMARY KEY,
  user_id       VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR NOT NULL,
  description   TEXT,
  url           TEXT    NOT NULL,
  type          VARCHAR NOT NULL DEFAULT 'other',
  thumbnail_url TEXT,
  is_featured   BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. AGREGAR COLUMNAS FALTANTES (si las tablas ya existían sin ellas)
-- ============================================================================
ALTER TABLE featured_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- ============================================================================
-- 4. ÍNDICE OPCIONAL (optimiza búsqueda de video destacado por usuario)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_featured_items_user_featured
  ON featured_items (user_id)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_gallery_user_featured
  ON gallery (user_id)
  WHERE is_featured = true;
