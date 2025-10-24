-- Migración completa para agregar TODAS las columnas faltantes de la tabla users

DO $$
BEGIN
    -- Columnas de onboarding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='onboarding_completed') THEN
        ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='onboarding_step') THEN
        ALTER TABLE users ADD COLUMN onboarding_step VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='onboarding_data') THEN
        ALTER TABLE users ADD COLUMN onboarding_data JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='onboarding_started_at') THEN
        ALTER TABLE users ADD COLUMN onboarding_started_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='onboarding_completed_at') THEN
        ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP;
    END IF;

    -- Columnas adicionales de perfil
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(30) UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='short_bio') THEN
        ALTER TABLE users ADD COLUMN short_bio VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='interested_categories') THEN
        ALTER TABLE users ADD COLUMN interested_categories INTEGER[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='interested_tags') THEN
        ALTER TABLE users ADD COLUMN interested_tags TEXT[];
    END IF;

    -- Columnas que podrían faltar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='display_name') THEN
        ALTER TABLE users ADD COLUMN display_name VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='cover_image_url') THEN
        ALTER TABLE users ADD COLUMN cover_image_url VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address') THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='website') THEN
        ALTER TABLE users ADD COLUMN website VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='social_media') THEN
        ALTER TABLE users ADD COLUMN social_media JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_featured') THEN
        ALTER TABLE users ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_available') THEN
        ALTER TABLE users ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='rating') THEN
        ALTER TABLE users ADD COLUMN rating NUMERIC(3, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_reviews') THEN
        ALTER TABLE users ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fan_count') THEN
        ALTER TABLE users ADD COLUMN fan_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='preferences') THEN
        ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='settings') THEN
        ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_active') THEN
        ALTER TABLE users ADD COLUMN last_active TIMESTAMP;
    END IF;

    -- Asegurar que created_at y updated_at existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

END $$;

-- Verificar que las columnas fueron agregadas (mostrar todas las nuevas)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'onboarding_completed', 'onboarding_step', 'onboarding_data',
    'onboarding_started_at', 'onboarding_completed_at',
    'username', 'short_bio', 'interested_categories', 'interested_tags',
    'email_verified', 'email_verification_token', 'email_verification_expires'
  )
ORDER BY column_name;
