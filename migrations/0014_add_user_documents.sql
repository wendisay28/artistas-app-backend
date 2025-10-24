-- Migración para agregar tabla de documentos de usuario
-- Fecha: 2025-10-23

-- Crear tabla de documentos de usuario
CREATE TABLE IF NOT EXISTS user_documents (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'id', 'tax', 'contract', 'certification'
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- Tamaño en bytes
  mime_type VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  rejection_reason TEXT, -- Razón de rechazo si aplica
  expiry_date TIMESTAMP, -- Fecha de expiración si aplica
  reviewed_by VARCHAR REFERENCES users(id) ON DELETE SET NULL, -- Admin que revisó
  reviewed_at TIMESTAMP, -- Fecha de revisión
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX idx_user_documents_type ON user_documents(document_type);
CREATE INDEX idx_user_documents_status ON user_documents(status);

-- Crear índice único para evitar duplicados del mismo tipo de documento activo
CREATE UNIQUE INDEX idx_user_documents_unique_active
ON user_documents(user_id, document_type)
WHERE status IN ('pending', 'approved');

-- Comentarios para documentación
COMMENT ON TABLE user_documents IS 'Almacena los documentos de verificación y contratación de usuarios';
COMMENT ON COLUMN user_documents.document_type IS 'Tipo de documento: id (identificación), tax (fiscal), contract (contrato), certification (certificación)';
COMMENT ON COLUMN user_documents.status IS 'Estado del documento: pending, approved, rejected, expired';
