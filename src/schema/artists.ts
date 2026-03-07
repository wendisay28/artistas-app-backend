import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { categories, disciplines, roles, specializations } from './hierarchy.js';

export const artists = pgTable('artists', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  // Información básica
  artistName: varchar('artist_name').notNull(),
  stageName: varchar('stage_name'),
  categoryId: integer('category_id').references(() => categories.id),

  // Nueva jerarquía
  disciplineId: integer('discipline_id').references(() => disciplines.id, { onDelete: 'set null' }),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'set null' }),
  specializationId: integer('specialization_id').references(() => specializations.id, { onDelete: 'set null' }),
  additionalTalents: integer('additional_talents').array().default(sql`'{}'`), // Array de discipline_ids (TADs)
  customStats: jsonb('custom_stats').default(sql`'{}'`), // { stat_key: value, ... }

  // Campos legacy (mantener por compatibilidad)
  subcategories: text('subcategories').array().default([]),
  tags: text('tags').array().default([]),
  artistType: varchar('artist_type', { enum: ['solo', 'duo', 'trio', 'band', 'collective'] }),
  presentationType: text('presentation_type').array().default([]), // En vivo, online, grabado
  serviceTypes: text('service_types').array().default([]), // Shows, talleres, etc.

  // Información profesional
  experience: integer('experience'), // Nivel de experiencia: 1=principiante, 2=intermedio, 3=profesional, 4=experto
  yearsOfExperience: integer('years_of_experience'),
  description: text('description'),
  socialMedia: jsonb('social_media').default({}), // 

  // Multimedia
  portfolio: jsonb('portfolio').default({}),
  videoPresentation: varchar('video_presentation_url'),
  gallery: jsonb('gallery').default([]),

  // Ubicación y disponibilidad
  baseCity: varchar('base_city'),
  travelAvailability: boolean('travel_availability').default(false),
  travelDistance: integer('travel_distance'), // en km
  availability: jsonb('availability').default({}), // Disponibilidad por días/horas

  // Precios y servicios
  pricePerHour: numeric('price_per_hour', { precision: 10, scale: 2 }).default(sql`0`),
  priceRange: jsonb('price_range'), // { min: number, max: number, currency: string }
  services: jsonb('services').default(sql`'[]'::jsonb`), // Array de servicios ofrecidos

  // Nuevos campos de pricing
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }), // Tarifa por hora o precio base
  pricingType: varchar('pricing_type', { enum: ['hourly', 'deliverable', 'depends'] }).default('depends'), // Tipo de cobro

  // Información académica y profesional adicional
  education: jsonb('education').default(sql`'[]'::jsonb`), // Array de { degree, institution, year }
  languages: jsonb('languages').default(sql`'[]'::jsonb`), // Array de { language, level }
  licenses: jsonb('licenses').default(sql`'[]'::jsonb`), // Array de { name, issuer, date }
  certifications: jsonb('certifications').default(sql`'[]'::jsonb`), // Array de { name, issuer, date }
  linkedAccounts: jsonb('linked_accounts').default(sql`'{}'::jsonb`), // { instagram, behance, linkedin, website }
  workExperience: jsonb('work_experience').default(sql`'[]'::jsonb`), // Array de { position, company, startYear, endYear, description }

  // Estadísticas
  rating: numeric('rating', { precision: 3, scale: 2 }).default(sql`0`),
  totalReviews: integer('total_reviews').default(sql`0`),
  fanCount: integer('fan_count').default(sql`0`),
  viewCount: integer('view_count').default(sql`0`),

  // Configuración
  isAvailable: boolean('is_available').default(true),
  isProfileComplete: boolean('is_profile_complete').default(false),
  isVerified: boolean('is_verified').default(false),

  // Metadata
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
