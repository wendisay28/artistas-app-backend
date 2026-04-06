import { pgTable, varchar, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { categories, disciplines, roles, specializations } from './hierarchy.js';

export const users = pgTable('users', {
  // ── Identidad base ──────────────────────────────────────────────────────────
  id: varchar('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  password: varchar('password'),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  displayName: varchar('display_name'),
  profileImageUrl: varchar('profile_image_url'),
  coverImageUrl: varchar('cover_image_url'),
  userType: varchar('user_type', { enum: ['general', 'artist', 'company'] }).notNull().default('general'),

  // ── Perfil base ─────────────────────────────────────────────────────────────
  bio: text('bio'),                       // Bio CORTA (header del perfil)
  city: varchar('city'),
  address: text('address'),
  phone: varchar('phone'),
  website: varchar('website'),
  socialMedia: jsonb('social_media'),     // { facebook, instagram, twitter, tiktok, youtube }
  isVerified: boolean('is_verified').default(false),
  isFeatured: boolean('is_featured').default(false),
  isAvailable: boolean('is_available').default(true),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalReviews: integer('total_reviews').default(0),
  fanCount: integer('fan_count').default(0),
  viewCount: integer('view_count').default(0),
  preferences: jsonb('preferences').default({}),
  settings: jsonb('settings').default({}),
  lastActive: timestamp('last_active'),

  // ── Verificación de email ────────────────────────────────────────────────────
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationExpires: timestamp('email_verification_expires'),

  // ── Onboarding ───────────────────────────────────────────────────────────────
  onboardingCompleted: boolean('onboarding_completed').default(false),
  onboardingStep: varchar('onboarding_step', { length: 50 }),
  onboardingData: jsonb('onboarding_data'),
  onboardingStartedAt: timestamp('onboarding_started_at'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),

  // ── Campos adicionales de perfil ─────────────────────────────────────────────
  username: varchar('username', { length: 30 }).unique(),
  shortBio: varchar('short_bio', { length: 250 }),
  schedule: varchar('schedule', { length: 255 }),
  interestedCategories: integer('interested_categories').array(),
  interestedTags: text('interested_tags').array(),
  deliveryMode: varchar('delivery_mode', { length: 20 }), // presencial, digital, hibrido

  // ── Aceptación legal ─────────────────────────────────────────────────────────
  termsAccepted: boolean('terms_accepted').default(false),
  privacyAccepted: boolean('privacy_accepted').default(false),
  ageVerified: boolean('age_verified').default(false),
  termsAcceptedAt: timestamp('terms_accepted_at'),

  // ── Completitud del perfil ───────────────────────────────────────────────────
  profileComplete: boolean('profile_complete').default(false),
  isProfileComplete: boolean('is_profile_complete').default(false),

  // ── Stripe ───────────────────────────────────────────────────────────────────
  stripeStatus: varchar('stripe_status', { length: 20 }),
  stripeAccountId: varchar('stripe_account_id'),
  stripeHolderName: varchar('stripe_holder_name'),
  stripeEmail: varchar('stripe_email'),
  stripePhone: varchar('stripe_phone'),
  stripeAccountType: varchar('stripe_account_type', { length: 10 }),

  // ── Campos de artista (antes en tabla `artists`) ─────────────────────────────
  // Identidad profesional
  artistName: varchar('artist_name'),
  stageName: varchar('stage_name'),

  // Jerarquía de especialización (4 niveles)
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  disciplineId: integer('discipline_id').references(() => disciplines.id, { onDelete: 'set null' }),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'set null' }),
  specializationId: integer('specialization_id').references(() => specializations.id, { onDelete: 'set null' }),
  additionalTalents: integer('additional_talents').array().default(sql`'{}'`),
  customStats: jsonb('custom_stats').default(sql`'{}'`),

  // Categorización
  subcategories: text('subcategories').array().default([]),
  tags: text('tags').array().default([]),
  artistType: varchar('artist_type', { enum: ['solo', 'duo', 'trio', 'band', 'collective'] }),
  presentationType: text('presentation_type').array().default([]),
  serviceTypes: text('service_types').array().default([]),

  // Información profesional
  experience: integer('experience'),           // 1=principiante 2=intermedio 3=profesional 4=experto
  yearsOfExperience: integer('years_of_experience'),
  description: text('description'),             // Descripción LARGA "Acerca de mí"

  // Multimedia
  portfolio: jsonb('portfolio').default({}),
  videoPresentation: varchar('video_presentation'),
  gallery: jsonb('gallery').default([]),

  // Ubicación y viajes
  baseCity: varchar('base_city'),
  travelAvailability: boolean('travel_availability').default(false),
  travelDistance: integer('travel_distance'),
  availability: jsonb('availability').default({}),

  // Precios
  pricePerHour: numeric('price_per_hour', { precision: 10, scale: 2 }).default(sql`0`),
  priceRange: jsonb('price_range'),
  artistServices: jsonb('artist_services').default(sql`'[]'::jsonb`),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  pricingType: varchar('pricing_type', { enum: ['hourly', 'deliverable', 'depends'] }).default('depends'),

  // Formación y credenciales
  education: jsonb('education').default(sql`'[]'::jsonb`),
  languages: jsonb('languages').default(sql`'[]'::jsonb`),
  licenses: jsonb('licenses').default(sql`'[]'::jsonb`),
  certifications: jsonb('certifications').default(sql`'[]'::jsonb`),
  linkedAccounts: jsonb('linked_accounts').default(sql`'{}'::jsonb`),
  workExperience: jsonb('work_experience').default(sql`'[]'::jsonb`),

  // Metadata de artista
  artistMetadata: jsonb('artist_metadata').default({}),

  // ── Timestamps ───────────────────────────────────────────────────────────────
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
