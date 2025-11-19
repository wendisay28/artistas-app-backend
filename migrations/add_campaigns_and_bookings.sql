-- Migración: Agregar tablas de campaigns y bookings para empresas
-- Fecha: 2025-01-18

-- Tabla de campañas de empresas (marketing, colaboración, UGC)
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Información básica
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(300),

  -- Tipo de campaña
  campaign_type VARCHAR CHECK (campaign_type IN ('paid', 'collaboration', 'ugc', 'sponsorship', 'other')) NOT NULL,

  -- Detalles de compensación
  compensation_type VARCHAR CHECK (compensation_type IN ('paid', 'free_product', 'free_service', 'discount', 'mixed', 'none')),
  budget NUMERIC(12, 2),
  compensation_details TEXT,

  -- Requisitos y deliverables
  requirements JSONB DEFAULT '[]',
  deliverables JSONB DEFAULT '[]',
  target_audience TEXT,
  platforms TEXT[] DEFAULT '{}',

  -- Fechas
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  application_deadline TIMESTAMP,

  -- Ubicación (si aplica)
  location_type VARCHAR CHECK (location_type IN ('online', 'physical', 'hybrid')) DEFAULT 'online',
  location TEXT,
  city VARCHAR,

  -- Multimedia
  featured_image VARCHAR,
  gallery JSONB DEFAULT '[]',

  -- Configuración
  max_participants INTEGER,
  min_followers INTEGER,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Estado
  status VARCHAR CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
  is_public BOOLEAN DEFAULT TRUE,

  -- Estadísticas
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,

  -- Timestamps
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de aplicaciones a campañas
CREATE TABLE IF NOT EXISTS campaign_applications (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Propuesta del aplicante
  message TEXT NOT NULL,
  portfolio TEXT,
  social_links JSONB DEFAULT '{}',
  expected_delivery TIMESTAMP,

  -- Información del aplicante
  follower_count JSONB DEFAULT '{}',
  previous_work JSONB DEFAULT '[]',

  -- Estado de la aplicación
  status VARCHAR CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
  company_notes TEXT,

  -- Timestamps
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Índice único para prevenir aplicaciones duplicadas
  UNIQUE(campaign_id, user_id)
);

-- Tabla de reservas/bookings para espacios de empresas
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Información básica
  booking_type VARCHAR CHECK (booking_type IN ('event', 'meeting', 'workshop', 'exhibition', 'rental', 'other')) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Fechas y horarios
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  setup_time INTEGER,
  cleanup_time INTEGER,

  -- Espacio reservado
  room_name VARCHAR,
  expected_attendees INTEGER,

  -- Servicios adicionales
  services JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',

  -- Información de contacto
  contact_name VARCHAR NOT NULL,
  contact_email VARCHAR NOT NULL,
  contact_phone VARCHAR,

  -- Costos
  base_price NUMERIC(10, 2),
  services_price NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2),
  deposit NUMERIC(10, 2),
  deposit_paid BOOLEAN DEFAULT FALSE,

  -- Pago
  payment_status VARCHAR CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')) DEFAULT 'pending',
  payment_method VARCHAR,
  payment_id VARCHAR,

  -- Estado de la reserva
  status VARCHAR CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')) DEFAULT 'pending',
  cancellation_reason TEXT,

  -- Notas
  client_notes TEXT,
  company_notes TEXT,

  -- Timestamps
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign_id ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_user_id ON campaign_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON campaign_applications(status);
CREATE INDEX IF NOT EXISTS idx_bookings_company_id ON bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

-- Comentarios para documentación
COMMENT ON TABLE campaigns IS 'Campañas de marketing de empresas: pagas, colaboración, UGC, sponsorship';
COMMENT ON TABLE campaign_applications IS 'Aplicaciones de usuarios a campañas de empresas';
COMMENT ON TABLE bookings IS 'Reservas de espacios/lugares de empresas';
