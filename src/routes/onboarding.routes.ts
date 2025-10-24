import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación excepto verify-email
router.get('/status', authMiddleware, onboardingController.getOnboardingStatus);
router.post('/save-progress', authMiddleware, onboardingController.saveOnboardingProgress);
router.post('/complete', authMiddleware, onboardingController.completeOnboarding);
router.post('/send-verification-email', authMiddleware, onboardingController.sendVerificationEmail);
router.post('/verify-email', onboardingController.verifyEmail);

export default router;
