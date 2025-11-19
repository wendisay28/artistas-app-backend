import express from 'express';
import { campaignsController } from '../controllers/campaigns.controller.js';
import { authMiddleware as authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas de campañas
router.get('/me', authenticateToken, campaignsController.getMyCampaigns);
router.get('/company/:companyId', campaignsController.getCompanyCampaigns);
router.get('/:id', campaignsController.getCampaignById);
router.post('/', authenticateToken, campaignsController.createCampaign);
router.patch('/:id', authenticateToken, campaignsController.updateCampaign);
router.delete('/:id', authenticateToken, campaignsController.deleteCampaign);
router.patch('/:id/publish', authenticateToken, campaignsController.publishCampaign);

// Rutas de aplicaciones a campañas
router.get('/:campaignId/applications', authenticateToken, campaignsController.getCampaignApplications);
router.post('/:campaignId/apply', authenticateToken, campaignsController.applyToCampaign);
router.patch('/applications/:id', authenticateToken, campaignsController.updateApplicationStatus);

export default router;
