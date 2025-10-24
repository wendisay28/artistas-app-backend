-- Migración: Eliminar sistema de favoritos y agregar sistema de contrataciones
-- Fecha: 2025-10-17

-- Eliminar tablas de favoritos
DROP TABLE IF EXISTS "favorites" CASCADE;
DROP TABLE IF EXISTS "favorite_collections" CASCADE;

-- Crear tabla de contrataciones del usuario
CREATE TABLE "user_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"artist_id" varchar NOT NULL,
	"service_id" integer,
	"service_type" varchar NOT NULL,
	"service_name" varchar NOT NULL,
	"description" text,
	"amount" numeric(10, 2),
	"status" varchar DEFAULT 'pending' NOT NULL,
	"contract_date" timestamp DEFAULT CURRENT_TIMESTAMP,
	"service_date" timestamp,
	"completion_date" timestamp,
	"rating" integer,
	"review" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Crear tabla de solicitudes de cotización
CREATE TABLE "user_quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"artist_id" varchar NOT NULL,
	"service_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"budget_min" numeric(10, 2),
	"budget_max" numeric(10, 2),
	"preferred_date" timestamp,
	"location" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"quoted_amount" numeric(10, 2),
	"artist_response" text,
	"response_date" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

-- Agregar foreign keys
ALTER TABLE "user_contracts" ADD CONSTRAINT "user_contracts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_contracts" ADD CONSTRAINT "user_contracts_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_quotations" ADD CONSTRAINT "user_quotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_quotations" ADD CONSTRAINT "user_quotations_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Crear índices para mejorar el rendimiento
CREATE INDEX "idx_user_contracts_user_id" ON "user_contracts"("user_id");
--> statement-breakpoint
CREATE INDEX "idx_user_contracts_artist_id" ON "user_contracts"("artist_id");
--> statement-breakpoint
CREATE INDEX "idx_user_contracts_status" ON "user_contracts"("status");
--> statement-breakpoint
CREATE INDEX "idx_user_quotations_user_id" ON "user_quotations"("user_id");
--> statement-breakpoint
CREATE INDEX "idx_user_quotations_artist_id" ON "user_quotations"("artist_id");
--> statement-breakpoint
CREATE INDEX "idx_user_quotations_status" ON "user_quotations"("status");
