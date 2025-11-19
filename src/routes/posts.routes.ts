import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { PostService } from '../services/post.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { UserWithId } from '../types/user.types.js';
import multer from 'multer';
import { uploadMediaFiles } from '../services/storage.service.js';

// Extender el tipo Request de Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: UserWithId;
    }
  }
}

const router = Router();

// Configurar Multer con almacenamiento en memoria (los archivos se suben a Supabase)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipo de archivo no permitido'));
  },
});

// Función de ayuda para obtener archivos de la solicitud
function getUploadedFiles(req: Request): Express.Multer.File[] {
  if (!req.files) return [];
  if (Array.isArray(req.files)) return req.files;
  return Object.values(req.files).flat();
}

// Esquema de validación para crear un post
const createPostSchema = z.object({
  content: z.string().min(1).max(10000),
  type: z.enum(['post', 'nota', 'blog']).default('post'),
  // Coerce string "true"/"false" to boolean for FormData compatibility
  isPublic: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    },
    z.boolean().default(true)
  ),
});

// Crear un nuevo post
router.post(
  '/',
  authMiddleware,
  memoryUpload.array('media', 10), // Permitir hasta 10 archivos
  validateRequest(createPostSchema, 'body'),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autorizado' });
      }

      const { content, type, isPublic } = req.body;

      console.log('📝 Creating post:', { userId, content, type, isPublic });

      // Subir archivos a Supabase Storage y construir metadatos
      const uploadedFiles = getUploadedFiles(req);
      console.log('📎 Uploaded files count:', uploadedFiles.length);

      const mediaFiles = await uploadMediaFiles(uploadedFiles, 'posts', userId);
      console.log('✅ Media files uploaded:', mediaFiles.length);

      // Usar el método estático directamente
      const post = await PostService.createPost(
        {
          content,
          type,
          isPublic,
          authorId: userId,
        },
        mediaFiles
      );

      console.log('✅ Post created successfully:', post.id);
      res.status(201).json(post);
    } catch (error) {
      console.error('❌ Error creating post:', error);
      next(error);
    }
  }
);

// Obtener todos los posts
router.get('/', async (req, res, next) => {
  try {
    const { limit = '10', offset = '0', type } = req.query;
    
    // Usar el método estático directamente
    const result = await PostService.getAllPosts(
      parseInt(limit as string),
      parseInt(offset as string),
      type as 'post' | 'nota' | 'blog' | undefined
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Obtener un post por ID
router.get('/:id', async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ message: 'ID de post no válido' });
    }

    // Usar el método estático directamente
    const post = await PostService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// Obtener posts por usuario
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = '10', offset = '0' } = req.query;

    // Usar el método estático directamente
    const posts = await PostService.getPostsByUser(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Actualizar un post
router.put(
  '/:id',
  authMiddleware,
  validateRequest(createPostSchema.partial(), 'body'),
  async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido' });
      }

      // Usar el método estático directamente
      const updatedPost = await PostService.updatePost(
        postId,
        userId,
        req.body
      );
      
      if (!updatedPost) {
        return res.status(404).json({ message: 'Post no encontrado o no autorizado' });
      }

      // Usar el método estático directamente
      res.json(await PostService.getPostById(postId));
    } catch (error) {
      next(error);
    }
  }
);

// Eliminar un post
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (isNaN(postId) || !userId) {
      return res.status(400).json({ message: 'ID de post no válido' });
    }

    // Usar el método estático directamente
    const result = await PostService.deletePost(postId, userId);
    if (!result) {
      return res.status(404).json({ message: 'Post no encontrado o no autorizado' });
    }

    res.json({ message: 'Post eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

// Añadir medios a un post existente
router.post(
  '/:id/media',
  authMiddleware,
  memoryUpload.array('media', 10),
  async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(postId) || !userId) {
        return res.status(400).json({ message: 'ID de post no válido' });
      }

      const uploadedFiles = getUploadedFiles(req);
      const mediaFiles = await uploadMediaFiles(uploadedFiles, 'posts');

      // Usar el método estático directamente
      const result = await PostService.addMediaToPost(postId, userId, mediaFiles);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
