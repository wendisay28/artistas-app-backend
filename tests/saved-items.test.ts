import request from 'supertest';
import { app } from '../src/index.js';
import { db } from '../src/db.js';
import { savedItems, blogPosts, users } from '../src/schema.js';
import { eq } from 'drizzle-orm';

describe('Saved Items API', () => {
  let authToken: string;
  let userId: string;
  let testPostId: number;
  let savedItemId: number;

  beforeAll(async () => {
    // Crear usuario de prueba
    userId = 'test-user-saved-items';

    try {
      await db.insert(users).values({
        id: userId,
        email: 'test-saved@example.com',
        firstName: 'Test',
        lastName: 'User',
        userType: 'general',
      });
    } catch (error) {
      // Usuario ya existe, continuar
    }

    // Crear post de prueba
    const [post] = await db.insert(blogPosts).values({
      authorId: userId,
      title: 'Test Post for Saved Items',
      slug: 'test-post-saved-items',
      content: 'Test content',
      visibility: 'public',
    }).returning();

    testPostId = post.id;

    // Simular autenticación (debes ajustar según tu setup)
    authToken = 'mock-token-for-testing';
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.delete(savedItems).where(eq(savedItems.userId, userId));
    await db.delete(blogPosts).where(eq(blogPosts.id, testPostId));
    await db.delete(users).where(eq(users.id, userId));
  });

  describe('POST /api/saved-items', () => {
    it('debería guardar un post exitosamente', async () => {
      const response = await request(app)
        .post('/api/saved-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: testPostId,
          notes: 'Test notes',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.postId).toBe(testPostId);

      savedItemId = response.body.data.id;
    });

    it('debería rechazar si falta postId', async () => {
      const response = await request(app)
        .post('/api/saved-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_POST_ID');
    });

    it('debería rechazar si el post no existe', async () => {
      const response = await request(app)
        .post('/api/saved-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: 999999,
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('POST_NOT_FOUND');
    });

    it('debería rechazar si el post ya está guardado', async () => {
      const response = await request(app)
        .post('/api/saved-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: testPostId,
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('ALREADY_SAVED');
    });

    it('debería rechazar sin autenticación', async () => {
      const response = await request(app)
        .post('/api/saved-items')
        .send({
          postId: testPostId,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/saved-items', () => {
    it('debería obtener todos los items guardados', async () => {
      const response = await request(app)
        .get('/api/saved-items')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('post');
    });

    it('debería rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/saved-items');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/saved-items/:id', () => {
    it('debería actualizar las notas de un item', async () => {
      const response = await request(app)
        .patch(`/api/saved-items/${savedItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Updated notes',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe('Updated notes');
    });

    it('debería rechazar con ID inválido', async () => {
      const response = await request(app)
        .patch('/api/saved-items/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_ID');
    });

    it('debería rechazar si el item no existe', async () => {
      const response = await request(app)
        .patch('/api/saved-items/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Test',
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/saved-items/:id', () => {
    it('debería eliminar un item guardado', async () => {
      const response = await request(app)
        .delete(`/api/saved-items/${savedItemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado');
    });

    it('debería rechazar si el item no existe', async () => {
      const response = await request(app)
        .delete(`/api/saved-items/${savedItemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('debería rechazar con ID inválido', async () => {
      const response = await request(app)
        .delete('/api/saved-items/invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_ID');
    });
  });
});
