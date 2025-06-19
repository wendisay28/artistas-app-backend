-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS event_occurrences CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  display_name VARCHAR(255),
  profile_image_url VARCHAR(255),
  cover_image_url VARCHAR(255),
  user_type VARCHAR(20) NOT NULL DEFAULT 'general',
  bio TEXT,
  city VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  website VARCHAR(255),
  social_media JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  fan_count INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  last_active TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create companies table
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(255),
  cover_image_url VARCHAR(255),
  website VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  coordinates JSONB,
  social_media JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create venues table
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  coordinates JSONB,
  capacity INTEGER,
  amenities TEXT[],
  images TEXT[],
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table (without foreign key constraints initially)
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  organizer_id VARCHAR(255) NOT NULL,
  company_id INTEGER,
  venue_id INTEGER,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(300),
  category_id INTEGER,
  subcategories TEXT[],
  tags TEXT[],
  event_type VARCHAR(20),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  timezone VARCHAR(50) DEFAULT 'America/Bogota',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  location_type VARCHAR(10) DEFAULT 'physical',
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  coordinates JSONB,
  online_event_url VARCHAR(255),
  venue_name VARCHAR(255),
  venue_description TEXT,
  venue_capacity INTEGER,
  is_outdoor BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  ticket_price NUMERIC(10,2),
  ticket_url VARCHAR(255),
  capacity INTEGER,
  available_tickets INTEGER,
  featured_image VARCHAR(255),
  gallery JSONB DEFAULT '[]',
  video_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Create index on frequently queried columns
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_company_id ON events(company_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);

-- Create event_occurrences table
CREATE TABLE event_occurrences (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for event_occurrences
CREATE INDEX idx_event_occurrences_event_id ON event_occurrences(event_id);
CREATE INDEX idx_event_occurrences_start_date ON event_occurrences(start_date);

-- Create artists table
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  artist_name VARCHAR(255) NOT NULL,
  stage_name VARCHAR(255),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  subcategories TEXT[],
  tags TEXT[],
  artist_type VARCHAR(20),
  presentation_type TEXT[],
  service_types TEXT[],
  description TEXT,
  bio TEXT,
  profile_image_url VARCHAR(255),
  cover_image_url VARCHAR(255),
  social_media JSONB,
  website VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  coordinates JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create index for artists
CREATE INDEX idx_artists_user_id ON artists(user_id);
CREATE INDEX idx_artists_category_id ON artists(category_id);

-- Create blog_posts table
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  author_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for blog_posts
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);

-- Insert initial categories if they don't exist
INSERT INTO categories (name, description) VALUES 
  ('Música', 'Eventos musicales en vivo'),
  ('Arte', 'Exposiciones y eventos artísticos'),
  ('Teatro', 'Obras de teatro y artes escénicas'),
  ('Deportes', 'Eventos deportivos'),
  ('Gastronomía', 'Eventos y festivales gastronómicos'),
  ('Conferencias', 'Conferencias y charlas'),
  ('Talleres', 'Talleres y cursos'),
  ('Familias', 'Eventos familiares'),
  ('Festivales', 'Festivales culturales'),
  ('Otros', 'Otros tipos de eventos')
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraints after all tables are created and data is inserted
ALTER TABLE events 
  ADD CONSTRAINT events_organizer_id_fk 
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE events 
  ADD CONSTRAINT events_company_id_fk 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE events 
  ADD CONSTRAINT events_venue_id_fk 
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;

ALTER TABLE events 
  ADD CONSTRAINT events_category_id_fk 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
