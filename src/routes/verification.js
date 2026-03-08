// src/routes/verification.js
// Rutas para el sistema de verificación de artistas

const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar si es admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador.'
    });
  }
  next();
};

// Rutas públicas (requieren autenticación)
router.get('/artists/:artistId/verification', 
  authenticateToken, 
  verificationController.getVerificationStatus
);

router.post('/artists/:artistId/verification/submit', 
  authenticateToken, 
  verificationController.submitVerification
);

// Rutas de administrador
router.get('/admin/verifications/pending', 
  authenticateToken, 
  requireAdmin,
  verificationController.getPendingVerifications
);

router.post('/admin/verifications/:artistId/approve', 
  authenticateToken, 
  requireAdmin,
  verificationController.approveVerification
);

router.post('/admin/verifications/:artistId/reject', 
  authenticateToken, 
  requireAdmin,
  verificationController.rejectVerification
);

module.exports = router;
