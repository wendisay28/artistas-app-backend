import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm/sql';
import { sql } from 'drizzle-orm';

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

// Extender la interfaz Request para incluir el usuario y el token decodificado
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        userType: 'artist' | 'general' | 'company';
        [key: string]: any;
      };
      decodedToken?: DecodedIdToken | CustomDecodedToken;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Iniciando autenticación...');
    
    // 1. Verificar el encabezado de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('❌ No se proporcionó el encabezado de autorización');
      return res.status(401).json({ 
        success: false,
        error: 'No se proporcionó el token de autenticación' 
      });
    }

    // 2. Verificar el formato del token
    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Formato de token inválido');
      return res.status(401).json({ 
        success: false,
        error: 'Formato de token inválido. Use Bearer token' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('❌ Token no proporcionado');
      return res.status(401).json({ 
        success: false,
        error: 'Token no proporcionado' 
      });
    }
    
    console.log('🔑 Token recibido, verificando con Firebase...');
    
    let decodedToken: DecodedIdToken | CustomDecodedToken;
    
    try {
      // 3. Verificar el token con Firebase Admin
      const decodedTokenResult = await auth.verifyIdToken(token, true); // true para verificar si el token fue revocado
      
      // 4. Obtener información adicional del usuario de Firebase
      const userRecord = await auth.getUser(decodedTokenResult.uid);
      
      // 5. Crear el objeto de token decodificado
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
      
      console.log('✅ Token verificado correctamente para el usuario:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        provider: decodedToken.firebase.sign_in_provider
      });
      
    } catch (error: any) {
      const firebaseError = error as {
        message: string;
        code?: string;
        stack?: string;
      };
      
      console.error('❌ Error al verificar el token:', {
        error: firebaseError.message,
        code: firebaseError.code,
        stack: process.env.NODE_ENV === 'development' ? firebaseError.stack : undefined
      });
      
      let errorMessage = 'Token inválido o expirado';
      let statusCode = 401;
      
      if (firebaseError.code === 'auth/id-token-expired') {
        errorMessage = 'El token ha expirado';
      } else if (firebaseError.code === 'auth/id-token-revoked') {
        errorMessage = 'El token ha sido revocado';
      } else if (firebaseError.code === 'auth/argument-error') {
        errorMessage = 'Token con formato inválido';
      }
      
      return res.status(statusCode).json({ 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // 6. Almacenar el token decodificado en la solicitud
    req.decodedToken = decodedToken;
    
    console.log('🔍 Buscando usuario en la base de datos...', { uid: decodedToken.uid });

    // 7. Verificar si el usuario existe en nuestra base de datos
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decodedToken.uid))
        .limit(1);

      if (!user) {
        console.error('❌ Usuario no encontrado en la base de datos:', { uid: decodedToken.uid });
        return res.status(404).json({ 
          success: false,
          error: 'Usuario no registrado',
          code: 'USER_NOT_FOUND'
        });
      }

      // 8. Agregar el usuario a la solicitud
      const { id, email, userType, ...userData } = user;
      req.user = {
        _id: id,
        email,
        userType: userType as 'artist' | 'general' | 'company',
        ...userData
      };
      
      console.log('✅ Autenticación exitosa para el usuario:', { 
        id: user.id, 
        email: user.email,
        userType: user.userType 
      });
      
      // 9. Continuar con la siguiente función de middleware
      next();
      
    } catch (dbError: unknown) {
      const error = dbError as Error;
      console.error('❌ Error al buscar el usuario en la base de datos:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor al verificar el usuario',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Error en el middleware de autenticación:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      code: 'AUTH_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
