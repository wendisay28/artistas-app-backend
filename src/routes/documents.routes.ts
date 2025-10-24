import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { documentsController } from '../controllers/documents.controller.js';
import multer from 'multer';

const router = Router();

// Configurar multer para manejar uploads en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo PDF, JPG, PNG
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, JPG y PNG.'));
    }
  },
});

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de documentos
router.get('/', documentsController.getUserDocuments.bind(documentsController));
router.get('/stats', documentsController.getDocumentsStats.bind(documentsController));
router.get('/:id', documentsController.getDocument.bind(documentsController));
router.post('/upload', upload.single('file'), documentsController.uploadDocument.bind(documentsController));
router.patch('/:id/status', documentsController.updateDocumentStatus.bind(documentsController));
router.delete('/:id', documentsController.deleteDocument.bind(documentsController));

export default router;
