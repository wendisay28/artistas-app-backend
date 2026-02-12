import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { uploadRateLimit } from '../middleware/userRateLimit.middleware.js';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { companies } from '../schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato no soportado: ${file.mimetype}. Usa JPG, PNG, GIF o WebP.`));
    }
  }
});

// Crear cliente de Supabase con service role
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Obtener todas las empresas del usuario autenticado
router.get('/my-companies', companyController.getMyCompanies);

// Obtener perfil público de la empresa (sin datos sensibles)
router.get('/:id/public', companyController.getPublicProfile);

// Obtener sección "Acerca de" de la empresa
router.get('/:id/about', companyController.getAbout);

// Actualizar sección "Acerca de" de la empresa
router.put('/:id/about', companyController.updateAbout);

// Obtener portafolio de la empresa
router.get('/:id/portfolio', companyController.getPortfolio);

// Actualizar portafolio de la empresa
router.put('/:id/portfolio', companyController.updatePortfolio);

// Obtener equipo de la empresa
router.get('/:id/team', companyController.getTeam);

// Actualizar equipo de la empresa
router.put('/:id/team', companyController.updateTeam);

// Incrementar contador de vistas
router.post('/:id/increment-view', companyController.incrementViewCount);

// Guardar/quitar de favoritos
router.post('/:id/save', companyController.saveToFavorites);

// Subir imagen a la galería de la empresa
router.post('/:companyId/gallery', authMiddleware, uploadRateLimit, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'No se proporcionó ninguna imagen', true, 'NO_FILE');
  }

  const companyId = parseInt(req.params.companyId, 10);
  if (isNaN(companyId)) {
    throw new AppError(400, 'ID de empresa no válido', true, 'INVALID_ID');
  }

  // Verificar que la empresa existe
  const [company] = await db
    .select({ id: companies.id, gallery: companies.gallery })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company) {
    throw new AppError(404, 'Empresa no encontrada', true, 'NOT_FOUND');
  }

  // Subir a Supabase
  const fileExtension = req.file.originalname.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `companies/${companyId}/gallery/${fileName}`;

  const { error } = await supabase.storage
    .from('companies')
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new AppError(500, `Error al subir imagen: ${error.message}`, true, 'UPLOAD_ERROR');
  }

  const { data: { publicUrl } } = supabase.storage.from('companies').getPublicUrl(filePath);

  // Actualizar galería de la empresa
  const currentGallery = (company.gallery as string[]) || [];
  await db
    .update(companies)
    .set({ gallery: [...currentGallery, publicUrl] as any })
    .where(eq(companies.id, companyId));

  res.json({ url: publicUrl });
}));

// Obtener una empresa específica por ID
router.get('/:id', companyController.getCompanyById);

// Crear una nueva empresa
router.post('/', companyController.createCompany);

// Actualizar una empresa existente
router.put('/:id', companyController.updateCompany);

// Eliminar una empresa
router.delete('/:id', companyController.deleteCompany);

// Marcar una empresa como principal
router.patch('/:id/set-primary', companyController.setPrimaryCompany);

export default router;
