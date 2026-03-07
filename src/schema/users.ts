import { pgTable, varchar, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  password: varchar('password'), // Contraseña hasheada
  firstName: varchar('first_name'), // Nullable para permitir auth con Google/redes sociales
  lastName: varchar('last_name'),
  displayName: varchar('display_name'), // Para nombre artístico o nombre de empresa
  profileImageUrl: varchar('profile_image_url'),
  coverImageUrl: varchar('cover_image_url'),
  userType: varchar('user_type', { enum: ['general', 'artist', 'company'] }).notNull().default('general'),
  bio: text('bio'),
  city: varchar('city'),
  address: text('address'),
  phone: varchar('phone'),
  website: varchar('website'),
  socialMedia: jsonb('social_media'), // { facebook, instagram, twitter, tiktok, youtube }
  isVerified: boolean('is_verified').default(false),
  isFeatured: boolean('is_featured').default(false),
  isAvailable: boolean('is_available').default(true), // Para artistas
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalReviews: integer('total_reviews').default(0),
  fanCount: integer('fan_count').default(0), // Número de veces guardado en favoritos
  preferences: jsonb('preferences').default({}), // Preferencias de notificaciones, etc.
  settings: jsonb('settings').default({}), // Configuraciones de privacidad, etc.
  lastActive: timestamp('last_active'),

  // Campos de verificación de email
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationExpires: timestamp('email_verification_expires'),

  // Campos de onboarding
  onboardingCompleted: boolean('onboarding_completed').default(false),
  onboardingStep: varchar('onboarding_step', { length: 50 }),
  onboardingData: jsonb('onboarding_data'),
  onboardingStartedAt: timestamp('onboarding_started_at'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),

  // Campos adicionales de perfil
  username: varchar('username', { length: 30 }).unique(),
  shortBio: varchar('short_bio', { length: 250 }),
  schedule: varchar('schedule', { length: 255 }),
  interestedCategories: integer('interested_categories').array(),
  interestedTags: text('interested_tags').array(),
  deliveryMode: varchar('delivery_mode', { length: 20 }), // presencial, digital, hibrido

  // Campos de aceptación legal
  termsAccepted: boolean('terms_accepted').default(false),
  privacyAccepted: boolean('privacy_accepted').default(false),
  ageVerified: boolean('age_verified').default(false),
  termsAcceptedAt: timestamp('terms_accepted_at'),

  // Campos de Stripe
  stripeStatus: varchar('stripe_status', { length: 20 }), // disconnected, pending, connected, restricted, error
  stripeAccountId: varchar('stripe_account_id'), // ID de cuenta en Stripe
  stripeHolderName: varchar('stripe_holder_name'), // Nombre del titular
  stripeEmail: varchar('stripe_email'), // Email para Stripe
  stripePhone: varchar('stripe_phone'), // Teléfono para Stripe
  stripeAccountType: varchar('stripe_account_type', { length: 10 }), // individual, company

  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
