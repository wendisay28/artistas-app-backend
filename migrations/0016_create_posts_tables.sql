-- Migración para crear las tablas de posts y post_media
-- Fecha: 2025-11-17

-- Crear el enum para el tipo de post
DO $$ BEGIN
  CREATE TYPE post_type AS ENUM ('post', 'nota', 'blog');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear la tabla de posts
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type post_type NOT NULL DEFAULT 'post',
  is_pinned BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear la tabla de multimedia de posts
CREATE TABLE IF NOT EXISTS post_media (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url VARCHAR(1024) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document'
  thumbnail_url VARCHAR(1024),
  "order" INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);

-- Comentarios descriptivos
COMMENT ON TABLE posts IS 'Tabla principal para almacenar posts, notas y blogs de usuarios';
COMMENT ON TABLE post_media IS 'Tabla para almacenar archivos multimedia asociados a posts';
COMMENT ON COLUMN posts.type IS 'Tipo de publicación: post (publicación estándar), nota (nota rápida), blog (artículo largo)';
COMMENT ON COLUMN post_media.type IS 'Tipo de archivo multimedia: image, video, document';
