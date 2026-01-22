-- Migration: Add post_type field to support both regular posts and blog posts
-- Date: 2026-01-14

-- Step 1: Drop existing foreign key constraints
ALTER TABLE "collection_items" DROP CONSTRAINT IF EXISTS "collection_items_post_id_fkey";
ALTER TABLE "inspirations" DROP CONSTRAINT IF EXISTS "inspirations_post_id_fkey";

-- Step 2: Drop existing unique indexes
DROP INDEX IF EXISTS "collection_post_idx";
DROP INDEX IF EXISTS "inspiration_user_post_idx";

-- Step 3: Add post_type column to collection_items
ALTER TABLE "collection_items"
ADD COLUMN IF NOT EXISTS "post_type" VARCHAR(20) NOT NULL DEFAULT 'post';

-- Step 4: Add post_type column to inspirations
ALTER TABLE "inspirations"
ADD COLUMN IF NOT EXISTS "post_type" VARCHAR(20) NOT NULL DEFAULT 'post';

-- Step 5: Create new unique indexes including post_type
CREATE UNIQUE INDEX "collection_post_type_idx" ON "collection_items" ("collection_id", "post_id", "post_type");
CREATE UNIQUE INDEX "inspiration_user_post_type_idx" ON "inspirations" ("user_id", "post_id", "post_type");

-- Step 6: Add comments for documentation
COMMENT ON COLUMN "collection_items"."post_type" IS 'Type of post: post (regular posts) or blog (blog posts)';
COMMENT ON COLUMN "inspirations"."post_type" IS 'Type of post: post (regular posts) or blog (blog posts)';
