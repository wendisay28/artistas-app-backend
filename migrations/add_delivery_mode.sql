-- Migración: Agregar modo de entrega a usuarios
-- Fecha: 2026-03-06
-- Motivo: Persistir selección de modo de entrega desde Portal del Autor

-- Agregar campo delivery_mode a users
ALTER TABLE users ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(20) DEFAULT NULL;

-- Validar que solo acepte valores permitidos
ALTER TABLE users ADD CONSTRAINT check_delivery_mode 
  CHECK (delivery_mode IN ('presencial', 'digital', 'hibrido') OR delivery_mode IS NULL);

-- Confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Campo delivery_mode agregado exitosamente';
    RAISE NOTICE '📦 Valores permitidos: presencial, digital, hibrido';
    RAISE NOTICE '🔄 Portal del Autor ahora persistirá modo de entrega';
END $$;
