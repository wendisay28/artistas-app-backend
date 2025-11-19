import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, jsonb, date, uniqueIndex, AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Importar y re-exportar tablas de posts
export { posts, postMedia, postTypeEnum, postRelations, postMediaRelations } from './models/post.model.js';
export type { Post, NewPost, PostMedia, NewPostMedia } from './models/post.model.js';

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
  interestedCategories: integer('interested_categories').array(),
  interestedTags: text('interested_tags').array(),
  
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de Disciplinas (nivel 2 de jerarquía)
export const disciplines = pgTable('disciplines', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de Roles (nivel 3 de jerarquía)
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  disciplineId: integer('discipline_id').notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de Especializaciones (nivel 4 de jerarquía)
export const specializations = pgTable('specializations', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  disciplineId: integer('discipline_id').notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  description: text('description'),
  isCustom: boolean('is_custom').default(false),
  isApproved: boolean('is_approved').default(false),
  proposedBy: varchar('proposed_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de TADs - Talentos Adicionales sugeridos
export const tads = pgTable('tads', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  suggestedDisciplineId: integer('suggested_discipline_id').notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  priority: integer('priority').default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de Stats sugeridos por Rol
export const roleStats = pgTable('role_stats', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  statKey: varchar('stat_key', { length: 100 }).notNull(),
  statLabel: varchar('stat_label', { length: 255 }).notNull(),
  statType: varchar('stat_type', { length: 50 }).notNull(), // 'text', 'number', 'select', 'multiselect', 'range'
  statOptions: jsonb('stat_options'),
  isRequired: boolean('is_required').default(false),
  placeholder: varchar('placeholder', { length: 255 }),
  helpText: text('help_text'),
  validationRules: jsonb('validation_rules'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de propuestas de TADs personalizados
export const customTadProposals = pgTable('custom_tad_proposals', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  proposedDisciplineName: varchar('proposed_discipline_name', { length: 255 }).notNull(),
  justification: text('justification'),
  status: varchar('status', { length: 50 }).default('pending'),
  reviewedBy: varchar('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de propuestas de Especializaciones personalizadas
export const customSpecializationProposals = pgTable('custom_specialization_proposals', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  proposedName: varchar('proposed_name', { length: 255 }).notNull(),
  proposedCode: varchar('proposed_code', { length: 100 }).notNull(),
  description: text('description'),
  justification: text('justification'),
  status: varchar('status', { length: 50 }).default('pending'),
  reviewedBy: varchar('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

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
  bio: text('bio'),
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
  linkedAccounts: jsonb('linked_accounts').default(sql`'{}'::jsonb`), // { instagram, behance, linkedin, website }

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

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  organizerId: varchar('organizer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  venueId: integer('venue_id').references(() => venues.id, { onDelete: 'set null' }),
  
  // Información básica
  title: varchar('title').notNull(),
  slug: varchar('slug').notNull().unique(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 300 }),
  
  // Categorización
  categoryId: integer('category_id').references(() => categories.id),
  subcategories: text('subcategories').array().default(sql`'{}'`),
  tags: text('tags').array().default(sql`'{}'`),
  eventType: varchar('event_type', { 
    enum: ['concert', 'exhibition', 'workshop', 'festival', 'conference', 'theater', 'dance', 'other'] 
  }),
  
  // Fechas y horarios
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  timezone: varchar('timezone').default('America/Bogota'),
  isRecurring: boolean('is_recurring').default(false),
  recurrencePattern: jsonb('recurrence_pattern'), // Para eventos recurrentes
  
  // Ubicación
  locationType: varchar('location_type', { enum: ['physical', 'online', 'hybrid'] }).default('physical'),
  address: text('address'),
  city: varchar('city'),
  state: varchar('state'),
  country: varchar('country'),
  coordinates: jsonb('coordinates'), // { lat: number, lng: number }
  onlineEventUrl: varchar('online_event_url'),
  
  // Información del lugar
  venueName: varchar('venue_name'),
  venueDescription: text('venue_description'),
  venueCapacity: integer('venue_capacity'),
  isOutdoor: boolean('is_outdoor').default(false),
  
  // Información de entradas
  isFree: boolean('is_free').default(false),
  ticketPrice: numeric('ticket_price', { precision: 10, scale: 2 }),
  ticketUrl: varchar('ticket_url'),
  capacity: integer('capacity'),
  availableTickets: integer('available_tickets'),
  
  // Multimedia
  featuredImage: varchar('featured_image'),
  gallery: jsonb('gallery').default(sql`'[]'`),
  videoUrl: varchar('video_url'),
  
  // Estado y visibilidad
  status: varchar('status', { 
    enum: ['draft', 'published', 'cancelled', 'postponed', 'completed'] 
  }).default('draft'),
  isFeatured: boolean('is_featured').default(false),
  isVerified: boolean('is_verified').default(false),
  isOnline: boolean('is_online').default(false),
  
  // Estadísticas
  viewCount: integer('view_count').default(sql`0`),
  saveCount: integer('save_count').default(sql`0`),
  shareCount: integer('share_count').default(sql`0`),
  
  // Metadata
  seoTitle: varchar('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  
  // Fechas de creación/actualización
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla para guardar eventos recurrentes generados
export const eventOccurrences = pgTable('event_occurrences', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: varchar('status', { enum: ['scheduled', 'cancelled', 'completed'] }).default('scheduled'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

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
  
  // Estadísticas
  rating: numeric('rating', { precision: 3, scale: 2 }).default(sql`0`),
  totalReviews: integer('total_reviews').default(sql`0`),
  viewCount: integer('view_count').default(sql`0`),
  saveCount: integer('save_count').default(sql`0`), // Veces guardado en favoritos
  
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

export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').references(() => blogPosts.id, { onDelete: 'cascade' }),
  artistId: integer('artist_id').references(() => artists.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }),
  venueId: integer('venue_id').references(() => venues.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(),
  content: text('content').notNull(),
  type: varchar('type', { enum: ['artist', 'event', 'venue', 'post'] }).notNull(),
  score: numeric('score', { precision: 3, scale: 2 }).default(sql`0`),
  isApproved: boolean('is_approved').default(true),
  likeCount: integer('like_count').default(sql`0`),
  replyCount: integer('reply_count').default(sql`0`),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  authorId: varchar('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Información básica
  title: varchar('title').notNull(),
  slug: varchar('slug').notNull().unique(),
  subtitle: varchar('subtitle'),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  readingTime: integer('reading_time'), // Tiempo estimado de lectura en minutos
  
  // Categorización
  category: varchar('category'),
  subcategories: text('subcategories').array().default(sql`'{}'`),
  tags: text('tags').array().default(sql`'{}'`),
  
  // Multimedia
  featuredImage: varchar('featured_image'),
  gallery: jsonb('gallery').default(sql`'[]'`),
  videoUrl: varchar('video_url'),
  
  // Estadísticas
  viewCount: integer('view_count').default(sql`0`),
  likeCount: integer('like_count').default(sql`0`),
  commentCount: integer('comment_count').default(sql`0`),
  shareCount: integer('share_count').default(sql`0`),
  saveCount: integer('save_count').default(sql`0`), // Guardado en favoritos
  
  // Visibilidad y estado
  visibility: varchar('visibility', { 
    enum: ['public', 'private', 'draft', 'archived'] 
  }).default('draft'),
  allowComments: boolean('allow_comments').default(true),
  isFeatured: boolean('is_featured').default(false),
  isVerified: boolean('is_verified').default(false),
  
  // SEO
  seoTitle: varchar('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  
  // Fechas
  publishedAt: timestamp('published_at'),
  scheduledAt: timestamp('scheduled_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla para los comentarios del blog
export const blogComments = pgTable('blog_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  authorId: varchar('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id').references((): AnyPgColumn => blogComments.id, { onDelete: 'cascade' }), // Para respuestas anidadas
  content: text('content').notNull(),
  isApproved: boolean('is_approved').default(true),
  likeCount: integer('like_count').default(sql`0`),
  replyCount: integer('reply_count').default(sql`0`),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla para los likes en publicaciones del blog
export const blogPostLikes = pgTable('blog_post_likes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Asegura que un usuario solo pueda dar like una vez por publicación
  postUserIdx: uniqueIndex('post_user_idx').on(table.postId, table.userId),
}));

export const gallery = pgTable('gallery', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title'),
  description: text('description'),
  imageUrl: varchar('image_url').notNull(),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  isPublic: boolean('is_public').default(true),
  isFeatured: boolean('is_featured').default(false),
  orderPosition: integer('order_position').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  artistId: integer('artist_id').references(() => artists.id),
  eventId: integer('event_id').references(() => events.id),
  venueId: integer('venue_id').references(() => venues.id),
  type: varchar('type', { enum: ['artist', 'event', 'venue'] }).notNull(),
  score: numeric('score').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const hiringRequests = pgTable('hiring_requests', {
  id: serial('id').primaryKey(),
  clientId: varchar('client_id').notNull().references(() => users.id),
  artistId: integer('artist_id').references(() => artists.id),
  venueId: integer('venue_id').references(() => venues.id),
  details: text('details').notNull(),
  eventDate: date('event_date'),
  budget: numeric('budget', { precision: 10, scale: 2 }),
  status: varchar('status', { enum: ['pending', 'accepted', 'rejected', 'completed'] }).default('pending'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de contrataciones del usuario (historial de compras/contrataciones)
export const userContracts = pgTable('user_contracts', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  artistId: varchar('artist_id').notNull().references(() => users.id),
  serviceId: integer('service_id'),
  serviceType: varchar('service_type').notNull(), // 'event', 'service', 'custom'
  serviceName: varchar('service_name').notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  status: varchar('status', { enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] }).default('pending'),
  contractDate: timestamp('contract_date').default(sql`CURRENT_TIMESTAMP`),
  serviceDate: timestamp('service_date'),
  completionDate: timestamp('completion_date'),
  rating: integer('rating'), // 1-5
  review: text('review'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de solicitudes de cotización
export const userQuotations = pgTable('user_quotations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  artistId: varchar('artist_id').notNull().references(() => users.id),
  serviceType: varchar('service_type').notNull(),
  title: varchar('title').notNull(),
  description: text('description').notNull(),
  budgetMin: numeric('budget_min', { precision: 10, scale: 2 }),
  budgetMax: numeric('budget_max', { precision: 10, scale: 2 }),
  preferredDate: timestamp('preferred_date'),
  location: varchar('location'),
  status: varchar('status', { enum: ['pending', 'quoted', 'accepted', 'rejected', 'expired'] }).default('pending'),
  quotedAmount: numeric('quoted_amount', { precision: 10, scale: 2 }),
  artistResponse: text('artist_response'),
  responseDate: timestamp('response_date'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de actividades del usuario (para feed de actividad)
export const userActivities = pgTable('user_activities', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId: varchar('actor_id').references(() => users.id, { onDelete: 'cascade' }), // Quien hizo la acción
  type: varchar('type', {
    enum: [
      'profile_view',      // Alguien vio tu perfil
      'follow',            // Alguien te siguió
      'unfollow',          // Alguien dejó de seguirte
      'comment',           // Comentaron tu obra
      'like',              // Les gustó tu contenido
      'review',            // Te dejaron una reseña
      'contract',          // Nueva contratación
      'recommendation',    // Te recomendaron
      'profile_update',    // Actualizaste tu perfil
      'portfolio_update',  // Actualizaste tu portafolio
      'achievement'        // Desbloqueaste un logro
    ]
  }).notNull(),
  entityType: varchar('entity_type'), // 'user', 'post', 'portfolio', 'event', etc.
  entityId: varchar('entity_id'),     // ID de la entidad relacionada
  metadata: jsonb('metadata').default({}), // Datos adicionales de la actividad
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de notificaciones
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', {
    enum: [
      'follow',
      'comment',
      'like',
      'review',
      'contract',
      'message',
      'system'
    ]
  }).notNull(),
  title: varchar('title').notNull(),
  message: text('message').notNull(),
  link: varchar('link'), // URL a donde redirigir
  isRead: boolean('is_read').default(false),
  priority: varchar('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  readAt: timestamp('read_at'),
});

// Tabla de seguidores (follows)
export const follows = pgTable('follows', {
  id: serial('id').primaryKey(),
  followerId: varchar('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: varchar('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de vistas de perfil
export const profileViews = pgTable('profile_views', {
  id: serial('id').primaryKey(),
  profileId: varchar('profile_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  viewerId: varchar('viewer_id').references(() => users.id, { onDelete: 'set null' }), // null = anónimo
  viewerIp: varchar('viewer_ip'), // Para contar vistas anónimas
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de logros/achievements
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  code: varchar('code').notNull().unique(), // 'first_profile', 'first_follower', etc.
  name: varchar('name').notNull(),
  description: text('description'),
  icon: varchar('icon'), // Emoji o URL de icono
  category: varchar('category', { enum: ['profile', 'social', 'work', 'milestone'] }),
  points: integer('points').default(0),
  requirement: jsonb('requirement'), // Criterio para desbloquear
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de logros desbloqueados por usuarios
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: integer('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlocked_at').default(sql`CURRENT_TIMESTAMP`),
  notified: boolean('notified').default(false), // Si ya se notificó al usuario
});

export const featuredItems = pgTable('featured_items', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  type: varchar('type', { enum: ['youtube', 'spotify', 'vimeo', 'soundcloud', 'other'] }).notNull(),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla para las 4 fotos destacadas del perfil (obligatorias para artistas)
export const highlightPhotos = pgTable('highlight_photos', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: varchar('image_url').notNull(),
  position: integer('position').notNull(), // 1, 2, 3, 4
  caption: text('caption'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Asegura que cada usuario solo tenga una foto por posición
  userPositionIdx: uniqueIndex('user_position_idx').on(table.userId, table.position),
}));

export const hiringResponses = pgTable('hiring_responses', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => hiringRequests.id),
  artistId: integer('artist_id').notNull().references(() => artists.id),
  proposal: text('proposal').notNull(),
  message: text('message'),
  status: varchar('status', { enum: ['pending', 'accepted', 'rejected', 'completed'] }).default('pending'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: varchar('sender_id').notNull().references(() => users.id),
  receiverId: varchar('receiver_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  clientId: varchar('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  artistId: integer('artist_id').references(() => artists.id, { onDelete: 'cascade' }),
  category: varchar('category').notNull(),
  description: text('description').notNull(),
  budgetMin: numeric('budget_min', { precision: 12, scale: 2 }),
  budgetMax: numeric('budget_max', { precision: 12, scale: 2 }),
  modality: varchar('modality', { enum: ['presencial', 'online', 'ambas'] }).default('presencial'),
  eventDate: timestamp('event_date'),
  eventTime: varchar('event_time'),
  location: text('location'),
  status: varchar('status', { 
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] 
  }).default('pending'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const savedItems = pgTable('saved_items', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').references(() => blogPosts.id, { onDelete: 'cascade' }),
  savedAt: timestamp('saved_at').default(sql`CURRENT_TIMESTAMP`),
  notes: text('notes'),
  // Índice único para evitar duplicados
}, (table) => ({
  userPostIdx: uniqueIndex('user_post_idx').on(table.userId, table.postId),
}));

// Tabla de servicios ofrecidos por usuarios/artistas
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }),
  duration: varchar('duration', { length: 50 }),
  category: varchar('category', { length: 100 }),
  images: text('images').array().default(sql`'{}'`),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de obras de arte
export const artworks = pgTable('artworks', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', {
    length: 50,
    enum: ['pintura', 'escultura', 'libro', 'fotografía', 'digital', 'otro']
  }),
  images: text('images').array().default(sql`'{}'`),
  price: numeric('price', { precision: 10, scale: 2 }),
  dimensions: varchar('dimensions', { length: 100 }),
  materials: text('materials').array().default(sql`'{}'`),
  year: integer('year'),
  available: boolean('available').default(true),
  stock: integer('stock').default(1),
  city: varchar('city', { length: 100 }),
  tags: text('tags').array().default(sql`'{}'`),
  showInExplorer: boolean('show_in_explorer').default(true),
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de preferencias de usuario para recomendaciones
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  favoriteCategories: text('favorite_categories').array().default(sql`'{}'`),
  interests: text('interests').array().default(sql`'{}'`),
  priceRange: jsonb('price_range'), // { min: number, max: number }
  preferredLocations: text('preferred_locations').array().default(sql`'{}'`),
  notificationPreferences: jsonb('notification_preferences').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de analytics de perfil (para artistas y empresas)
export const profileAnalytics = pgTable('profile_analytics', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  profileViews: integer('profile_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  clicksOnContact: integer('clicks_on_contact').default(0),
  clicksOnSocial: integer('clicks_on_social').default(0),
  favoriteAdds: integer('favorite_adds').default(0),
  shareCount: integer('share_count').default(0),
  averageTimeOnProfile: integer('average_time_on_profile').default(0), // en segundos
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de documentos de usuario
export const userDocuments = pgTable('user_documents', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 50 }).notNull(), // 'id', 'tax', 'contract', 'certification'
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'), // Tamaño en bytes
  mimeType: varchar('mime_type', { length: 100 }),
  status: varchar('status', {
    length: 20,
    enum: ['pending', 'approved', 'rejected', 'expired']
  }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  expiryDate: timestamp('expiry_date'),
  reviewedBy: varchar('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  uploadedAt: timestamp('uploaded_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ============================================================================
// Enhanced Events System - New Tables
// ============================================================================

// Tabla de tipos de boletos/entradas
export const ticketTypes = pgTable('ticket_types', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),

  // Información básica
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),

  // Precio
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('COP'),

  // Disponibilidad
  quantity: integer('quantity').notNull(),
  soldCount: integer('sold_count').default(0),

  // Período de venta
  saleStart: timestamp('sale_start'),
  saleEnd: timestamp('sale_end'),

  // Límites de compra
  minPerOrder: integer('min_per_order').default(1),
  maxPerOrder: integer('max_per_order').default(10),

  // Configuración
  isActive: boolean('is_active').default(true),
  requiresApproval: boolean('requires_approval').default(false),

  // Selección de asientos
  allowSeatSelection: boolean('allow_seat_selection').default(false),

  // Campos personalizados (JSON)
  customFields: jsonb('custom_fields').default(sql`'[]'`),

  // Timestamps
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de asientos
export const seats = pgTable('seats', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),

  // Ubicación del asiento
  section: varchar('section', { length: 50 }).notNull(),
  row: varchar('row', { length: 10 }).notNull(),
  number: varchar('number', { length: 10 }).notNull(),

  // Estado del asiento
  status: varchar('status', {
    enum: ['available', 'reserved', 'sold', 'blocked']
  }).default('available'),

  // Tipo de boleto asignado
  ticketTypeId: integer('ticket_type_id').references(() => ticketTypes.id, { onDelete: 'set null' }),

  // Metadata (posición visual, características)
  metadata: jsonb('metadata').default(sql`'{}'`),

  // Información de reserva/venta
  reservedBy: varchar('reserved_by').references(() => users.id, { onDelete: 'set null' }),
  reservedAt: timestamp('reserved_at'),
  reservationExpiry: timestamp('reservation_expiry'),

  // Timestamps
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de compras/órdenes
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Totales
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  fees: numeric('fees', { precision: 10, scale: 2 }).default(sql`0`),
  taxes: numeric('taxes', { precision: 10, scale: 2 }).default(sql`0`),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('COP'),

  // Estado del pago
  paymentStatus: varchar('payment_status', {
    enum: ['pending', 'completed', 'failed', 'refunded']
  }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentId: varchar('payment_id', { length: 255 }), // ID de Stripe, PayPal, etc.

  // Información de contacto
  email: varchar('email').notNull(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  phone: varchar('phone'),

  // Timestamps
  purchasedAt: timestamp('purchased_at').default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de items de compra (líneas de la orden)
export const purchaseItems = pgTable('purchase_items', {
  id: serial('id').primaryKey(),
  purchaseId: integer('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  ticketTypeId: integer('ticket_type_id').notNull().references(() => ticketTypes.id, { onDelete: 'cascade' }),
  seatId: integer('seat_id').references(() => seats.id, { onDelete: 'set null' }),

  // Cantidad y precio
  quantity: integer('quantity').notNull().default(1),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(), // Precio unitario al momento de la compra
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de asistentes (attendees) - une usuario, evento y boleto
export const eventAttendees = pgTable('event_attendees', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Información del boleto
  purchaseId: integer('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  ticketTypeId: integer('ticket_type_id').notNull().references(() => ticketTypes.id, { onDelete: 'cascade' }),
  seatId: integer('seat_id').references(() => seats.id, { onDelete: 'set null' }),

  // Estado del asistente
  status: varchar('status', {
    enum: ['registered', 'checked_in', 'no_show', 'cancelled']
  }).default('registered'),

  // Respuestas a campos personalizados
  customFieldResponses: jsonb('custom_field_responses').default(sql`'{}'`),

  // Check-in
  checkedInAt: timestamp('checked_in_at'),
  checkedInBy: varchar('checked_in_by').references(() => users.id, { onDelete: 'set null' }),

  // Timestamps
  registeredAt: timestamp('registered_at').default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Índice único para prevenir registros duplicados
  eventUserIdx: uniqueIndex('event_user_purchase_idx').on(table.eventId, table.userId, table.purchaseId),
}));

// Tabla de campañas de empresas (marketing, colaboración, UGC)
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Información básica
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 300 }),

  // Tipo de campaña
  campaignType: varchar('campaign_type', {
    enum: ['paid', 'collaboration', 'ugc', 'sponsorship', 'other']
  }).notNull(),

  // Detalles de compensación
  compensationType: varchar('compensation_type', {
    enum: ['paid', 'free_product', 'free_service', 'discount', 'mixed', 'none']
  }),
  budget: numeric('budget', { precision: 12, scale: 2 }),
  compensationDetails: text('compensation_details'),

  // Requisitos y deliverables
  requirements: jsonb('requirements').default(sql`'[]'`), // Array de requisitos
  deliverables: jsonb('deliverables').default(sql`'[]'`), // Qué debe entregar el colaborador
  targetAudience: text('target_audience'),
  platforms: text('platforms').array().default(sql`'{}'`), // Instagram, TikTok, YouTube, etc.

  // Fechas
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  applicationDeadline: timestamp('application_deadline'),

  // Ubicación (si aplica)
  locationType: varchar('location_type', { enum: ['online', 'physical', 'hybrid'] }).default('online'),
  location: text('location'),
  city: varchar('city'),

  // Multimedia
  featuredImage: varchar('featured_image'),
  gallery: jsonb('gallery').default(sql`'[]'`),

  // Configuración
  maxParticipants: integer('max_participants'),
  minFollowers: integer('min_followers'), // Requisito mínimo de seguidores
  categories: text('categories').array().default(sql`'{}'`),
  tags: text('tags').array().default(sql`'{}'`),

  // Estado
  status: varchar('status', {
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled']
  }).default('draft'),
  isPublic: boolean('is_public').default(true),

  // Estadísticas
  viewCount: integer('view_count').default(sql`0`),
  applicationCount: integer('application_count').default(sql`0`),

  // Timestamps
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de aplicaciones a campañas
export const campaignApplications = pgTable('campaign_applications', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Propuesta del aplicante
  message: text('message').notNull(),
  portfolio: text('portfolio'),
  socialLinks: jsonb('social_links').default(sql`'{}'`),
  expectedDelivery: timestamp('expected_delivery'),

  // Información del aplicante
  followerCount: jsonb('follower_count').default(sql`'{}'`), // { instagram: 1000, tiktok: 500, etc. }
  previousWork: jsonb('previous_work').default(sql`'[]'`), // Links a trabajos anteriores

  // Estado de la aplicación
  status: varchar('status', {
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled']
  }).default('pending'),
  companyNotes: text('company_notes'),

  // Timestamps
  appliedAt: timestamp('applied_at').default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  // Índice único para prevenir aplicaciones duplicadas
  campaignUserIdx: uniqueIndex('campaign_user_idx').on(table.campaignId, table.userId),
}));

// Tabla de reservas/bookings para espacios de empresas
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  venueId: integer('venue_id').references(() => venues.id, { onDelete: 'set null' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Información básica
  bookingType: varchar('booking_type', {
    enum: ['event', 'meeting', 'workshop', 'exhibition', 'rental', 'other']
  }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Fechas y horarios
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  setupTime: integer('setup_time'), // Tiempo de montaje en minutos
  cleanupTime: integer('cleanup_time'), // Tiempo de desmontaje en minutos

  // Espacio reservado
  roomName: varchar('room_name'),
  expectedAttendees: integer('expected_attendees'),

  // Servicios adicionales
  services: jsonb('services').default(sql`'[]'`), // Servicios adicionales solicitados
  equipment: jsonb('equipment').default(sql`'[]'`), // Equipo requerido

  // Información de contacto
  contactName: varchar('contact_name').notNull(),
  contactEmail: varchar('contact_email').notNull(),
  contactPhone: varchar('contact_phone'),

  // Costos
  basePrice: numeric('base_price', { precision: 10, scale: 2 }),
  servicesPrice: numeric('services_price', { precision: 10, scale: 2 }).default(sql`0`),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }),
  deposit: numeric('deposit', { precision: 10, scale: 2 }),
  depositPaid: boolean('deposit_paid').default(false),

  // Pago
  paymentStatus: varchar('payment_status', {
    enum: ['pending', 'partial', 'paid', 'refunded']
  }).default('pending'),
  paymentMethod: varchar('payment_method'),
  paymentId: varchar('payment_id'),

  // Estado de la reserva
  status: varchar('status', {
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']
  }).default('pending'),
  cancellationReason: text('cancellation_reason'),

  // Notas
  clientNotes: text('client_notes'),
  companyNotes: text('company_notes'),

  // Timestamps
  requestedAt: timestamp('requested_at').default(sql`CURRENT_TIMESTAMP`),
  confirmedAt: timestamp('confirmed_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});