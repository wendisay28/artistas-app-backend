-- Migración para agregar campos de onboarding y verificación de email
-- Fecha: 2025-10-20

-- Agregar campos de verificación de email a la tabla users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires" timestamp;

-- Agregar campos de onboarding
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_step" varchar(50);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_data" jsonb;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_started_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamp;

-- Agregar campos adicionales para el perfil
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" varchar(30) UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "short_bio" varchar(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interested_categories" integer[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interested_tags" text[];

-- Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS "users_email_verified_idx" ON "users" ("email_verified");
CREATE INDEX IF NOT EXISTS "users_onboarding_completed_idx" ON "users" ("onboarding_completed");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");
CREATE INDEX IF NOT EXISTS "users_email_verification_token_idx" ON "users" ("email_verification_token");

-- Comentarios
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
