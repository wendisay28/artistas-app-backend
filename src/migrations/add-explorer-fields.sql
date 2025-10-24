-- Migration: Add Explorer Fields
-- Description: Agrega campos necesarios para integrar perfiles con el explorador
-- Date: 2025-01-16

-- ============================================================================
-- 1. EXPANDIR TABLA USERS CON CAMPOS DEL EXPLORADOR
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS profession VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS price_min NUMERIC(10, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS price_max NUMERIC(10, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS response_time VARCHAR(50) DEFAULT '1-2 días';
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{"Español"}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_in_explorer BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS projects_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- ============================================================================
-- 2. CREAR TABLA DE SERVICIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  duration VARCHAR(50),
  category VARCHAR(100),
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- ============================================================================
-- 3. EXPANDIR TABLA EVENTS PARA EXPLORADOR
-- ============================================================================

-- Agregar campo para relacionar con el usuario propietario
ALTER TABLE events ADD COLUMN IF NOT EXISTS owner_user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE;

-- Agregar campos faltantes si no existen
ALTER TABLE events ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS time VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS distance VARCHAR(20);
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_in_explorer BOOLEAN DEFAULT true;

-- Índices para búsquedas en explorador
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_owner_user_id ON events(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_events_show_in_explorer ON events(show_in_explorer) WHERE show_in_explorer = true;

-- ============================================================================
-- 4. CREAR TABLA DE ARTWORKS/OBRAS DE ARTE
-- ============================================================================

CREATE TABLE IF NOT EXISTS artworks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('pintura', 'escultura', 'libro', 'fotografía', 'digital', 'otro')),
  images TEXT[] DEFAULT '{}',
  price NUMERIC(10, 2),
  dimensions VARCHAR(100),
  materials TEXT[] DEFAULT '{}',
  year INTEGER,
  available BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 1,
  city VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  show_in_explorer BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas en explorador
CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_available ON artworks(available);
CREATE INDEX IF NOT EXISTS idx_artworks_show_in_explorer ON artworks(show_in_explorer) WHERE show_in_explorer = true;
CREATE INDEX IF NOT EXISTS idx_artworks_city ON artworks(city);
CREATE INDEX IF NOT EXISTS idx_artworks_price ON artworks(price);

-- ============================================================================
-- 5. EXPANDIR TABLA VENUES PARA EXPLORADOR
-- ============================================================================

ALTER TABLE venues ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS distance VARCHAR(20);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS show_in_explorer BOOLEAN DEFAULT true;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Índices para búsquedas en explorador
-- CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);  -- Comentado: verificar si existe
CREATE INDEX IF NOT EXISTS idx_venues_show_in_explorer ON venues(show_in_explorer) WHERE show_in_explorer = true;
CREATE INDEX IF NOT EXISTS idx_venues_price ON venues(price);

-- ============================================================================
-- 6. EXPANDIR TABLA ARTISTS PARA EXPLORADOR
-- ============================================================================

ALTER TABLE artists ADD COLUMN IF NOT EXISTS show_in_explorer BOOLEAN DEFAULT true;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS distance VARCHAR(20);

-- Índices para búsquedas en explorador
CREATE INDEX IF NOT EXISTS idx_artists_show_in_explorer ON artists(show_in_explorer) WHERE show_in_explorer = true;
-- CREATE INDEX IF NOT EXISTS idx_artists_base_city ON artists(base_city);  -- Comentado: verificar si existe
-- CREATE INDEX IF NOT EXISTS idx_artists_rating ON artists(rating);  -- Comentado: verificar si existe

-- ============================================================================
-- 7. EXPANDIR TABLA COMPANIES PARA EXPLORADOR
-- ============================================================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS show_in_explorer BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS distance VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS profession VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Índices para búsquedas en explorador
CREATE INDEX IF NOT EXISTS idx_companies_show_in_explorer ON companies(show_in_explorer) WHERE show_in_explorer = true;
-- CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);  -- Comentado: verificar si existe
-- CREATE INDEX IF NOT EXISTS idx_companies_rating ON companies(rating);  -- Comentado: verificar si existe

-- ============================================================================
-- 8. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a las tablas nuevas
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artworks_updated_at ON artworks;
CREATE TRIGGER update_artworks_updated_at
  BEFORE UPDATE ON artworks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. INSERTAR DATOS DE PRUEBA (OPCIONAL - COMENTADO)
-- ============================================================================

-- Puedes descomentar esto para agregar datos de prueba
/*
-- Ejemplo de servicio
INSERT INTO services (user_id, name, description, price, duration, category, images)
VALUES (
  'user-id-ejemplo',
  'Ilustración Digital Personalizada',
  'Creo ilustraciones digitales únicas para tus proyectos',
  120000,
  '2-3 días',
  'Ilustración',
  ARRAY['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
);

-- Ejemplo de artwork
INSERT INTO artworks (user_id, name, description, category, images, price, dimensions, year, city, tags)
VALUES (
  'user-id-ejemplo',
  'Atardecer en los Andes',
  'Pintura al óleo que captura la majestuosidad de los Andes colombianos',
  'pintura',
  ARRAY['https://example.com/painting1.jpg'],
  2500000,
  '80 x 60 cm',
  2023,
  'Bogotá',
  ARRAY['Óleo', 'Paisaje', 'Arte Colombiano']
);
*/

-- ============================================================================
-- 10. COMENTARIOS EN LAS TABLAS
-- ============================================================================

COMMENT ON TABLE services IS 'Servicios ofrecidos por artistas y empresas';
COMMENT ON TABLE artworks IS 'Obras de arte disponibles para compra o exhibición';
COMMENT ON COLUMN users.show_in_explorer IS 'Si el usuario aparece en el explorador público';
COMMENT ON COLUMN events.show_in_explorer IS 'Si el evento aparece en el explorador público';
COMMENT ON COLUMN artworks.show_in_explorer IS 'Si la obra aparece en el explorador público';
