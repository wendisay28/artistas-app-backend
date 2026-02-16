import { logger } from './logger.js';

interface EnvVariable {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const envVariables: EnvVariable[] = [
  // Server
  { name: 'PORT', required: false, defaultValue: '5001' },
  { name: 'NODE_ENV', required: false, defaultValue: 'development' },

  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (val) => val.startsWith('postgres://') || val.startsWith('postgresql://'),
    errorMessage: 'DATABASE_URL debe ser una URL válida de PostgreSQL',
  },

  // Firebase
  {
    name: 'FIREBASE_PROJECT_ID',
    required: false, // Cambiado a false para desarrollo
    errorMessage: 'FIREBASE_PROJECT_ID es requerida para autenticación',
  },
  {
    name: 'FIREBASE_CLIENT_EMAIL',
    required: false, // Cambiado a false para desarrollo
    validator: (val) => val.includes('@') && val.includes('.'),
    errorMessage: 'FIREBASE_CLIENT_EMAIL debe ser un email válido',
  },
  {
    name: 'FIREBASE_PRIVATE_KEY',
    required: false, // Cambiado a false para desarrollo
    validator: (val) => val.includes('BEGIN PRIVATE KEY'),
    errorMessage: 'FIREBASE_PRIVATE_KEY debe contener una clave privada válida',
  },

  // Supabase
  {
    name: 'SUPABASE_URL',
    required: false, // Cambiado a false para desarrollo
    validator: (val) => val.startsWith('https://'),
    errorMessage: 'SUPABASE_URL debe ser una URL HTTPS válida',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false, // Cambiado a false para desarrollo
    errorMessage: 'SUPABASE_SERVICE_ROLE_KEY es requerida para storage',
  },

  // Security
  {
    name: 'JWT_SECRET',
    required: false,
    defaultValue: 'default-jwt-secret-change-in-production',
  },
  { name: 'FRONTEND_URL', required: false, defaultValue: 'http://localhost:3000' },
  { name: 'ALLOW_NO_ORIGIN', required: false, defaultValue: 'false' },
];

export function validateEnv(): void {
  logger.info('🔍 Validando variables de entorno...');

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of envVariables) {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (envVar.required && !value) {
      errors.push(
        `❌ Variable requerida faltante: ${envVar.name}${
          envVar.errorMessage ? ` - ${envVar.errorMessage}` : ''
        }`
      );
      continue;
    }

    // Set default value if not provided
    if (!value && envVar.defaultValue) {
      process.env[envVar.name] = envVar.defaultValue;
      warnings.push(
        `⚠️  ${envVar.name} no definida, usando valor por defecto: ${envVar.defaultValue}`
      );
      continue;
    }

    // Validate value if validator is provided
    if (value && envVar.validator && !envVar.validator(value)) {
      errors.push(
        `❌ Valor inválido para ${envVar.name}${
          envVar.errorMessage ? ` - ${envVar.errorMessage}` : ''
        }`
      );
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach((warning) => logger.warn(warning));
  }

  // Check for production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'default-jwt-secret-change-in-production') {
      errors.push('❌ JWT_SECRET debe cambiarse en producción');
    }

    if (process.env.ALLOW_NO_ORIGIN === 'true') {
      errors.push('❌ ALLOW_NO_ORIGIN no debe estar habilitado en producción');
    }
  }

  // Throw error if validation failed
  if (errors.length > 0) {
    logger.error('❌ Validación de variables de entorno falló:');
    errors.forEach((error) => logger.error(error));
    throw new Error(
      'Validación de variables de entorno falló. Revisa los errores arriba.'
    );
  }

  logger.info('✅ Variables de entorno validadas correctamente');
}
