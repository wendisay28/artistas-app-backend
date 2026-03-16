-- Migration: Portfolio Featured Logic
-- Date: 2026-03-16

-- 1. Crear tabla gallery si no existe
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

-- 2. Crear tabla featured_items si no existe
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

-- 3. Agregar columnas faltantes (seguro si ya existen)
ALTER TABLE featured_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE gallery        ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE users          ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;
