import { pgTable, uuid, integer, varchar, time, boolean, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const blockTypeEnum = pgEnum("block_type", ["vacation", "personal", "event", "other"]);
export const locationTypeEnum = pgEnum("location_type", ["online", "client_place", "artist_place", "venue"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "accepted", "rejected", "cancelled", "completed", "expired"]);

// Tabla de reglas de disponibilidad semanal
export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: varchar("artist_id").notNull(), // references users.id
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isActive: boolean("is_active").default(true),
  slotDurationMinutes: integer("slot_duration_minutes").default(60),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla de fechas bloqueadas
export const blockedDates = pgTable("blocked_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: varchar("artist_id").notNull(), // references users.id
  date: text("date").notNull(), // YYYY-MM-DD format
  reason: text("reason"),
  blockType: blockTypeEnum("block_type").default("personal"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabla de reservas de artistas
export const artistBookings = pgTable("artist_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: varchar("artist_id").notNull(), // references users.id
  clientId: text("client_id").notNull(),
  
  // Información del evento
  title: text("title").notNull(),
  description: text("description"),
  
  // Fechas y horarios
  eventDate: text("event_date").notNull(), // YYYY-MM-DD format
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  
  // Ubicación
  locationType: locationTypeEnum("location_type").default("online"),
  location: text("location"),
  city: text("city"),
  
  // Información de contacto del cliente
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  
  // Costos
  price: text("price"), // Usar text para evitar problemas con numeric
  currency: text("currency").default("USD"),
  deposit: text("deposit"),
  depositPaid: boolean("deposit_paid").default(false),
  
  // Estado
  status: bookingStatusEnum("status").default("pending"),
  
  // Notas
  clientNotes: text("client_notes"),
  artistNotes: text("artist_notes"),
  cancellationReason: text("cancellation_reason"),
  
  // Timestamps importantes
  requestedAt: timestamp("requested_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  cancelledAt: timestamp("cancelled_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
