-- Migración: Eliminar campos legacy de bio
-- Fecha: 2026-03-06
-- Motivo: Campos no utilizados en frontend, solo generan ruido en la BD

-- Eliminar campo legacy bio de artists
ALTER TABLE artists DROP COLUMN IF EXISTS bio;

-- Eliminar campo legacy shortBio de users  
ALTER TABLE users DROP COLUMN IF EXISTS short_bio;

-- Confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Campos legacy de bio eliminados exitosamente';
    RAISE NOTICE '🗑️  artists.bio - eliminado (no usado en frontend)';
    RAISE NOTICE '🗑️  users.short_bio - eliminado (no usado en frontend)';
    RAISE NOTICE '🚀 Base de datos más limpia sin impacto funcional';
END $$;
