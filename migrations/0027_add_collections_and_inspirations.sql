-- ============================================================================
-- Collections System - Pinterest-style collections for posts
-- ============================================================================

-- Tabla de colecciones de posts (estilo Pinterest)
CREATE TABLE IF NOT EXISTS "collections" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "is_public" BOOLEAN DEFAULT FALSE,
  "cover_image_url" VARCHAR,
  "item_count" INTEGER DEFAULT 0,
  "view_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items guardados en colecciones
CREATE TABLE IF NOT EXISTS "collection_items" (
  "id" SERIAL PRIMARY KEY,
  "collection_id" INTEGER NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
  "post_id" INTEGER NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "notes" TEXT,
  "added_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice único para evitar duplicados en collection_items
CREATE UNIQUE INDEX IF NOT EXISTS "collection_post_idx" ON "collection_items" ("collection_id", "post_id");

-- ============================================================================
-- Inspiration System - For artists to save references and inspirations
-- ============================================================================

-- Tabla de inspiraciones/referencias para artistas
CREATE TABLE IF NOT EXISTS "inspirations" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "post_id" INTEGER NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "inspiration_note" TEXT,
  "tags" TEXT[] DEFAULT '{}',
  "inspiration_type" VARCHAR CHECK ("inspiration_type" IS NULL OR "inspiration_type" IN ('technique', 'composition', 'color', 'style', 'concept', 'other')),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice único para evitar duplicados en inspirations
CREATE UNIQUE INDEX IF NOT EXISTS "inspiration_user_post_idx" ON "inspirations" ("user_id", "post_id");

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "collections_user_id_idx" ON "collections" ("user_id");
CREATE INDEX IF NOT EXISTS "collection_items_collection_id_idx" ON "collection_items" ("collection_id");
CREATE INDEX IF NOT EXISTS "collection_items_post_id_idx" ON "collection_items" ("post_id");
CREATE INDEX IF NOT EXISTS "inspirations_user_id_idx" ON "inspirations" ("user_id");
CREATE INDEX IF NOT EXISTS "inspirations_post_id_idx" ON "inspirations" ("post_id");
