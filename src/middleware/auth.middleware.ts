import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import type { User, UserWithId } from '../types/user.types.js';

// Nota: la extensión de tipos de Express se resuelve via typeRoots (tsconfig)
// No es necesario importar archivos .d.ts en tiempo de ejecución

// Declarar el módulo para extender el espacio de nombres de Express
declare global {
  namespace Express {
    interface Request {
      user?: UserWithId;  // Usamos UserWithId de user.types.ts
      decodedToken?: DecodedIdToken | { [key: string]: any };
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[] | undefined;
    }
  }
}

interface CustomDecodedToken {
  uid: string;
  email: string;
  iat: number;
  exp: number;
  aud?: string;
  iss?: string;
  sub?: string;
  auth_time?: number;
  firebase?: any;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Iniciando autenticación...');
      console.log('🔍 URL de la solicitud:', req.originalUrl);
      console.log('🔍 Método de la solicitud:', req.method);
      console.log('🔍 Headers recibidos (sin Authorization):', JSON.stringify({
        ...req.headers,
        authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined,
      }, null, 2));
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('❌ No se proporcionó el encabezado de autorización');
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó el token de autenticación',
        details: 'El encabezado Authorization es requerido'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Formato de token inválido');
      console.error('❌ Formato esperado: "Bearer [token]"');
      console.error('❌ Formato recibido:', authHeader ? `"${authHeader.substring(0, 20)}..."` : 'undefined');
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido',
        details: 'Use el formato: Bearer [token]'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('❌ Token no proporcionado después de split');
      console.error('❌ authHeader completo:', authHeader);
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado',
        details: 'El token no se pudo extraer del encabezado Authorization'
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Token extraído (primeros 10 caracteres):', token.substring(0, 10) + '...');
      console.log('🔑 Longitud del token:', token.length);
      console.log('🔑 Verificando token con Firebase...');
    }
    
    // Verificar si el token parece ser un token JWT
    const jwtParts = token.split('.');
    if (jwtParts.length !== 3) {
      console.error('❌ El token no parece ser un JWT válido');
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        details: 'El formato del token no es un JWT válido'
      });
    }

    let decodedToken: DecodedIdToken | CustomDecodedToken;

    try {
      const decodedTokenResult = await auth.verifyIdToken(token, true);
      const userRecord = await auth.getUser(decodedTokenResult.uid);

      decodedToken = {
        uid: userRecord.uid,
        email: userRecord.email || '',
        iat: decodedTokenResult.iat || Math.floor(Date.now() / 1000),
        exp: decodedTokenResult.exp || Math.floor(Date.now() / 1000) + 3600,
        aud: decodedTokenResult.aud || process.env.FIREBASE_PROJECT_ID,
        iss: decodedTokenResult.iss || `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`,
        sub: decodedTokenResult.sub || userRecord.uid,
        auth_time: decodedTokenResult.auth_time || Math.floor(Date.now() / 1000),
        firebase: {
          sign_in_provider: userRecord.providerData[0]?.providerId || 'unknown'
        }
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Token verificado para:', {
          uid: decodedToken.uid,
          email: decodedToken.email,
          provider: decodedToken.firebase.sign_in_provider
        });
      }

    } catch (error: any) {
      console.error('❌ Error al verificar token:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    req.decodedToken = decodedToken;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Buscando usuario en DB:', decodedToken.uid);
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decodedToken.uid))
        .limit(1);

      if (!user) {
        // Usuario autenticado en Firebase pero no existe en nuestra BD
        console.log('⚠️ Usuario autenticado pero no registrado en BD, creando automáticamente:', decodedToken.uid);
        
        // Crear el usuario automáticamente
        try {
          const newUser = await db.insert(users).values({
            id: decodedToken.uid,
            email: (decodedToken as any).email || '',
            firstName: (decodedToken as any).name?.split(' ')[0] || 'Usuario',
            lastName: (decodedToken as any).name?.split(' ').slice(1).join(' ') || '',
            userType: 'general',
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();
          
          console.log('✅ Usuario creado automáticamente en BD');
          
          // Usar el usuario recién creado
          const createdUser = newUser[0];
          req.user = {
            ...createdUser,
            userType: (createdUser.userType || 'general') as 'artist' | 'general' | 'company'
          } as UserWithId;
        } catch (dbError: any) {
          console.error('❌ Error al crear usuario automáticamente:', dbError.message);
          return res.status(500).json({
            success: false,
            error: 'Error al crear usuario',
            details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
        }
      } else {
        // Usando type assertion para resolver temporalmente el conflicto de tipos
        req.user = {
          ...user,
          userType: (user.userType || 'general') as 'artist' | 'general' | 'company'
        } as UserWithId;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Usuario autenticado:', { id: req.user.id, email: req.user.email, userType: req.user.userType });
      }

      next();
    } catch (dbError: any) {
      console.error('❌ Error DB auth:', dbError.message);
      return res.status(500).json({
        success: false,
        error: 'Error interno en auth',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (err: any) {
    console.error('❌ Error global en middleware auth:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error interno',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
