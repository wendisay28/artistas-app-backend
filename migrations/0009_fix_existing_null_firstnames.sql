-- Actualizar usuarios existentes que tengan first_name null
-- Esto es especialmente para usuarios que se crearon antes de la migración 0008

UPDATE users
SET first_name = COALESCE(
  first_name,
  display_name,
  split_part(email, '@', 1),
  'Usuario'
)
WHERE first_name IS NULL OR first_name = '';

-- Verificar resultado
SELECT
  id,
  email,
  first_name,
  display_name
FROM users
WHERE first_name IS NULL OR first_name = '';
