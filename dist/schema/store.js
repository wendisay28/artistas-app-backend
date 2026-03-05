import { pgTable, serial, varchar, text, timestamp, boolean, integer, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { companies } from './companies.js';
// Tabla de servicios ofrecidos por usuarios/artistas
export const services = pgTable('services', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: numeric('price', { precision: 10, scale: 2 }),
    currency: varchar('currency', { length: 10 }).default('COP'),
    duration: varchar('duration', { length: 50 }),
    category: varchar('category', { length: 100 }),
    icon: varchar('icon', { length: 100 }).default('brush-outline'),
    deliveryTag: varchar('deliverytag', { length: 50 }),
    packageType: varchar('packagetype', { length: 20 }).default('single'),
    includedCount: integer('includedcount').default(1),
    deliveryDays: integer('deliverydays').default(0),
    weeklyFrequency: integer('weeklyfrequency'),
    images: text('images').array().default(sql `'{}'`),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
// Tabla de obras de arte
export const artworks = pgTable('artworks', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companyId: integer('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', {
        length: 50,
        enum: ['pintura', 'escultura', 'libro', 'fotografía', 'digital', 'otro']
    }),
    images: text('images').array().default(sql `'{}'`),
    price: numeric('price', { precision: 10, scale: 2 }),
    dimensions: varchar('dimensions', { length: 100 }),
    materials: text('materials').array().default(sql `'{}'`),
    year: integer('year'),
    available: boolean('available').default(true),
    stock: integer('stock').default(1),
    city: varchar('city', { length: 100 }),
    tags: text('tags').array().default(sql `'{}'`),
    showInExplorer: boolean('show_in_explorer').default(true),
    views: integer('views').default(0),
    likes: integer('likes').default(0),
    createdAt: timestamp('created_at').default(sql `CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql `CURRENT_TIMESTAMP`),
});
