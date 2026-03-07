-- Migración: Agregar campos de Stripe a usuarios
-- Fecha: 2026-03-06
-- Motivo: Integración completa con Stripe Connect

-- Agregar campos de Stripe a users
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_status VARCHAR(20) DEFAULT 'disconnected';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_holder_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_type VARCHAR(10);

-- Restricción para valores válidos de stripe_status
ALTER TABLE users ADD CONSTRAINT check_stripe_status 
  CHECK (stripe_status IN ('disconnected', 'pending', 'connected', 'restricted', 'error') OR stripe_status IS NULL);

-- Restricción para valores válidos de stripe_account_type
ALTER TABLE users ADD CONSTRAINT check_stripe_account_type 
  CHECK (stripe_account_type IN ('individual', 'company') OR stripe_account_type IS NULL);

-- Confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Campos de Stripe agregados exitosamente';
    RAISE NOTICE '💳 stripe_status - Estado de conexión con Stripe';
    RAISE NOTICE '👤 stripe_holder_name - Nombre del titular de cuenta';
    RAISE NOTICE '📧 stripe_email - Email para cuenta Stripe';
    RAISE NOTICE '📱 stripe_phone - Teléfono para verificación';
    RAISE NOTICE '🏢 stripe_account_type - Tipo: individual o company';
    RAISE NOTICE '🔗 stripe_account_id - ID único de cuenta en Stripe';
    RAISE NOTICE '🚀 Portal del Autor ahora tiene integración completa con Stripe';
END $$;
