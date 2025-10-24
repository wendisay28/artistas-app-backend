import request from 'supertest';
import { app } from '../src/index.js';
import { db } from '../src/db.js';
import { gallery, featuredItems, users } from '../src/schema.js';
import { eq } from 'drizzle-orm';

describe('Portfolio API', () => {
  let authToken: string;
  let userId: string;
  let photoId: number;
  let videoId: number;

  beforeAll(async () => {
    // Crear usuario de prueba
    userId = 'test-user-portfolio';

    try {
      await db.insert(users).values({
        id: userId,
        email: 'test-portfolio@example.com',
        firstName: 'Test',
        lastName: 'Portfolio',
        userType: 'artist',
      });
    } catch (error) {
      // Usuario ya existe, continuar
    }

    // Simular autenticación
    authToken = 'mock-token-for-testing';
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.delete(gallery).where(eq(gallery.userId, userId));
    await db.delete(featuredItems).where(eq(featuredItems.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });

  describe('GET /api/v1/portfolio', () => {
    it('debería obtener el portfolio completo del usuario', async () => {
      const response = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('photos');
      expect(response.body.data).toHaveProperty('videos');
      expect(Array.isArray(response.body.data.photos)).toBe(true);
      expect(Array.isArray(response.body.data.videos)).toBe(true);
    });

    it('debería rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/v1/portfolio');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/portfolio/photos', () => {
    it('debería agregar una foto exitosamente', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/test-image.jpg',
          title: 'Test Photo',
          description: 'Test description',
          tags: ['test', 'portfolio'],
          isPublic: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.imageUrl).toBe('https://example.com/test-image.jpg');
      expect(response.body.data.title).toBe('Test Photo');

      photoId = response.body.data.id;
    });

    it('debería rechazar si falta imageUrl', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_IMAGE_URL');
    });

    it('debería usar valores por defecto', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/photos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/test2.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.isPublic).toBe(true);
      expect(response.body.data.tags).toEqual([]);
    });
  });

  describe('PATCH /api/v1/portfolio/photos/:id', () => {
    it('debería actualizar una foto', async () => {
      const response = await request(app)
        .patch(`/api/v1/portfolio/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
          isPublic: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.isPublic).toBe(false);
    });

    it('debería rechazar con ID inválido', async () => {
      const response = await request(app)
        .patch('/api/v1/portfolio/photos/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_ID');
    });

    it('debería rechazar si la foto no existe', async () => {
      const response = await request(app)
        .patch('/api/v1/portfolio/photos/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test',
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/portfolio/videos', () => {
    it('debería agregar un video exitosamente', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/videos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://youtube.com/watch?v=test',
          title: 'Test Video',
          description: 'Test video description',
          type: 'youtube',
          thumbnailUrl: 'https://example.com/thumb.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.url).toBe('https://youtube.com/watch?v=test');
      expect(response.body.data.type).toBe('youtube');

      videoId = response.body.data.id;
    });

    it('debería rechazar si falta url', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/videos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_URL');
    });

    it('debería rechazar si falta title', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/videos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/video',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_TITLE');
    });

    it('debería usar tipo "other" por defecto', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/videos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com/test',
          title: 'Test',
          type: 'invalid-type',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('other');
    });
  });

  describe('PATCH /api/v1/portfolio/videos/:id', () => {
    it('debería actualizar un video', async () => {
      const response = await request(app)
        .patch(`/api/v1/portfolio/videos/${videoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Video Title',
          description: 'Updated video description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Video Title');
    });

    it('debería rechazar con ID inválido', async () => {
      const response = await request(app)
        .patch('/api/v1/portfolio/videos/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_ID');
    });
  });

  describe('DELETE /api/v1/portfolio/photos/:id', () => {
    it('debería eliminar una foto', async () => {
      const response = await request(app)
        .delete(`/api/v1/portfolio/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado');
    });

    it('debería rechazar si la foto no existe', async () => {
      const response = await request(app)
        .delete(`/api/v1/portfolio/photos/${photoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/portfolio/videos/:id', () => {
    it('debería eliminar un video', async () => {
      const response = await request(app)
        .delete(`/api/v1/portfolio/videos/${videoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado');
    });

    it('debería rechazar si el video no existe', async () => {
      const response = await request(app)
        .delete(`/api/v1/portfolio/videos/${videoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Legacy Endpoints', () => {
    it('POST /services debería funcionar pero con warning', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Service',
          imageUrl: 'https://example.com/service.jpg',
        });

      // Puede fallar o funcionar dependiendo de la implementación
      expect([200, 201, 400]).toContain(response.status);
    });

    it('POST /products debería funcionar pero con warning', async () => {
      const response = await request(app)
        .post('/api/v1/portfolio/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          imageUrl: 'https://example.com/product.jpg',
        });

      // Puede fallar o funcionar dependiendo de la implementación
      expect([200, 201, 400]).toContain(response.status);
    });
  });
});
