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
      async verifyIdToken(_token: string) {
        return { uid: 'dev-user' };
      },
      async getUser(_uid: string) {
        return {
          uid: 'dev-user',
          email: 'dev@example.com',
          providerData: [{ providerId: 'password' }],
        };
      },
    };
  } else {
    logger.error('Error crítico al inicializar Firebase Admin', error as Error, 'Firebase');
    throw error;
  }
}

export { auth };