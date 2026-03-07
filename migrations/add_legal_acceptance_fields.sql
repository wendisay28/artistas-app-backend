-- Migración: Agregar campos de aceptación legal
-- Fecha: 2026-03-06
-- Motivo: Persistir aceptación de términos desde Portal del Autor

-- Agregar campos de aceptación legal a users
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE;

-- Mantener terms_accepted_at para compatibilidad (se actualizará cuando se acepten todos los términos)
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;

-- Confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Campos de aceptación legal agregados exitosamente';
    RAISE NOTICE '📋 terms_accepted - Booleano para términos y condiciones';
    RAISE NOTICE '🔒 privacy_accepted - Booleano para política de privacidad';
    RAISE NOTICE '👤 age_verified - Booleano para verificación de mayoría de edad';
    RAISE NOTICE '⏰ terms_accepted_at - Timestamp cuando se aceptan todos los términos';
END $$;
