-- Migration: Add highlight photos system for artists
-- Date: 2025-10-23
-- Description: Adds a new table for storing 4 required highlight photos per artist

-- Create highlight_photos table
CREATE TABLE IF NOT EXISTS highlight_photos (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url VARCHAR NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
  caption TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, position)
);

-- Create index for faster queries
CREATE INDEX idx_highlight_photos_user_id ON highlight_photos(user_id);

-- Add comment to table
COMMENT ON TABLE highlight_photos IS 'Stores 4 required highlight photos for each artist profile';
COMMENT ON COLUMN highlight_photos.position IS 'Position of the photo (1-4), must be unique per user';
COMMENT ON COLUMN highlight_photos.user_id IS 'Reference to the user who owns these photos';
COMMENT ON COLUMN highlight_photos.image_url IS 'URL to the image in Supabase Storage';
