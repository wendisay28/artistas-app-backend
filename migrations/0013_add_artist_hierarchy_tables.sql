-- Migration: Add hierarchical artist categorization system
-- Fecha: 2025-01-XX
-- Descripción: Agrega tablas para Disciplina, Rol, Especialización, TADs y Stats

-- ============================================
-- STEP 1: Crear tabla de Disciplinas
-- ============================================
CREATE TABLE IF NOT EXISTS disciplines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disciplines_category ON disciplines(category_id);
CREATE INDEX idx_disciplines_code ON disciplines(code);

-- ============================================
-- STEP 2: Crear tabla de Roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  discipline_id INTEGER NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_discipline ON roles(discipline_id);
CREATE INDEX idx_roles_category ON roles(category_id);
CREATE INDEX idx_roles_code ON roles(code);

-- ============================================
-- STEP 3: Crear tabla de Especializaciones
-- ============================================
CREATE TABLE IF NOT EXISTS specializations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  discipline_id INTEGER NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  is_custom BOOLEAN DEFAULT FALSE, -- Permite especializaciones propuestas por usuarios
  is_approved BOOLEAN DEFAULT FALSE, -- Requiere aprobación de admin si es custom
  proposed_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_specializations_role ON specializations(role_id);
CREATE INDEX idx_specializations_discipline ON specializations(discipline_id);
CREATE INDEX idx_specializations_category ON specializations(category_id);
CREATE INDEX idx_specializations_code ON specializations(code);
CREATE INDEX idx_specializations_approved ON specializations(is_approved);

-- ============================================
-- STEP 4: Crear tabla de TADs (Talentos Adicionales)
-- ============================================
CREATE TABLE IF NOT EXISTS tads (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  suggested_discipline_id INTEGER NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0, -- Orden de sugerencia (mayor = más importante)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tads_role ON tads(role_id);
CREATE INDEX idx_tads_discipline ON tads(suggested_discipline_id);

-- ============================================
-- STEP 5: Crear tabla de Stats sugeridos por Rol
-- ============================================
CREATE TABLE IF NOT EXISTS role_stats (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  stat_key VARCHAR(100) NOT NULL, -- ej: 'rango_vocal', 'software_principal'
  stat_label VARCHAR(255) NOT NULL, -- ej: 'Rango Vocal', 'Software Principal'
  stat_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'select', 'multiselect', 'range'
  stat_options JSONB, -- Para 'select' o 'multiselect': ["Opción 1", "Opción 2"]
  is_required BOOLEAN DEFAULT FALSE,
  placeholder VARCHAR(255),
  help_text TEXT,
  validation_rules JSONB, -- { min: 0, max: 100, pattern: "regex" }
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_role_stats_role ON role_stats(role_id);
CREATE UNIQUE INDEX idx_role_stats_unique ON role_stats(role_id, stat_key);

-- ============================================
-- STEP 6: Actualizar tabla de Artists
-- ============================================
-- Agregar columnas para la nueva estructura jerárquica
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS discipline_id INTEGER REFERENCES disciplines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS specialization_id INTEGER REFERENCES specializations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS additional_talents INTEGER[] DEFAULT '{}', -- Array de discipline_ids (TADs)
  ADD COLUMN IF NOT EXISTS custom_stats JSONB DEFAULT '{}'; -- { stat_key: value, ... }

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_artists_discipline ON artists(discipline_id);
CREATE INDEX IF NOT EXISTS idx_artists_role ON artists(role_id);
CREATE INDEX IF NOT EXISTS idx_artists_specialization ON artists(specialization_id);

-- ============================================
-- STEP 7: Tabla de propuestas de TADs personalizados
-- ============================================
CREATE TABLE IF NOT EXISTS custom_tad_proposals (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  proposed_discipline_name VARCHAR(255) NOT NULL,
  justification TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_tad_user ON custom_tad_proposals(user_id);
CREATE INDEX idx_custom_tad_role ON custom_tad_proposals(role_id);
CREATE INDEX idx_custom_tad_status ON custom_tad_proposals(status);

-- ============================================
-- STEP 8: Tabla de propuestas de Especializaciones personalizadas
-- ============================================
CREATE TABLE IF NOT EXISTS custom_specialization_proposals (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  proposed_name VARCHAR(255) NOT NULL,
  proposed_code VARCHAR(100) NOT NULL,
  description TEXT,
  justification TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_spec_user ON custom_specialization_proposals(user_id);
CREATE INDEX idx_custom_spec_role ON custom_specialization_proposals(role_id);
CREATE INDEX idx_custom_spec_status ON custom_specialization_proposals(status);

-- ============================================
-- STEP 9: Comentarios para documentación
-- ============================================
COMMENT ON TABLE disciplines IS 'Disciplinas dentro de cada categoría de arte (ej: Música dentro de Artes Escénicas)';
COMMENT ON TABLE roles IS 'Roles específicos dentro de cada disciplina (ej: Cantante dentro de Música)';
COMMENT ON TABLE specializations IS 'Especializaciones de cada rol (ej: Jazz, Pop dentro de Cantante)';
COMMENT ON TABLE tads IS 'TADs: Talentos Adicionales sugeridos por rol (otras disciplinas recomendadas)';
COMMENT ON TABLE role_stats IS 'Estadísticas/campos personalizados por rol (ej: rango_vocal para Cantantes)';
COMMENT ON TABLE custom_tad_proposals IS 'Propuestas de usuarios para nuevos TADs que requieren aprobación de admin';
COMMENT ON TABLE custom_specialization_proposals IS 'Propuestas de usuarios para nuevas especializaciones que requieren aprobación de admin';

COMMENT ON COLUMN artists.discipline_id IS 'Disciplina principal del artista (nivel 2 de jerarquía)';
COMMENT ON COLUMN artists.role_id IS 'Rol principal del artista (nivel 3 de jerarquía)';
COMMENT ON COLUMN artists.specialization_id IS 'Especialización del artista (nivel 4 de jerarquía)';
COMMENT ON COLUMN artists.additional_talents IS 'TADs: IDs de disciplinas adicionales en las que el artista tiene talento';
COMMENT ON COLUMN artists.custom_stats IS 'Estadísticas personalizadas basadas en el rol (ej: { "rango_vocal": "Tenor", "software_principal": "Ableton Live" })';
