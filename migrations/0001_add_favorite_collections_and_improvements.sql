-- Crear tabla de colecciones de favoritos
CREATE TABLE "favorite_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"is_private" boolean DEFAULT false,
	"color" varchar DEFAULT '#3b82f6',
	"icon" varchar,
	"item_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Agregar campos a la tabla favorites
ALTER TABLE "favorites" ADD COLUMN "collection_id" integer;
--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "notes" text;
--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint

-- Crear tabla de preferencias de usuario
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"favorite_categories" text[] DEFAULT '{}',
	"interests" text[] DEFAULT '{}',
	"price_range" jsonb,
	"preferred_locations" text[] DEFAULT '{}',
	"notification_preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint

-- Crear tabla de analytics de perfil
CREATE TABLE "profile_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"date" date NOT NULL,
	"profile_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"clicks_on_contact" integer DEFAULT 0,
	"clicks_on_social" integer DEFAULT 0,
	"favorite_adds" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"average_time_on_profile" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Agregar foreign keys
ALTER TABLE "favorite_collections" ADD CONSTRAINT "favorite_collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_collection_id_favorite_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "favorite_collections"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_analytics" ADD CONSTRAINT "profile_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Crear índices para mejorar el rendimiento
CREATE INDEX "idx_favorite_collections_user_id" ON "favorite_collections"("user_id");
--> statement-breakpoint
CREATE INDEX "idx_favorites_collection_id" ON "favorites"("collection_id");
--> statement-breakpoint
CREATE INDEX "idx_favorites_user_id" ON "favorites"("user_id");
--> statement-breakpoint
CREATE INDEX "idx_profile_analytics_user_date" ON "profile_analytics"("user_id", "date");
