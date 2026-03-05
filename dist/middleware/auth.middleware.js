import { auth } from '../config/firebase.js';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
export const authMiddleware = async (req, res, next) => {
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
        let decodedToken;
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
        }
        catch (error) {
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
                // No crear automáticamente aquí - dejar que el endpoint /auth/sync lo maneje
                console.log('⚠️ Usuario autenticado pero no registrado en BD, delegando a /auth/sync:', decodedToken.uid);
                // Crear un objeto de usuario mínimo para el middleware, sin guardar en BD
                req.user = {
                    id: decodedToken.uid,
                    email: decodedToken.email || '',
                    firstName: decodedToken.name?.split(' ')[0] || 'Usuario',
                    lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
                    displayName: decodedToken.name || 'Usuario',
                    profileImageUrl: null,
                    coverImageUrl: null,
                    userType: 'general',
                    bio: null,
                    city: null,
                    address: null,
                    phone: null,
                    website: null,
                    socialMedia: null,
                    isVerified: false,
                    isFeatured: false,
                    isAvailable: true,
                    rating: null,
                    totalReviews: 0,
                    fanCount: 0,
                    preferences: null,
                    settings: null,
                    lastActive: null,
                    onboardingCompleted: false,
                    onboardingStep: 'user-type-selection',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }
            else {
                // Usando type assertion para resolver temporalmente el conflicto de tipos
                req.user = {
                    ...user,
                    userType: (user.userType || 'general')
                };
            }
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ Usuario autenticado:', { id: req.user.id, email: req.user.email, userType: req.user.userType });
            }
            next();
        }
        catch (dbError) {
            console.error('❌ Error DB auth:', dbError.message);
            return res.status(500).json({
                success: false,
                error: 'Error interno en auth',
                details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
            });
        }
    }
    catch (err) {
        console.error('❌ Error global en middleware auth:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Error interno',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
// Middleware para verificar que el usuario solo pueda modificar su propio perfil
export const checkProfileOwnership = async (req, res, next) => {
    try {
        const { id } = req.params; // ID del perfil a modificar
        const userId = req.user?.id; // ID del usuario autenticado
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado',
                details: 'Debe estar autenticado para realizar esta acción'
            });
        }
        if (id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No autorizado',
                details: 'No puede modificar un perfil que no le pertenece'
            });
        }
        next();
    }
    catch (error) {
        console.error('❌ Error en checkProfileOwnership:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error al verificar permisos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
