import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestApp, TestServer } from './testUtils';

describe('CSRF Protection Tests', () => {
  let testServer: TestServer;
  let csrfToken: string;
  let cookie: string[] = [];

  beforeAll(async () => {
    // Iniciar el servidor de prueba
    testServer = await createTestApp();
    
    // Obtener un token CSRF antes de las pruebas
    const response = await request(testServer.baseUrl)
      .get('/api/auth/csrf-token')
      .expect(200);

    // Guardar el token y la cookie
    csrfToken = response.body.csrfToken;
    if (response.headers['set-cookie']) {
      cookie = Array.isArray(response.headers['set-cookie']) 
        ? response.headers['set-cookie'] 
        : [response.headers['set-cookie']];
    }
  });
  
  afterAll(async () => {
    // Cerrar el servidor de prueba
    if (testServer) {
      await testServer.close();
    }
  });

  it('debería devolver un token CSRF válido', () => {
    expect(csrfToken).toBeDefined();
    expect(typeof csrfToken).toBe('string');
    expect(csrfToken.length).toBeGreaterThan(0);
  });

  it('debería rechazar solicitudes sin token CSRF', async () => {
    await request(testServer.baseUrl)
      .post('/api/auth/verify-csrf')
      .expect(403)
      .then(response => {
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('CSRF_TOKEN_MISSING');
      });
  });

  it('debería rechazar solicitudes con token CSRF inválido', async () => {
    await request(testServer.baseUrl)
      .post('/api/auth/verify-csrf')
      .set('X-CSRF-Token', 'token-invalido')
      .set('Cookie', cookie)
      .expect(403)
      .then(response => {
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('CSRF_TOKEN_MISMATCH');
      });
  });

  it('debería aceptar solicitudes con token CSRF válido', async () => {
    await request(testServer.baseUrl)
      .post('/api/auth/verify-csrf')
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .expect(200)
      .then(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Token CSRF válido');
      });
  });

  it('debería permitir solicitudes GET sin token CSRF', async () => {
    await request(testServer.baseUrl)
      .get('/api/auth/csrf-token')
      .expect(200);
  });

  afterAll(async () => {
    // Cerrar cualquier conexión pendiente
    // (puedes agregar limpieza aquí si es necesario)
  });
});
