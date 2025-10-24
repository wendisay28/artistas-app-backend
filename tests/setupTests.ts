// Configuración global para las pruebas
import dotenv from 'dotenv';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env.test
config({ path: '.env.test' });

// Configuración global de Jest
process.env.NODE_ENV = 'test';

// Extender el tipo global para incluir Jest
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch;
    }
  }
}

// Configuración de timeouts globales
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000); // 30 segundos
}

// Configuración de fetch global
if (typeof global.fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.fetch = require('node-fetch');
}
