-- Migración SEGURA para agregar campos de onboarding y verificación de email
-- Esta migración solo AGREGA campos, NO elimina nada
-- Fecha: 2025-10-20

-- ============================================
-- CAMPOS DE VERIFICACIÓN DE EMAIL
-- ============================================

-- Agregar email_verified si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='email_verified') THEN
        ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;
    END IF;
END $$;

-- Agregar email_verification_token si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='email_verification_token') THEN
        ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar(255);
    END IF;
END $$;

-- Agregar email_verification_expires si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='email_verification_expires') THEN
        ALTER TABLE "users" ADD COLUMN "email_verification_expires" timestamp;
    END IF;
END $$;

-- ============================================
-- CAMPOS DE ONBOARDING
-- ============================================

-- Agregar onboarding_completed si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='onboarding_completed') THEN
        ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT false;
    END IF;
END $$;

-- Agregar onboarding_step si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='onboarding_step') THEN
        ALTER TABLE "users" ADD COLUMN "onboarding_step" varchar(50);
    END IF;
END $$;

-- Agregar onboarding_data si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='onboarding_data') THEN
        ALTER TABLE "users" ADD COLUMN "onboarding_data" jsonb;
    END IF;
END $$;

-- Agregar onboarding_started_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='onboarding_started_at') THEN
        ALTER TABLE "users" ADD COLUMN "onboarding_started_at" timestamp;
    END IF;
END $$;

-- Agregar onboarding_completed_at si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='onboarding_completed_at') THEN
        ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp;
    END IF;
END $$;

-- ============================================
-- CAMPOS ADICIONALES DE PERFIL
-- ============================================

-- Agregar username si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='username') THEN
        ALTER TABLE "users" ADD COLUMN "username" varchar(30);
    END IF;
END $$;

-- Agregar short_bio si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='short_bio') THEN
        ALTER TABLE "users" ADD COLUMN "short_bio" varchar(100);
    END IF;
END $$;

-- Agregar interested_categories si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='interested_categories') THEN
        ALTER TABLE "users" ADD COLUMN "interested_categories" integer[];
    END IF;
END $$;

-- Agregar interested_tags si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='interested_tags') THEN
        ALTER TABLE "users" ADD COLUMN "interested_tags" text[];
    END IF;
END $$;

-- ============================================
-- ÍNDICES
-- ============================================

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS "users_email_verified_idx" ON "users" ("email_verified");
CREATE INDEX IF NOT EXISTS "users_onboarding_completed_idx" ON "users" ("onboarding_completed");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");
CREATE INDEX IF NOT EXISTS "users_email_verification_token_idx" ON "users" ("email_verification_token");

-- ============================================
-- CONSTRAINT UNIQUE PARA USERNAME
-- ============================================

-- Agregar constraint unique para username si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_unique'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
    END IF;
END $$;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON COLUMN "users"."email_verified" IS 'Indica si el email del usuario ha sido verificado';
COMMENT ON COLUMN "users"."email_verification_token" IS 'Token para verificación de email';
COMMENT ON COLUMN "users"."email_verification_expires" IS 'Fecha de expiración del token de verificación';
COMMENT ON COLUMN "users"."onboarding_completed" IS 'Indica si el usuario completó el proceso de onboarding';
COMMENT ON COLUMN "users"."onboarding_step" IS 'Paso actual del onboarding';
COMMENT ON COLUMN "users"."onboarding_data" IS 'Datos temporales del proceso de onboarding';
COMMENT ON COLUMN "users"."username" IS 'Nombre de usuario único';
COMMENT ON COLUMN "users"."short_bio" IS 'Biografía corta (máx 100 caracteres)';
COMMENT ON COLUMN "users"."interested_categories" IS 'Categorías de interés del usuario';
COMMENT ON COLUMN "users"."interested_tags" IS 'Tags de interés del usuario';

-- ============================================
-- ACTUALIZAR USUARIOS EXISTENTES
-- ============================================

-- Marcar usuarios existentes como que ya completaron onboarding
-- (para no forzarlos a pasar por el proceso)
UPDATE "users" 
SET 
    "onboarding_completed" = true,
    "onboarding_completed_at" = CURRENT_TIMESTAMP,
    "email_verified" = COALESCE("is_verified", false)
WHERE "onboarding_completed" IS NULL OR "onboarding_completed" = false;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '📊 Campos agregados a la tabla users';
    RAISE NOTICE '🔒 Usuarios existentes marcados como onboarding completado';
END $$;
