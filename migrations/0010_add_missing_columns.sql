-- Agregar columnas faltantes que están en el schema de Drizzle pero no en la BD

-- Campos de verificación de email (si no existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='email_verification_token') THEN
        ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='email_verification_expires') THEN
        ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMP;
    END IF;
END $$;

-- Verificar que las columnas fueron agregadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('email_verified', 'email_verification_token', 'email_verification_expires')
ORDER BY column_name;
