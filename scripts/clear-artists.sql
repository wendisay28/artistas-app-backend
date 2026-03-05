-- Script para eliminar todos los artistas y sus datos relacionados
-- ⚠️  ESTE SCRIPT BORRARÁ TODOS LOS REGISTROS DE LA TABLA ARTISTS

-- Primero, revisemos cuántos artistas hay
SELECT '=== ANTES DE ELIMINAR ===' as info;
SELECT COUNT(*) as total_artists FROM artists;
SELECT id, user_id, artist_name, created_at FROM artists ORDER BY id;

-- Eliminar todos los artistas
DELETE FROM artists;

-- Verificar que se eliminaron
SELECT '=== DESPUÉS DE ELIMINAR ===' as info;
SELECT COUNT(*) as total_artists FROM artists;
