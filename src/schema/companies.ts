import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').default(false), // Empresa principal del usuario

  // Información básica
  companyName: varchar('company_name').notNull(),
  legalName: varchar('legal_name'),
  taxId: varchar('tax_id'),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 300 }),

  // Categorización
  companyType: varchar('company_type', {
    enum: ['cultural_space', 'theater', 'museum', 'gallery', 'bar', 'restaurant', 'event_venue', 'other']
  }),
  categories: text('categories').array().default(sql`'{}'`),
  subcategories: text('subcategories').array().default(sql`'{}'`),
  tags: text('tags').array().default(sql`'{}'`),

  // Contacto e información de negocio
  contactPerson: varchar('contact_person'),
  phone: varchar('phone'),
  email: varchar('email'),
  website: varchar('website'),
  socialMedia: jsonb('social_media').default(sql`'{}'`),

  // Ubicación
  address: text('address'),
  city: varchar('city'),
  state: varchar('state'),
  country: varchar('country'),
  postalCode: varchar('postal_code'),
  coordinates: jsonb('coordinates'), // { lat: number, lng: number }

  // Servicios y características
  services: jsonb('services').default(sql`'[]'`), // Array de servicios ofrecidos
  amenities: jsonb('amenities').default(sql`'[]'`), // Comodidades del lugar
  capacity: integer('capacity'),
  rooms: jsonb('rooms').default(sql`'[]'`), // Salas o espacios disponibles

  // Horarios
  openingHours: jsonb('opening_hours').default(sql`'{}'`),
  is24h: boolean('is_24h').default(false),

  // Tarifas
  priceRange: jsonb('price_range'), // { min: number, max: number, currency: string, description?: string }
  depositRequired: boolean('deposit_required').default(false),
  depositAmount: numeric('deposit_amount', { precision: 10, scale: 2 }),

  // Multimedia
  logoUrl: varchar('logo_url'),
  coverPhotoUrl: varchar('cover_photo_url'),
  gallery: jsonb('gallery').default(sql`'[]'`), // Array de URLs de imágenes
  videoTourUrl: varchar('video_tour_url'),

  // Portfolio y experiencia profesional (unificado con artists)
  portfolio: jsonb('portfolio').default(sql`'[]'::jsonb`), // Portfolio items: images, videos, case studies
  bio: text('bio'), // Detailed company biography (longer than description)
  history: jsonb('history').default(sql`'[]'::jsonb`), // Company timeline and milestones
  mission: text('mission'), // Company mission statement
  vision: text('vision'), // Company vision statement

  // Team and organization
  team: jsonb('team').default(sql`'[]'::jsonb`), // Team members with roles and bios
  teamSize: integer('team_size'),
  foundedYear: integer('founded_year'),

  // Professional credentials
  certifications: jsonb('certifications').default(sql`'[]'::jsonb`), // Company certifications
  awards: jsonb('awards').default(sql`'[]'::jsonb`), // Awards and recognition
  licenses: jsonb('licenses').default(sql`'[]'::jsonb`), // Business licenses
  partnerships: jsonb('partnerships').default(sql`'[]'::jsonb`), // Partner organizations

  // Additional contact and social
  linkedAccounts: jsonb('linked_accounts').default(sql`'{}'::jsonb`),
  languages: jsonb('languages').default(sql`'[]'::jsonb`), // Languages supported

  // Education and training (for companies offering educational services)
  education: jsonb('education').default(sql`'[]'::jsonb`), // Training programs offered

  // Work experience (for service companies showcasing past projects)
  workExperience: jsonb('work_experience').default(sql`'[]'::jsonb`),

  // Estadísticas
  rating: numeric('rating', { precision: 3, scale: 2 }).default(sql`0`),
  totalReviews: integer('total_reviews').default(sql`0`),
  viewCount: integer('view_count').default(sql`0`),
  saveCount: integer('save_count').default(sql`0`), // Veces guardado en favoritos
  fanCount: integer('fan_count').default(sql`0`),

  // Verificación y estado
  isVerified: boolean('is_verified').default(false),
  isProfileComplete: boolean('is_profile_complete').default(false),
  isActive: boolean('is_active').default(true),

  // Metadata
  metadata: jsonb('metadata').default(sql`'{}'`),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const venues = pgTable('venues', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  description: text('description'),
  venueType: varchar('venue_type'),
  services: text('services').array().default(sql`'{}'`),
  address: text('address'),
  city: varchar('city'),
  openingHours: jsonb('opening_hours').default(sql`'{}'`),
  contact: jsonb('contact').default(sql`'{}'`),
  multimedia: jsonb('multimedia').default(sql`'{}'`),
  coordinates: jsonb('coordinates'),
  dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }),
  capacity: integer('capacity'),
  isAvailable: boolean('is_available').default(true),
  rating: numeric('rating', { precision: 3, scale: 2 }).default(sql`0`),
  totalReviews: integer('total_reviews').default(sql`0`),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
