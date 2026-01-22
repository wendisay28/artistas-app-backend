import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { collectionsStorage } from '../storage/collections.js';

const router = Router();

// ============================================================================
// Collections Routes
// ============================================================================

/**
 * GET /api/v1/collections
 * Obtener todas las colecciones del usuario autenticado
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const collections = await collectionsStorage.getUserCollections(userId);
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Error fetching collections' });
  }
});

/**
 * GET /api/v1/collections/:id
 * Obtener una colección específica por ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const collectionId = parseInt(req.params.id);

    const collection = await collectionsStorage.getCollectionById(collectionId, userId);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Error fetching collection' });
  }
});

/**
 * POST /api/v1/collections
 * Crear una nueva colección
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, description, isPublic, coverImageUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = await collectionsStorage.createCollection({
      userId,
      name,
      description,
      isPublic,
      coverImageUrl,
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Error creating collection' });
  }
});

/**
 * PUT /api/v1/collections/:id
 * Actualizar una colección
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const collectionId = parseInt(req.params.id);
    const { name, description, isPublic, coverImageUrl } = req.body;

    const collection = await collectionsStorage.updateCollection(
      collectionId,
      userId,
      { name, description, isPublic, coverImageUrl }
    );

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Error updating collection' });
  }
});

/**
 * DELETE /api/v1/collections/:id
 * Eliminar una colección
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const collectionId = parseInt(req.params.id);

    await collectionsStorage.deleteCollection(collectionId, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Error deleting collection' });
  }
});

/**
 * GET /api/v1/collections/:id/posts
 * Obtener los posts de una colección
 */
router.get('/:id/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const collectionId = parseInt(req.params.id);

    const posts = await collectionsStorage.getCollectionPosts(collectionId, userId);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching collection posts:', error);
    res.status(500).json({ error: 'Error fetching collection posts' });
  }
});

/**
 * POST /api/v1/collections/:id/posts
 * Agregar un post a una colección
 */
router.post('/:id/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const collectionId = parseInt(req.params.id);
    const { postId, postType, notes } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const item = await collectionsStorage.addPostToCollection({
      collectionId,
      postId,
      postType: postType || 'post',
      userId,
      notes,
    });

    if (!item) {
      return res.status(409).json({ error: 'Post already in collection' });
    }

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error adding post to collection:', error);
    if (error.message === 'POST_NOT_FOUND') {
      return res.status(404).json({ error: 'El post no existe o fue eliminado' });
    }
    res.status(500).json({ error: 'Error adding post to collection' });
  }
});

/**
 * DELETE /api/v1/collections/:id/posts/:postId
 * Quitar un post de una colección
 */
router.delete('/:id/posts/:postId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const collectionId = parseInt(req.params.id);
    const postId = parseInt(req.params.postId);
    const postType = req.query.postType as string || 'post';

    await collectionsStorage.removePostFromCollection(collectionId, postId, userId, postType);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing post from collection:', error);
    res.status(500).json({ error: 'Error removing post from collection' });
  }
});

/**
 * GET /api/v1/collections/posts/:postId/check
 * Verificar si un post está en alguna colección del usuario
 */
router.get('/posts/:postId/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const postId = parseInt(req.params.postId);
    const postType = req.query.postType as string || 'post';

    const collections = await collectionsStorage.isPostInCollections(userId, postId, postType);
    res.json({ inCollections: collections });
  } catch (error) {
    console.error('Error checking post in collections:', error);
    res.status(500).json({ error: 'Error checking post in collections' });
  }
});

// ============================================================================
// Inspirations Routes
// ============================================================================

/**
 * GET /api/v1/inspirations
 * Obtener todas las inspiraciones del usuario autenticado
 */
router.get('/inspirations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { inspirationType, tags } = req.query;

    const filters: any = {};
    if (inspirationType) filters.inspirationType = inspirationType as string;
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];

    const inspirations = await collectionsStorage.getUserInspirations(userId, filters);
    res.json(inspirations);
  } catch (error) {
    console.error('Error fetching inspirations:', error);
    res.status(500).json({ error: 'Error fetching inspirations' });
  }
});

/**
 * POST /api/v1/inspirations
 * Agregar un post como inspiración
 */
router.post('/inspirations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { postId, postType, inspirationNote, tags, inspirationType } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const inspiration = await collectionsStorage.addInspiration({
      userId,
      postId,
      postType: postType || 'post',
      inspirationNote,
      tags,
      inspirationType,
    });

    if (!inspiration) {
      return res.status(409).json({ error: 'Post already marked as inspiration' });
    }

    res.status(201).json(inspiration);
  } catch (error: any) {
    console.error('Error adding inspiration:', error);
    if (error.message === 'POST_NOT_FOUND') {
      return res.status(404).json({ error: 'El post no existe o fue eliminado' });
    }
    res.status(500).json({ error: 'Error adding inspiration' });
  }
});

/**
 * PUT /api/v1/inspirations/:id
 * Actualizar una inspiración
 */
router.put('/inspirations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const inspirationId = parseInt(req.params.id);
    const { inspirationNote, tags, inspirationType } = req.body;

    const inspiration = await collectionsStorage.updateInspiration(
      inspirationId,
      userId,
      { inspirationNote, tags, inspirationType }
    );

    if (!inspiration) {
      return res.status(404).json({ error: 'Inspiration not found' });
    }

    res.json(inspiration);
  } catch (error) {
    console.error('Error updating inspiration:', error);
    res.status(500).json({ error: 'Error updating inspiration' });
  }
});

/**
 * DELETE /api/v1/inspirations/posts/:postId
 * Quitar un post de inspiraciones
 */
router.delete('/inspirations/posts/:postId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const postId = parseInt(req.params.postId);
    const postType = req.query.postType as string || 'post';

    await collectionsStorage.removeInspiration(userId, postId, postType);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing inspiration:', error);
    res.status(500).json({ error: 'Error removing inspiration' });
  }
});

/**
 * GET /api/v1/inspirations/posts/:postId/check
 * Verificar si un post está marcado como inspiración
 */
router.get('/inspirations/posts/:postId/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const postId = parseInt(req.params.postId);
    const postType = req.query.postType as string || 'post';

    const inspiration = await collectionsStorage.isPostInspiration(userId, postId, postType);
    res.json({ isInspiration: !!inspiration, inspiration });
  } catch (error) {
    console.error('Error checking inspiration:', error);
    res.status(500).json({ error: 'Error checking inspiration' });
  }
});

/**
 * GET /api/v1/inspirations/posts/:postId/stats
 * Obtener estadísticas de cuántos usuarios marcaron este post como inspiración
 */
router.get('/inspirations/posts/:postId/stats', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.postId);
    const count = await collectionsStorage.getPostInspirationCount(postId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching inspiration stats:', error);
    res.status(500).json({ error: 'Error fetching inspiration stats' });
  }
});

export default router;
