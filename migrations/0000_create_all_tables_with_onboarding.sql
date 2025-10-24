-- Crear todas las tablas desde cero con campos de onboarding incluidos
-- Fecha: 2025-10-20

-- ============================================
-- TABLA CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS "categories" (
  "id" serial PRIMARY KEY,
  "name" varchar NOT NULL,
  "description" text,
  "icon" varchar,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA USERS (con campos de onboarding)
-- ============================================
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY,
  "email" varchar NOT NULL UNIQUE,
  "password" varchar,
  "first_name" varchar,
  "last_name" varchar,
  "display_name" varchar,
  "profile_image_url" varchar,
  "cover_image_url" varchar,
  "user_type" varchar NOT NULL DEFAULT 'general',
  "bio" text,
  "city" varchar,
  "address" text,
  "phone" varchar,
  "website" varchar,
  "social_media" jsonb,
  "is_verified" boolean DEFAULT false,
  "is_featured" boolean DEFAULT false,
  "is_available" boolean DEFAULT true,
  "rating" numeric(3, 2) DEFAULT 0.00,
  "total_reviews" integer DEFAULT 0,
  "fan_count" integer DEFAULT 0,
  "preferences" jsonb DEFAULT '{}',
  "settings" jsonb DEFAULT '{}',
  "last_active" timestamp,
  
  -- Campos de verificación de email
  "email_verified" boolean DEFAULT false,
  "email_verification_token" varchar(255),
  "email_verification_expires" timestamp,
  
  -- Campos de onboarding
  "onboarding_completed" boolean DEFAULT false,
  "onboarding_step" varchar(50),
  "onboarding_data" jsonb,
  "onboarding_started_at" timestamp,
  "onboarding_completed_at" timestamp,
  
  -- Campos adicionales de perfil
  "username" varchar(30) UNIQUE,
  "short_bio" varchar(100),
  "interested_categories" integer[],
  "interested_tags" text[],
  
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Índices para users
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_email_verified_idx" ON "users" ("email_verified");
CREATE INDEX IF NOT EXISTS "users_onboarding_completed_idx" ON "users" ("onboarding_completed");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");
CREATE INDEX IF NOT EXISTS "users_user_type_idx" ON "users" ("user_type");

-- ============================================
-- TABLA ARTISTS
-- ============================================
CREATE TABLE IF NOT EXISTS "artists" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "category_id" integer REFERENCES "categories"("id"),
  "subcategories" text[],
  "tags" text[],
  "gallery" text[],
  "availability" jsonb,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA COMPANIES
-- ============================================
CREATE TABLE IF NOT EXISTS "companies" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "company_name" varchar NOT NULL,
  "description" text,
  "category_id" integer REFERENCES "categories"("id"),
  "logo_url" varchar,
  "website" varchar,
  "phone" varchar,
  "email" varchar,
  "address" text,
  "city" varchar,
  "social_media" jsonb,
  "is_primary" boolean DEFAULT false,
  "is_verified" boolean DEFAULT false,
  "rating" numeric(3, 2) DEFAULT 0.00,
  "total_reviews" integer DEFAULT 0,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS "events" (
  "id" serial PRIMARY KEY,
  "title" varchar NOT NULL,
  "slug" varchar UNIQUE,
  "description" text,
  "event_type" varchar,
  "category_id" integer REFERENCES "categories"("id"),
  "organizer_id" varchar REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" integer REFERENCES "companies"("id") ON DELETE CASCADE,
  "location" varchar,
  "address" text,
  "coordinates" jsonb,
  "start_date" timestamp,
  "end_date" timestamp,
  "is_recurring" boolean DEFAULT false,
  "recurrence_pattern" jsonb,
  "price" numeric(10, 2),
  "capacity" integer,
  "status" varchar DEFAULT 'draft',
  "cover_image_url" varchar,
  "gallery" text[],
  "tags" text[],
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA VENUES
-- ============================================
CREATE TABLE IF NOT EXISTS "venues" (
  "id" serial PRIMARY KEY,
  "company_id" integer REFERENCES "companies"("id") ON DELETE CASCADE,
  "name" varchar NOT NULL,
  "description" text,
  "venue_type" varchar,
  "address" text,
  "city" varchar,
  "coordinates" jsonb,
  "capacity" integer,
  "rating" numeric(3, 2) DEFAULT 0.00,
  "total_reviews" integer DEFAULT 0,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA BLOG_POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" serial PRIMARY KEY,
  "author_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar NOT NULL,
  "slug" varchar UNIQUE,
  "content" text NOT NULL,
  "excerpt" text,
  "cover_image_url" varchar,
  "category_id" integer REFERENCES "categories"("id"),
  "tags" text[],
  "published_at" timestamp,
  "views_count" integer DEFAULT 0,
  "likes_count" integer DEFAULT 0,
  "comments_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA BLOG_COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS "blog_comments" (
  "id" serial PRIMARY KEY,
  "post_id" integer NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
  "author_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "parent_id" integer REFERENCES "blog_comments"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" serial PRIMARY KEY,
  "reviewer_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reviewee_id" varchar REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" integer REFERENCES "companies"("id") ON DELETE CASCADE,
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA GALLERY
-- ============================================
CREATE TABLE IF NOT EXISTS "gallery" (
  "id" serial PRIMARY KEY,
  "user_id" varchar REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" integer REFERENCES "companies"("id") ON DELETE CASCADE,
  "image_url" varchar NOT NULL,
  "title" varchar,
  "description" text,
  "order_index" integer DEFAULT 0,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Todas las tablas creadas exitosamente';
    RAISE NOTICE '📊 Tabla users incluye campos de onboarding';
    RAISE NOTICE '🚀 Sistema listo para usar';
END $$;
