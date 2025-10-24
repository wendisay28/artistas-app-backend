import swaggerJsdoc from 'swagger-jsdoc';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = require(join(__dirname, '../../../../package.json'));
const version = packageJson.version;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BuscartPro API',
      version,
      description: 'API para la plataforma BuscartPro - Conexión de artistas y empresas',
      contact: {
        name: 'BuscartPro Team',
        email: 'support@buscartpro.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
      {
        url: 'https://api.buscartpro.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token de autenticación Firebase',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
            details: {
              type: 'string',
              description: 'Solo en desarrollo',
            },
          },
        },
        SavedItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            userId: {
              type: 'string',
              example: 'user-id-123',
            },
            postId: {
              type: 'integer',
              example: 42,
            },
            notes: {
              type: 'string',
              nullable: true,
              example: 'Mis notas sobre este post',
            },
            savedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-16T12:00:00Z',
            },
            post: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                title: { type: 'string' },
                excerpt: { type: 'string' },
                featuredImage: { type: 'string' },
                category: { type: 'string' },
              },
            },
          },
        },
        GalleryItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            userId: {
              type: 'string',
              example: 'user-id-123',
            },
            title: {
              type: 'string',
              nullable: true,
              example: 'Mi foto artística',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Descripción de la foto',
            },
            imageUrl: {
              type: 'string',
              example: 'https://storage.supabase.co/image.jpg',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['arte', 'portfolio'],
            },
            isPublic: {
              type: 'boolean',
              example: true,
            },
            metadata: {
              type: 'object',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        FeaturedItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            userId: {
              type: 'string',
              example: 'user-id-123',
            },
            title: {
              type: 'string',
              example: 'Mi video destacado',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Descripción del video',
            },
            url: {
              type: 'string',
              example: 'https://youtube.com/watch?v=abc123',
            },
            type: {
              type: 'string',
              enum: ['youtube', 'spotify', 'vimeo', 'soundcloud', 'other'],
              example: 'youtube',
            },
            thumbnailUrl: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/thumb.jpg',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticación inválido o faltante',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'No se proporcionó el token de autenticación',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Recurso no encontrado',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: 'Datos inválidos',
                code: 'INVALID_DATA',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Saved Items',
        description: 'Gestión de elementos guardados (favoritos)',
      },
      {
        name: 'Portfolio',
        description: 'Gestión de portfolio de artistas (fotos y videos)',
      },
      {
        name: 'Health',
        description: 'Endpoints de salud y monitoreo',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
