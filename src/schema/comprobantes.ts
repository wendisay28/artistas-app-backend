import { pgTable, serial, varchar, text, timestamp, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const comprobantes = pgTable('comprobantes', {
  id:            serial('id').primaryKey(),
  userId:        varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Emisor (el artista)
  emitter:       varchar('emitter').notNull(),
  emitterNit:    varchar('emitter_nit').notNull(),
  emitterType:   varchar('emitter_type').notNull(), // 'Persona Natural' | 'Persona Jurídica'

  // Cliente (contratante)
  client:        varchar('client').notNull(),
  clientNit:     varchar('client_nit').notNull(),
  clientEmail:   varchar('client_email'),
  clientCity:    varchar('client_city').notNull(),

  // Servicio
  description:   text('description').notNull(),
  amount:        numeric('amount', { precision: 12, scale: 2 }).notNull(),
  taxRate:       integer('tax_rate').default(0), // porcentaje (0, 5, 19...)
  currency:      varchar('currency', { length: 3 }).default('COP'),

  // Estado
  status:        varchar('status', { length: 20 }).default('borrador'), // borrador | pendiente | completado

  // Metadata extra (puede expandirse)
  metadata:      jsonb('metadata'),

  createdAt:     timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt:     timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
