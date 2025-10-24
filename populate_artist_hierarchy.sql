-- Script para crear y poblar las tablas de jerarquía de artistas
-- Ejecutar en Neon SQL Editor

-- ============================================================
-- PASO 1: CREAR TABLAS (si no existen)
-- ============================================================

-- Tabla de Disciplinas (nivel 2 de jerarquía)
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

-- Tabla de Roles (nivel 3 de jerarquía)
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

-- Tabla de Especializaciones (nivel 4 de jerarquía)
CREATE TABLE IF NOT EXISTS specializations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  discipline_id INTEGER NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  proposed_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PASO 2: LIMPIAR DATOS EXISTENTES
-- ============================================================

-- Limpiar las tablas existentes (en orden correcto para evitar errores de FK)
TRUNCATE TABLE specializations CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE disciplines CASCADE;
DELETE FROM categories;

-- Reiniciar secuencias
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE disciplines_id_seq RESTART WITH 1;
ALTER SEQUENCE roles_id_seq RESTART WITH 1;
ALTER SEQUENCE specializations_id_seq RESTART WITH 1;

-- ============================================================
-- CATEGORÍAS
-- ============================================================
INSERT INTO categories (code, name, description) VALUES
('artes-visuales', 'Artes Visuales y Plásticas', 'Pintura, escultura, ilustración y otras artes visuales'),
('artes-escenicas', 'Artes Escénicas', 'Música, danza, teatro y performance'),
('medios-audiovisuales', 'Medios Audiovisuales', 'Cine, televisión, radio y contenido audiovisual'),
('moda-diseno', 'Moda y Diseño', 'Moda, diseño de interiores, arquitectura y diseño de producto'),
('cultura-turismo', 'Cultura y Turismo', 'Turismo cultural, gestión cultural y patrimonio'),
('arte-digital-tecnologia', 'Arte Digital y Tecnología', 'Diseño digital, desarrollo creativo y arte generativo'),
('servicios-creativos', 'Otros Servicios Creativos', 'Representación, gestión, educación y consultoría creativa');

-- ============================================================
-- CATEGORÍA 1: ARTES VISUALES
-- ============================================================

-- Disciplinas de Artes Visuales
INSERT INTO disciplines (code, name, category_id) VALUES
('pintura', 'Pintura', 1),
('escultura', 'Escultura', 1),
('ilustracion', 'Ilustración', 1),
('graffiti', 'Graffiti y Arte Urbano', 1),
('caricatura', 'Caricatura', 1),
('fotografia', 'Fotografía', 1),
('diseno-grafico', 'Diseño Gráfico', 1),
('grabado', 'Grabado', 1),
('ceramica', 'Cerámica', 1),
('arte-corporal', 'Arte Corporal', 1),
('artesania', 'Artesanía', 1);

-- Roles: Pintura
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('pintor', 'Pintor', 1, 1);

-- Especializaciones: Pintor
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('oleo', 'Óleo', 1, 1, 1),
('acuarela', 'Acuarela', 1, 1, 1),
('retrato', 'Retrato', 1, 1, 1),
('mural', 'Mural', 1, 1, 1),
('abstracto', 'Abstracto', 1, 1, 1);

-- Roles: Escultura
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('escultor', 'Escultor', 2, 1);

-- Especializaciones: Escultor
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('piedra', 'Piedra', 2, 2, 1),
('madera', 'Madera', 2, 2, 1),
('metal', 'Metal', 2, 2, 1),
('ceramica', 'Cerámica', 2, 2, 1);

-- Roles: Ilustración
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('ilustrador', 'Ilustrador', 3, 1);

-- Especializaciones: Ilustrador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('editorial', 'Editorial', 3, 3, 1),
('infantil', 'Infantil', 3, 3, 1),
('digital', 'Digital', 3, 3, 1),
('cientifica', 'Científica', 3, 3, 1);

-- Roles: Graffiti
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('graffitero', 'Artista Urbano', 4, 1);

-- Especializaciones: Graffitero
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('graffiti-mural', 'Graffiti mural', 4, 4, 1),
('stencil', 'Stencil', 4, 4, 1),
('comercial', 'Comercial', 4, 4, 1);

-- Roles: Caricatura
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('caricaturista', 'Caricaturista', 5, 1);

-- Especializaciones: Caricaturista
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('eventos', 'Eventos', 5, 5, 1),
('digital-caricatura', 'Digital', 5, 5, 1),
('politico', 'Político', 5, 5, 1);

-- Roles: Fotografía
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('fotografo', 'Fotógrafo', 6, 1);

-- Especializaciones: Fotógrafo
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('bodas', 'Bodas', 6, 6, 1),
('eventos-foto', 'Eventos', 6, 6, 1),
('retrato-foto', 'Retratos', 6, 6, 1),
('comercial-foto', 'Comercial', 6, 6, 1),
('moda-foto', 'Moda', 6, 6, 1),
('producto', 'Producto', 6, 6, 1);

-- Roles: Diseño Gráfico
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('disenador-grafico', 'Diseñador Gráfico', 7, 1);

-- Especializaciones: Diseñador Gráfico
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('branding', 'Branding', 7, 7, 1),
('editorial-diseno', 'Editorial', 7, 7, 1),
('packaging', 'Packaging', 7, 7, 1),
('publicidad', 'Publicidad', 7, 7, 1);

-- Roles: Grabado
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('grabador', 'Grabador', 8, 1);

-- Especializaciones: Grabador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('serigrafia', 'Serigrafía', 8, 8, 1),
('linoleografia', 'Linoleografía', 8, 8, 1),
('litografia', 'Litografía', 8, 8, 1);

-- Roles: Cerámica
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('ceramista', 'Ceramista', 9, 1);

-- Especializaciones: Ceramista
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('utilitaria', 'Utilitaria', 9, 9, 1),
('escultorica', 'Escultórica', 9, 9, 1),
('decorativa', 'Decorativa', 9, 9, 1);

-- Roles: Arte Corporal
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('maquillador-artistico', 'Maquillador Artístico', 10, 1),
('tatuador', 'Tatuador', 10, 1);

-- Especializaciones: Maquillador Artístico
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('efectos-especiales', 'Efectos especiales', 10, 10, 1),
('body-paint', 'Body paint', 10, 10, 1),
('caracterizacion', 'Caracterización', 10, 10, 1);

-- Especializaciones: Tatuador
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('realista', 'Realista', 11, 10, 1),
('tradicional', 'Tradicional', 11, 10, 1),
('minimalista', 'Minimalista', 11, 10, 1);

-- Roles: Artesanía
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('artesano', 'Artesano', 11, 1);

-- Especializaciones: Artesano
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('textil', 'Textil', 12, 11, 1),
('cuero', 'Cuero', 12, 11, 1),
('madera-artesania', 'Madera', 12, 11, 1),
('joyeria', 'Joyería', 12, 11, 1);

-- ============================================================
-- CATEGORÍA 2: ARTES ESCÉNICAS (Muestra parcial)
-- ============================================================

-- Disciplinas de Artes Escénicas
INSERT INTO disciplines (code, name, category_id) VALUES
('musica', 'Música', 2),
('danza', 'Danza', 2),
('teatro', 'Teatro', 2),
('circo', 'Circo', 2),
('magia', 'Magia', 2),
('stand-up', 'Stand-up', 2);

-- Roles: Música
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('musico', 'Músico', 12, 2),
('cantante', 'Cantante', 12, 2),
('dj', 'DJ', 12, 2),
('productor-musical', 'Productor Musical', 12, 2);

-- Especializaciones: Músico
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('banda', 'Músico de banda', 13, 12, 2),
('solista', 'Solista', 13, 12, 2),
('orquesta', 'Músico de orquesta', 13, 12, 2);

-- Especializaciones: Cantante
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('jazz', 'Jazz', 14, 12, 2),
('pop', 'Pop', 14, 12, 2),
('rock', 'Rock', 14, 12, 2),
('clasico', 'Clásico', 14, 12, 2),
('folklore', 'Folklore', 14, 12, 2);

-- Especializaciones: DJ
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('electronica', 'Electrónica', 15, 12, 2),
('hip-hop', 'Hip-hop', 15, 12, 2),
('house', 'House', 15, 12, 2),
('techno', 'Techno', 15, 12, 2);

-- Especializaciones: Productor Musical
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('grabacion', 'Grabación', 16, 12, 2),
('mezcla', 'Mezcla', 16, 12, 2),
('masterizacion', 'Masterización', 16, 12, 2);

-- Roles: Danza
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('bailarin', 'Bailarín', 13, 2),
('coreografo', 'Coreógrafo', 13, 2);

-- Especializaciones: Bailarín
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('ballet', 'Ballet', 17, 13, 2),
('contemporaneo', 'Contemporáneo', 17, 13, 2),
('folklorico', 'Folclórico', 17, 13, 2),
('urbano', 'Urbano', 17, 13, 2);

-- Especializaciones: Coreógrafo
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('espectaculo', 'Espectáculo', 18, 13, 2),
('comercial-danza', 'Comercial', 18, 13, 2),
('contemporaneo-coreo', 'Contemporáneo', 18, 13, 2);

-- Roles: Teatro
INSERT INTO roles (code, name, discipline_id, category_id) VALUES
('actor', 'Actor', 14, 2),
('director-teatro', 'Director de Teatro', 14, 2);

-- Especializaciones: Actor
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('drama', 'Drama', 19, 14, 2),
('comedia', 'Comedia', 19, 14, 2),
('musical', 'Musical', 19, 14, 2);

-- Especializaciones: Director de Teatro
INSERT INTO specializations (code, name, role_id, discipline_id, category_id) VALUES
('clasico-teatro', 'Clásico', 20, 14, 2),
('contemporaneo-teatro', 'Contemporáneo', 20, 14, 2),
('experimental', 'Experimental', 20, 14, 2);

-- Verificar resultados
SELECT 'Categorías insertadas:' as tabla, COUNT(*) as total FROM categories
UNION ALL
SELECT 'Disciplinas insertadas:', COUNT(*) FROM disciplines
UNION ALL
SELECT 'Roles insertados:', COUNT(*) FROM roles
UNION ALL
SELECT 'Especializaciones insertadas:', COUNT(*) FROM specializations;
