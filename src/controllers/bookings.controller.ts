import { Response } from 'express';
import { storage } from '../storage/index.js';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { bookings } from '../schema.js';

export const bookingsController = {
  // Obtener todas las reservas de una empresa
  async getCompanyBookings(req: any, res: Response) {
    try {
      const { companyId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const companyBookings = await storage.db
        .select()
        .from(bookings)
        .where(eq(bookings.companyId, parseInt(companyId)))
        .orderBy(desc(bookings.startDate));

      return res.json(companyBookings);
    } catch (error) {
      console.error('Error al obtener reservas de empresa:', error);
      return res.status(500).json({ message: 'Error al obtener reservas' });
    }
  },

  // Obtener reservas del usuario autenticado (como cliente)
  async getMyBookings(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const myBookings = await storage.db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, userId))
        .orderBy(desc(bookings.startDate));

      return res.json(myBookings);
    } catch (error) {
      console.error('Error al obtener mis reservas:', error);
      return res.status(500).json({ message: 'Error al obtener reservas' });
    }
  },

  // Obtener una reserva específica
  async getBookingById(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const booking = await storage.db
        .select()
        .from(bookings)
        .where(eq(bookings.id, parseInt(id)))
        .limit(1);

      if (!booking || booking.length === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }

      // Verificar que el usuario sea el cliente o dueño de la empresa
      // Por ahora solo verificamos que sea el cliente
      if (booking[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para ver esta reserva' });
      }

      return res.json(booking[0]);
    } catch (error) {
      console.error('Error al obtener reserva:', error);
      return res.status(500).json({ message: 'Error al obtener reserva' });
    }
  },

  // Crear una nueva reserva
  async createBooking(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const {
        companyId,
        venueId,
        bookingType,
        title,
        description,
        startDate,
        endDate,
        setupTime,
        cleanupTime,
        roomName,
        expectedAttendees,
        services,
        equipment,
        contactName,
        contactEmail,
        contactPhone,
        basePrice,
        servicesPrice,
        totalPrice,
        deposit,
        clientNotes,
      } = req.body;

      if (!companyId || !bookingType || !title || !startDate || !endDate || !contactName || !contactEmail) {
        return res.status(400).json({
          message: 'Los campos companyId, bookingType, title, startDate, endDate, contactName y contactEmail son requeridos'
        });
      }

      // Validar que la fecha de inicio sea antes de la fecha de fin
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          message: 'La fecha de inicio debe ser antes de la fecha de fin'
        });
      }

      const newBooking = await storage.db
        .insert(bookings)
        .values({
          companyId: parseInt(companyId),
          venueId: venueId ? parseInt(venueId) : null,
          userId,
          bookingType,
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          setupTime,
          cleanupTime,
          roomName,
          expectedAttendees,
          services: services || [],
          equipment: equipment || [],
          contactName,
          contactEmail,
          contactPhone,
          basePrice,
          servicesPrice: servicesPrice || 0,
          totalPrice,
          deposit,
          depositPaid: false,
          paymentStatus: 'pending',
          status: 'pending',
          clientNotes,
        })
        .returning();

      return res.status(201).json(newBooking[0]);
    } catch (error) {
      console.error('Error al crear reserva:', error);
      return res.status(500).json({ message: 'Error al crear reserva' });
    }
  },

  // Actualizar una reserva
  async updateBooking(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Verificar que la reserva existe
      const existingBooking = await storage.db
        .select()
        .from(bookings)
        .where(eq(bookings.id, parseInt(id)))
        .limit(1);

      if (!existingBooking || existingBooking.length === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }

      // Verificar permisos (cliente o dueño de la empresa)
      if (existingBooking[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar esta reserva' });
      }

      const updateData = { ...req.body };
      delete updateData.userId;
      delete updateData.id;
      delete updateData.companyId;

      const updatedBooking = await storage.db
        .update(bookings)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, parseInt(id)))
        .returning();

      return res.json(updatedBooking[0]);
    } catch (error) {
      console.error('Error al actualizar reserva:', error);
      return res.status(500).json({ message: 'Error al actualizar reserva' });
    }
  },

  // Confirmar una reserva (solo dueño de la empresa)
  async confirmBooking(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { companyNotes } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const booking = await storage.db
        .select()
        .from(bookings)
        .where(eq(bookings.id, parseInt(id)))
        .limit(1);

      if (!booking || booking.length === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }

      // TODO: Verificar que el usuario sea dueño de la empresa

      const updatedBooking = await storage.db
        .update(bookings)
        .set({
          status: 'confirmed',
          confirmedAt: new Date(),
          companyNotes,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, parseInt(id)))
        .returning();

      return res.json(updatedBooking[0]);
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      return res.status(500).json({ message: 'Error al confirmar reserva' });
    }
  },

  // Cancelar una reserva
  async cancelBooking(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { cancellationReason } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const booking = await storage.db
        .select()
        .from(bookings)
        .where(eq(bookings.id, parseInt(id)))
        .limit(1);

      if (!booking || booking.length === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }

      // Verificar permisos
      if (booking[0].userId !== userId) {
        return res.status(403).json({ message: 'No tienes permiso para cancelar esta reserva' });
      }

      const updatedBooking = await storage.db
        .update(bookings)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, parseInt(id)))
        .returning();

      return res.json(updatedBooking[0]);
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      return res.status(500).json({ message: 'Error al cancelar reserva' });
    }
  },

  // Verificar disponibilidad de fechas
  async checkAvailability(req: any, res: Response) {
    try {
      const { companyId, startDate, endDate, venueId } = req.query;

      if (!companyId || !startDate || !endDate) {
        return res.status(400).json({
          message: 'Los parámetros companyId, startDate y endDate son requeridos'
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Buscar reservas confirmadas que se solapen con las fechas solicitadas
      const conflictingBookings = await storage.db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.companyId, parseInt(companyId as string)),
            eq(bookings.status, 'confirmed'),
            // Verificar solapamiento de fechas
            gte(bookings.endDate, start),
            lte(bookings.startDate, end)
          )
        );

      const isAvailable = conflictingBookings.length === 0;

      return res.json({
        available: isAvailable,
        conflictingBookings: isAvailable ? [] : conflictingBookings
      });
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      return res.status(500).json({ message: 'Error al verificar disponibilidad' });
    }
  },
};
