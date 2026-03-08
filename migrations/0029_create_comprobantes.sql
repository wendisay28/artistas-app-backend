-- Migration: create comprobantes table
CREATE TABLE IF NOT EXISTS comprobantes (
  id            SERIAL PRIMARY KEY,
  user_id       VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Emisor
  emitter       VARCHAR NOT NULL,
  emitter_nit   VARCHAR NOT NULL,
  emitter_type  VARCHAR NOT NULL,

  -- Cliente
  client        VARCHAR NOT NULL,
  client_nit    VARCHAR NOT NULL,
  client_email  VARCHAR,
  client_city   VARCHAR NOT NULL,

  -- Servicio
  description   TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  tax_rate      INTEGER DEFAULT 0,
  currency      VARCHAR(3) DEFAULT 'COP',

  -- Estado
  status        VARCHAR(20) DEFAULT 'borrador',

  -- Extra
  metadata      JSONB,

  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comprobantes_user_id ON comprobantes(user_id);
