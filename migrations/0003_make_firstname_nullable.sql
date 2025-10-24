-- Migration: Make first_name nullable to support social auth
-- Date: 2025-10-20

-- Remove NOT NULL constraint from first_name column
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
