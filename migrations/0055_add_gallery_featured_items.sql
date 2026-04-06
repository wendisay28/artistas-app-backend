-- Migration: Add missing columns to gallery and create featured_items table
-- Safe (IF NOT EXISTS / IF NOT EXISTS checks)

-- 1. Add missing columns to gallery
ALTER TABLE gallery
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Create featured_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS featured_items (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type VARCHAR NOT NULL,
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add index for fast gallery lookups
CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_user_featured ON gallery(user_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_featured_items_user_id ON featured_items(user_id);

DO $$ BEGIN
  RAISE NOTICE '✅ gallery columns and featured_items table ready';
END $$;
