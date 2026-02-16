import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '../utils/logger.js';

let auth: any;

try {
  // Validar que las variables de entorno necesarias estén definidas
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan variables de entorno de Firebase. Asegúrate de definir: ' +
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  // Crear el objeto de credenciales desde variables de entorno
  // La private key puede venir con \n escapados, así que los reemplazamos
  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  // Inicializar Firebase Admin con las credenciales
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });

  auth = getAuth();
  logger.info('Firebase Admin inicializado correctamente', undefined, 'Firebase');
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('No se pudo inicializar Firebase Admin. Usando mock en desarrollo', { error: (error as Error).message }, 'Firebase');
    auth = {
      async verifyIdToken(token: string) {
        // En desarrollo, decodificar el JWT real para extraer uid/email
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          return {
            uid: payload.user_id || payload.sub || 'dev-user',
            email: payload.email || 'dev@example.com',
            iat: payload.iat,
            exp: payload.exp,
            aud: payload.aud,
            iss: payload.iss,
            sub: payload.sub,
            auth_time: payload.auth_time,
            firebase: payload.firebase,
          };
        } catch {
          return { uid: 'dev-user', email: 'dev@example.com' };
        }
      },
      async getUser(uid: string) {
        return {
          uid,
          email: uid === 'dev-user' ? 'dev@example.com' : undefined,
          providerData: [{ providerId: 'google.com' }],
        };
      },
      async createUser(data: any) {
        return { uid: data.uid || 'dev-user', email: data.email };
      },
      async createCustomToken(uid: string) {
        return `mock-token-${uid}`;
      },
    };
  } else {
    logger.error('Error crítico al inicializar Firebase Admin', error as Error, 'Firebase');
    throw error;
  }
}

export { auth };