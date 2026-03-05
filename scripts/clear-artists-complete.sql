-- Script completo para eliminar artistas y usuarios del explorador
-- ⚠️  ESTE SCRIPT BORRARÁ TODOS LOS ARTISTAS Y USUARIOS RELACIONADOS

-- Primero, revisemos cuántos usuarios artistas hay
SELECT '=== ANTES DE ELIMINAR ===' as info;
SELECT COUNT(*) as total_users FROM users WHERE user_type = 'artist';
SELECT id, email, display_name, first_name, last_name, user_type, created_at FROM users WHERE user_type = 'artist' ORDER BY id;

-- Revisar artistas
SELECT COUNT(*) as total_artists FROM artists;
SELECT id, user_id, artist_name, created_at FROM artists ORDER BY id;

-- Eliminar en orden correcto (por foreign keys)
-- 1. Eliminar servicios de artistas
DELETE FROM services WHERE user_id IN (SELECT id FROM users WHERE user_type = 'artist');

-- 2. Eliminar obras de arte de artistas
DELETE FROM artworks WHERE user_id IN (SELECT id FROM users WHERE user_type = 'artist');

-- 3. Eliminar artistas
DELETE FROM artists;

-- 4. Eliminar usuarios con userType = 'artist'
DELETE FROM users WHERE user_type = 'artist';

-- Verificar que se eliminaron todo
SELECT '=== DESPUÉS DE ELIMINAR ===' as info;
SELECT COUNT(*) as total_users FROM users WHERE user_type = 'artist';
SELECT COUNT(*) as total_artists FROM artists;
