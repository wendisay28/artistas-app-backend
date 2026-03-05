import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.middleware.js';
import { uploadRateLimit } from '../middleware/userRateLimit.middleware.js';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const uploadRoutes = Router();

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato no soportado: ${file.mimetype}. Usa JPG, PNG, GIF o WebP.`));
    }
  }
});

// Crear cliente de Supabase con service role (bypass RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Mapa folder → bucket de Supabase (el cliente solo indica el "tipo", el backend elige el bucket)
const BUCKET_MAP: Record<string, string> = {
  avatars:   'avatars',
  covers:    'covers',
  posts:     'posts',
  portfolio: 'portfolios',
  services:  'services',
  products:  'products',
};
const DEFAULT_BUCKET = 'posts';

type AllowedPath = keyof typeof BUCKET_MAP;

/**
 * POST /api/v1/upload/image
 * Sube una imagen a Supabase Storage
 */
uploadRoutes.post('/image',
  authMiddleware,
  uploadRateLimit,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, 'No se proporcionó ningún archivo', true, 'NO_FILE');
    }

    // El cliente indica el tipo (avatars, covers, etc.); el backend elige el bucket real
    const folder = (req.body.path ?? '') as AllowedPath;
    const bucket = BUCKET_MAP[folder] ?? DEFAULT_BUCKET;

    // Generar nombre único para el archivo
    const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    // Guardar directamente en la raíz del bucket (cada bucket ya es específico)
    const filePath = fileName;


    // Subir a Supabase con service role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new AppError(500, `Error al subir imagen: ${error.message}`, true, 'UPLOAD_ERROR');
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);


    res.json({
      success: true,
      fileName: req.file.originalname,
      downloadURL: publicUrl,
      path: filePath,
    });
  })
);

/**
 * POST /api/v1/upload/video
 * Sube un video a Supabase Storage
 */
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/3gpp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato de video no soportado: ${file.mimetype}`));
    }
  },
});

uploadRoutes.post('/video',
  authMiddleware,
  uploadVideo.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, 'No se proporcionó ningún archivo de video', true, 'NO_FILE');
    }

    const fileExtension = req.file.originalname.split('.').pop() || 'mp4';
    const fileName = `${uuidv4()}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new AppError(500, `Error al subir video: ${error.message}`, true, 'UPLOAD_ERROR');
    }

    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);


    res.json({
      success: true,
      fileName: req.file.originalname,
      downloadURL: publicUrl,
      path: fileName,
    });
  })
);

/**
 * POST /api/v1/upload/images (múltiples imágenes)
 * Sube múltiples imágenes a Supabase Storage
 */
uploadRoutes.post('/images',
  authMiddleware,
  uploadRateLimit,
  upload.array('files', 10), // Máximo 10 archivos
  asyncHandler(async (req, res) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new AppError(400, 'No se proporcionaron archivos', true, 'NO_FILES');
    }

    const folder = (req.body.path ?? '') as AllowedPath;
    const bucket = BUCKET_MAP[folder] ?? DEFAULT_BUCKET;


    const uploadPromises = req.files.map(async (file) => {
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        return {
          success: false,
          fileName: file.originalname,
          error: error.message
        };
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        fileName: file.originalname,
        downloadURL: publicUrl,
        path: filePath
      };
    });

    const results = await Promise.all(uploadPromises);


    res.json({
      success: true,
      results
    });
  })
);

export default uploadRoutes;
