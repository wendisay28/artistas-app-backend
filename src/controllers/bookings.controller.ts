import { Response } from 'express';
import { storage } from '../storage/index.js';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { bookings, userContracts } from '../schema.js';

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
        artistId,
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

      if ((!companyId && !artistId) || !bookingType || !title || !startDate || !endDate || !contactName || !contactEmail) {
        return res.status(400).json({
          message: 'Los campos bookingType, title, startDate, endDate, contactName y contactEmail son requeridos. Debes especificar companyId o artistId.'
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
          companyId: companyId ? parseInt(companyId) : null,
          artistId: artistId ? parseInt(artistId) : null,
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

  // Confirmar una reserva (solo dueño de la empresa o artista)
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

      const bookingData = booking[0];

      // artistId IS the userId now (artists merged into users)
      const artistUserId: string | null = bookingData.artistId ?? null;

      // Verificar que el usuario sea el artista asociado a la reserva
      const isArtist = artistUserId && artistUserId === userId;

      // También verificar si es el cliente que creó la reserva (para cancelaciones, etc.)
      const isClient = bookingData.userId === userId;

      if (!isArtist && !isClient) {
        return res.status(403).json({
          message: 'No tienes permiso para confirmar esta reserva. Solo el artista puede confirmar.'
        });
      }

      // Solo el artista puede confirmar (el cliente solo puede cancelar)
      if (!isArtist) {
        return res.status(403).json({
          message: 'Solo el artista puede confirmar la reserva.'
        });
      }

      // Crear el contrato asociado a la reserva
      let contractId: number | null = null;
      if (artistUserId && bookingData.userId) {
        try {
          // Generar términos del contrato
          const serviceDate = bookingData.startDate
            ? new Date(bookingData.startDate).toLocaleDateString('es-CO')
            : 'Por definir';
          const amount = bookingData.totalPrice
            ? parseFloat(bookingData.totalPrice.toString()).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
            : 'Por definir';

          const contractTerms = `
CONTRATO DE PRESTACIÓN DE SERVICIOS

1. PARTES
Este contrato se celebra entre el CLIENTE (contratante) y el ARTISTA (prestador del servicio) a través de la plataforma BuscartPro.

2. OBJETO DEL CONTRATO
El ARTISTA se compromete a prestar el servicio de: ${bookingData.title}
${bookingData.description ? `Descripción: ${bookingData.description}` : ''}

3. FECHA Y LUGAR
Fecha del servicio: ${serviceDate}
${bookingData.eventLocation ? `Ubicación: ${bookingData.eventLocation}` : ''}
${bookingData.eventCity ? `Ciudad: ${bookingData.eventCity}` : ''}

4. VALOR Y FORMA DE PAGO
Valor total del servicio: ${amount}
El pago se realizará a través de la plataforma BuscartPro.

5. OBLIGACIONES DEL ARTISTA
- Prestar el servicio acordado en la fecha y hora establecidas
- Cumplir con los estándares de calidad profesional
- Comunicar cualquier inconveniente con anticipación

6. OBLIGACIONES DEL CLIENTE
- Realizar el pago acordado
- Proporcionar las condiciones necesarias para la prestación del servicio
- Comunicar cualquier cambio con anticipación

7. CANCELACIÓN
- Cancelación con más de 48 horas: Reembolso del 100%
- Cancelación entre 24-48 horas: Reembolso del 50%
- Cancelación con menos de 24 horas: Sin reembolso

8. RESOLUCIÓN DE CONFLICTOS
Cualquier disputa será mediada por BuscartPro. En caso de no llegar a acuerdo, se someterá a las leyes colombianas.

Al firmar este contrato, ambas partes aceptan los términos y condiciones aquí establecidos.

Fecha de generación: ${new Date().toLocaleDateString('es-CO')}
          `.trim();

          // Calcular comisión de plataforma (10%)
          const totalPrice = bookingData.totalPrice ? parseFloat(bookingData.totalPrice.toString()) : 0;
          const platformFee = totalPrice * 0.10;
          const artistAmount = totalPrice - platformFee;

          // Crear el contrato
          const [newContract] = await storage.db
            .insert(userContracts)
            .values({
              userId: bookingData.userId,
              artistId: artistUserId,
              serviceType: bookingData.bookingType || 'service',
              serviceName: bookingData.title,
              description: bookingData.description || undefined,
              amount: bookingData.totalPrice?.toString() || '0',
              platformFee: platformFee.toString(),
              artistAmount: artistAmount.toString(),
              status: 'pending',
              paymentStatus: 'pending',
              serviceDate: bookingData.startDate,
              clientSigned: false,
              artistSigned: false,
              contractTerms,
              metadata: {
                bookingId: bookingData.id,
                bookingType: bookingData.bookingType,
                location: bookingData.eventLocation,
                city: bookingData.eventCity,
                services: bookingData.services,
              },
            })
            .returning();

          contractId = newContract.id;
          console.log(`✅ Contrato #${contractId} creado para la reserva #${bookingData.id}`);
        } catch (contractError) {
          console.error('Error al crear contrato:', contractError);
          // Continuamos sin contrato si falla
        }
      }

      // Actualizar la reserva con el estado confirmado y el contractId
      const updatedBooking = await storage.db
        .update(bookings)
        .set({
          status: 'confirmed',
          confirmedAt: new Date(),
          companyNotes,
          contractId: contractId,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, parseInt(id)))
        .returning();

      return res.json({
        ...updatedBooking[0],
        contractId,
        message: contractId
          ? 'Reserva confirmada. Se ha generado un contrato que debe ser firmado por ambas partes.'
          : 'Reserva confirmada.'
      });
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
