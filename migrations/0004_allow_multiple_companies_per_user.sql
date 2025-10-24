-- Eliminar constraint UNIQUE en companies.user_id para permitir múltiples empresas por usuario
-- Un usuario puede administrar varias empresas

-- Primero, eliminar el constraint único
ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_user_id_unique";

-- Crear un índice para mejorar el rendimiento de búsquedas por user_id
CREATE INDEX IF NOT EXISTS "companies_user_id_idx" ON "companies" ("user_id");

-- Agregar campo para indicar si es la empresa principal del usuario
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false;

-- Comentarios para documentación
COMMENT ON COLUMN "companies"."user_id" IS 'Usuario que administra esta empresa. Un usuario puede tener múltiples empresas.';
COMMENT ON COLUMN "companies"."is_primary" IS 'Indica si esta es la empresa principal del usuario para mostrar por defecto.';
