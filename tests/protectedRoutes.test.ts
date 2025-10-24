// Importaciones
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { createTestApp, TestServer } from './testUtils';
import { db } from '../src/db';
import { sql, eq } from 'drizzle-orm';
import { users } from '../src/schema';
import { v4 as uuidv4 } from 'uuid';

describe('Rutas Protegidas con CSRF', () => {
  let testServer: TestServer;
  let testUserId: string | null = null;
  let cookie: string[] = [];
  let csrfToken: string = '';

  // Datos de prueba
  const testUser = {
    id: uuidv4(),
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    userType: 'general' as const,
    isVerified: true,
    isFeatured: false,
    isAvailable: true,
    rating: '0.00',
    totalReviews: 0,
    fanCount: 0,
    preferences: {},
    settings: {},
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeAll(async () => {
    jest.setTimeout(90000); // Aumentar el timeout global para beforeAll
    
    try {
      console.log('🔧 Configurando entorno de prueba...');
      
      // Crear la aplicación de prueba
      try {
        testServer = await createTestApp();
        console.log('✅ Aplicación de prueba iniciada correctamente');
      } catch (appError) {
        console.error('❌ Error al crear la aplicación de prueba:', appError);
        throw appError;
      }
      
      // Verificar si la base de datos está disponible
      if (!db) {
        console.warn('⚠️  La base de datos no está disponible. Algunas pruebas pueden fallar.');
      } else {
        // Intentar insertar usuario de prueba
        try {
          console.log('📝 Insertando usuario de prueba...');
          await db.insert(users).values({
            ...testUser,
            createdAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
            lastActive: sql`CURRENT_TIMESTAMP`
          });
          testUserId = testUser.id;
          console.log('✅ Usuario de prueba insertado correctamente');
        } catch (dbError) {
          console.error('❌ Error al insertar usuario de prueba:', dbError);
          console.warn('⚠️  Continuando sin usuario de prueba');
        }
      }
      
      // Obtener token CSRF
      try {
        console.log('🔑 Obteniendo token CSRF...');
        const csrfResponse = await request(testServer.baseUrl)
          .get('/api/auth/csrf-token')
          .timeout(5000);
          
        if (csrfResponse.status !== 200) {
          console.error('❌ Error al obtener token CSRF:', csrfResponse.body);
          throw new Error(`Error al obtener token CSRF: ${csrfResponse.status}`);
        }
        
        csrfToken = csrfResponse.body.csrfToken;
        console.log('✅ Token CSRF obtenido correctamente');
        
        // Guardar cookies de sesión
        const csrfCookies = csrfResponse.headers['set-cookie'];
        if (csrfCookies) {
          cookie = Array.isArray(csrfCookies) ? csrfCookies : [csrfCookies];
          console.log('🍪 Cookies de sesión guardadas');
        }
      } catch (csrfError) {
        console.error('❌ Error al obtener token CSRF:', csrfError);
        console.warn('⚠️  Continuando sin token CSRF. Algunas pruebas pueden fallar.');
      }
      
    } catch (error) {
      console.error('❌ Error en beforeAll:', error);
      throw error;
    }
  }, 90000); // Timeout de 90 segundos

  afterAll(async () => {
    try {
      // Limpiar el usuario de prueba si existe y la base de datos está disponible
      if (testUserId && db) {
        try {
          await db.delete(users).where(eq(users.id, testUserId));
          console.log('🧹 Usuario de prueba eliminado');
        } catch (error) {
          console.error('❌ Error al limpiar usuario de prueba:', error);
        }
      }
      
      // Cerrar el servidor de prueba
      if (testServer) {
        await testServer.close();
        console.log('🛑 Servidor de prueba detenido');
      }
    } catch (error) {
      console.error('❌ Error en afterAll:', error);
    }
  }, 30000); // Timeout de 30 segundos

  // Prueba de obtención de token CSRF
  it('debería obtener un token CSRF', async () => {
    const response = await request(testServer.baseUrl)
      .get('/api/auth/csrf-token')
      .set('Cookie', cookie)
      .expect(200);
    
    expect(response.body).toHaveProperty('csrfToken');
    expect(typeof response.body.csrfToken).toBe('string');
    
    // Actualizar el token para pruebas posteriores
    csrfToken = response.body.csrfToken;
    
    // Actualizar cookies si es necesario
    const csrfCookies = response.headers['set-cookie'];
    if (csrfCookies) {
      cookie = Array.isArray(csrfCookies) ? csrfCookies : [csrfCookies];
    }
  }, 10000);

  // Prueba de verificación de token CSRF
  it('debería verificar que el token CSRF es válido', async () => {
    const response = await request(testServer.baseUrl)
      .post('/api/auth/verify-csrf')
      .set('Content-Type', 'application/json')
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ token: csrfToken });
    
    // Aceptar tanto 200 como 204 como códigos de éxito
    expect([200, 204]).toContain(response.status);
    
    // Si hay un cuerpo de respuesta, verificar que sea exitoso
    if (response.body) {
      expect(response.body).toHaveProperty('success', true);
    }
  }, 10000);

  // Prueba de ruta protegida con token CSRF
  it('debería rechazar solicitudes POST sin token CSRF', async () => {
    await request(testServer.baseUrl)
      .post('/api/auth/test-csrf')
      .set('Content-Type', 'application/json')
      .set('Cookie', cookie)
      .send({})
      .expect(403); // Se espera un error de prohibido
  }, 10000);

  // Prueba de ruta protegida con token CSRF inválido
  it('debería rechazar solicitudes con token CSRF inválido', async () => {
    await request(testServer.baseUrl)
      .post('/api/auth/test-csrf')
      .set('Content-Type', 'application/json')
      .set('X-CSRF-Token', 'token-invalido')
      .set('Cookie', cookie)
      .send({})
      .expect(403); // Se espera un error de prohibido
  }, 10000);

  // Prueba de ruta protegida con token CSRF válido
  it('debería permitir solicitudes protegidas con token CSRF válido', async () => {
    const response = await request(testServer.baseUrl)
      .post('/api/auth/test-csrf')
      .set('Content-Type', 'application/json')
      .set('X-CSRF-Token', csrfToken)
      .set('Cookie', cookie)
      .send({ token: csrfToken });
    
    // Aceptar tanto 200 como 204 como códigos de éxito
    expect([200, 204]).toContain(response.status);
  }, 10000);

  // Prueba de ruta GET sin token CSRF (debería funcionar)
  it('debería permitir solicitudes GET sin token CSRF', async () => {
    const response = await request(testServer.baseUrl)
      .get('/health')
      .set('Content-Type', 'application/json')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'ok');
  }, 10000);
});