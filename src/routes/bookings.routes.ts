import express from 'express';
import { bookingsController } from '../controllers/bookings.controller.js';
import { authMiddleware as authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas de reservas
router.get('/me', authenticateToken, bookingsController.getMyBookings);
router.get('/company/:companyId', authenticateToken, bookingsController.getCompanyBookings);
router.get('/availability', bookingsController.checkAvailability);
router.get('/:id', authenticateToken, bookingsController.getBookingById);
router.post('/', authenticateToken, bookingsController.createBooking);
router.patch('/:id', authenticateToken, bookingsController.updateBooking);
router.patch('/:id/confirm', authenticateToken, bookingsController.confirmBooking);
router.patch('/:id/cancel', authenticateToken, bookingsController.cancelBooking);

export default router;
