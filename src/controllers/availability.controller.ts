import { Request, Response } from "express";
import { db } from "../db.js";
import { eq, and, gte, lte, lt, gt } from "drizzle-orm";
import {
  availabilityRules,
  blockedDates,
  artistBookings,
  users
} from "../schema.js";

// Obtener disponibilidad de un artista para un mes específico
export const getArtistAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // userId (varchar)
    const { month } = req.query; // Formato: YYYY-MM

    if (!month || typeof month !== 'string') {
      return res.status(400).json({
        error: "Se requiere el parámetro 'month' en formato YYYY-MM"
      });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Último día del mes

    // Verificar que el artista existe
    const [artist] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.userType, 'artist')))
      .limit(1);
    if (!artist) {
      return res.status(404).json({ error: "Artista no encontrado" });
    }

    // Obtener reglas de disponibilidad
    const rules = await db
      .select()
      .from(availabilityRules)
      .where(and(
        eq(availabilityRules.artistId, id),
        eq(availabilityRules.isActive, true)
      ));

    // Obtener fechas bloqueadas
    const blockedDatesList = await db
      .select()
      .from(blockedDates)
      .where(and(
        eq(blockedDates.artistId, id),
        gte(blockedDates.date, startDate.toISOString().split('T')[0]),
        lte(blockedDates.date, endDate.toISOString().split('T')[0])
      ));

    // Obtener reservas aceptadas
    const acceptedBookings = await db
      .select()
      .from(artistBookings)
      .where(and(
        eq(artistBookings.artistId, id),
        eq(artistBookings.status, 'accepted'),
        gte(artistBookings.eventDate, startDate.toISOString().split('T')[0]),
        lte(artistBookings.eventDate, endDate.toISOString().split('T')[0])
      ));

    // Generar disponibilidad para cada día del mes
    const availability: Record<string, string[]> = {};

    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, monthNum - 1, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      const isBlocked = blockedDatesList.some(blocked => blocked.date === dateStr);
      if (isBlocked) {
        availability[dateStr] = [];
        continue;
      }

      const dayRule = rules.find(rule => rule.dayOfWeek === dayOfWeek);
      if (!dayRule) {
        availability[dateStr] = [];
        continue;
      }

      const slots = generateTimeSlots(
        new Date(`2000-01-01T${dayRule.startTime}`),
        new Date(`2000-01-01T${dayRule.endTime}`),
        dayRule.slotDurationMinutes || 60
      );

      const dayBookings = acceptedBookings.filter(booking => booking.eventDate === dateStr);

      const availableSlots = slots.filter(slot => {
        return !dayBookings.some(booking => {
          const bookingStart = booking.startTime.slice(0, 5);
          const bookingEnd = booking.endTime.slice(0, 5);
          return slot >= bookingStart && slot < bookingEnd;
        });
      });

      availability[dateStr] = availableSlots;
    }

    res.json({
      artistId: id,
      month,
      availability,
      rules: rules.map(rule => ({
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime.slice(0, 5),
        endTime: rule.endTime.slice(0, 5),
        slotDurationMinutes: rule.slotDurationMinutes
      })),
      blockedDates: blockedDatesList.map(blocked => ({
        date: blocked.date,
        reason: blocked.reason,
        blockType: blocked.blockType
      }))
    });

  } catch (error) {
    console.error("Error al obtener disponibilidad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Crear una nueva reserva
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { artistId, date, startTime, endTime, title, description, clientNotes, locationType, location, price } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    if (!artistId || !date || !startTime || !endTime || !title) {
      return res.status(400).json({
        error: "Faltan campos requeridos: artistId, date, startTime, endTime, title"
      });
    }

    // Verificar que el artista existe (artistId is now users.id varchar)
    const [artist] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, String(artistId)), eq(users.userType, 'artist')))
      .limit(1);
    if (!artist) {
      return res.status(404).json({ error: "Artista no encontrado" });
    }

    const conflictBookings = await db
      .select()
      .from(artistBookings)
      .where(
        and(
          eq(artistBookings.artistId, String(artistId)),
          eq(artistBookings.eventDate, date),
          eq(artistBookings.status, 'accepted'),
          lt(artistBookings.startTime, endTime),
          gt(artistBookings.endTime, startTime)
        )
      );

    if (conflictBookings.length > 0) {
      return res.status(409).json({ error: "El horario solicitado ya está ocupado" });
    }

    const newBooking = await db.insert(artistBookings).values({
      artistId: String(artistId),
      clientId: userId,
      title,
      description,
      eventDate: date,
      startTime,
      endTime,
      clientNotes,
      locationType: locationType || 'online',
      location,
      price: price ? price : null,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }).returning();

    res.status(201).json({
      message: "Reserva creada exitosamente",
      booking: newBooking[0]
    });

  } catch (error) {
    console.error("Error al crear reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Actualizar estado de una reserva
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, artistNotes } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    if (!status || !['accepted', 'rejected', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        error: "Estado inválido. Estados válidos: accepted, rejected, cancelled, completed"
      });
    }

    const [booking] = await db
      .select()
      .from(artistBookings)
      .where(eq(artistBookings.id, id))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    // artistId IS the userId now
    const artistUserId = booking.artistId;

    if (['accepted', 'rejected', 'completed'].includes(status) && artistUserId !== userId) {
      return res.status(403).json({ error: "No tienes permisos para actualizar esta reserva" });
    }

    if (status === 'cancelled' && booking.clientId !== userId && artistUserId !== userId) {
      return res.status(403).json({ error: "No tienes permisos para cancelar esta reserva" });
    }

    const updateData: any = { status };
    if (artistNotes) updateData.artistNotes = artistNotes;

    switch (status) {
      case 'accepted': updateData.acceptedAt = new Date(); break;
      case 'rejected': updateData.rejectedAt = new Date(); break;
      case 'cancelled': updateData.cancelledAt = new Date(); break;
      case 'completed': updateData.completedAt = new Date(); break;
    }

    const updatedBooking = await db
      .update(artistBookings)
      .set(updateData)
      .where(eq(artistBookings.id, id))
      .returning();

    res.json({
      message: `Reserva ${status} exitosamente`,
      booking: updatedBooking[0]
    });

  } catch (error) {
    console.error("Error al actualizar reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener reservas del usuario actual (como cliente o artista)
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { status, role } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    let query = db.select().from(artistBookings) as any;

    if (role === 'artist') {
      // artistBookings.artistId IS the userId
      query = query.where(eq(artistBookings.artistId, userId));
    } else {
      query = query.where(eq(artistBookings.clientId, userId));
    }

    if (status && typeof status === 'string') {
      query = query.where(eq(artistBookings.status, status as any));
    }

    query = query.orderBy(artistBookings.eventDate);

    const bookings = await query;

    res.json({ bookings });

  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Función auxiliar para generar slots de tiempo
function generateTimeSlots(startTime: Date, endTime: Date, durationMinutes: number): string[] {
  const slots: string[] = [];
  const start = new Date(startTime);
  const end = new Date(endTime);
  const current = new Date(start);

  while (current.getTime() + durationMinutes * 60 * 1000 <= end.getTime()) {
    slots.push(current.toTimeString().slice(0, 5));
    current.setTime(current.getTime() + durationMinutes * 60 * 1000);
  }

  return slots;
}
