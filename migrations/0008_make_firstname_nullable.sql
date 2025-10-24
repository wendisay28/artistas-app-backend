-- Migración para hacer firstName nullable
-- Esto permite que usuarios que se registren solo con email/password
-- puedan completar su nombre en el onboarding

ALTER TABLE users
ALTER COLUMN first_name DROP NOT NULL;

-- Actualizar usuarios existentes que tengan first_name null con valor por defecto
UPDATE users
SET first_name = COALESCE(first_name, split_part(email, '@', 1))
WHERE first_name IS NULL;
