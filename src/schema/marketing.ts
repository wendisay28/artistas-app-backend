import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { companies, venues } from './companies.js';
import { userContracts } from './contracts.js';

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
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  artistId: varchar('artist_id').references(() => users.id, { onDelete: 'cascade' }),
  venueId: integer('venue_id').references(() => venues.id, { onDelete: 'set null' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Información básica
  bookingType: varchar('booking_type', {
    enum: ['event', 'meeting', 'workshop', 'exhibition', 'rental', 'other']
  }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  serviceType: varchar('service_type'),
  eventLocation: text('event_location'),
  eventCity: varchar('event_city'),
  eventDetails: jsonb('event_details').default(sql`'{}'::jsonb`),

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
  platformFee: numeric('platform_fee', { precision: 10, scale: 2 }).default(sql`0`),
  artistPayoutAmount: numeric('artist_payout_amount', { precision: 10, scale: 2 }),
  deposit: numeric('deposit', { precision: 10, scale: 2 }),
  depositPaid: boolean('deposit_paid').default(false),

  // Pago
  paymentStatus: varchar('payment_status', {
    enum: ['pending', 'partial', 'paid', 'refunded']
  }).default('pending'),
  paymentMethod: varchar('payment_method'),
  paymentId: varchar('payment_id'),

  escrowStatus: varchar('escrow_status', {
    enum: ['not_funded', 'funded', 'eligible_release', 'released', 'refunded', 'disputed']
  }).default('not_funded'),
  escrowFundedAt: timestamp('escrow_funded_at'),
  escrowEligibleReleaseAt: timestamp('escrow_eligible_release_at'),
  escrowReleasedAt: timestamp('escrow_released_at'),

  // Estado de la reserva
  status: varchar('status', {
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']
  }).default('pending'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: varchar('cancelled_by', { enum: ['client', 'artist', 'company', 'admin'] }),
  refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }),
  refundPercentage: integer('refund_percentage'),
  penaltyAmount: numeric('penalty_amount', { precision: 10, scale: 2 }),

  // Notas
  clientNotes: text('client_notes'),
  companyNotes: text('company_notes'),

  // Referencia al contrato (se crea cuando se confirma la reserva)
  contractId: integer('contract_id').references(() => userContracts.id, { onDelete: 'set null' }),

  // Timestamps
  requestedAt: timestamp('requested_at').default(sql`CURRENT_TIMESTAMP`),
  confirmedAt: timestamp('confirmed_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
