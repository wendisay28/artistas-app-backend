import { Router } from 'express';
import { auth } from '../config/firebase';
import { db } from '../db';
import { users } from '../schema';
import { eq, sql } from 'drizzle-orm';
import { SignUpData, SignInData } from '../types/auth';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Registro de usuario
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType = 'general' } = req.body as SignUpData;

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
    });

    // Crear usuario en nuestra base de datos
    const displayName = `${firstName} ${lastName || ''}`.trim();
    
    // Insertar el usuario usando una consulta SQL directa para evitar problemas de tipos
    await db.execute(sql`
      INSERT INTO users (
        id, email, "firstName", "lastName", "displayName", "userType",
        "isVerified", "isFeatured", "isAvailable", rating, "totalReviews", "fanCount",
        preferences, settings
      ) VALUES (
        ${userRecord.uid},
        ${userRecord.email || ''},
        ${firstName},
        ${lastName || null},
        ${displayName},
        ${userType},
        false, false, true, 0.00, 0, 0,
        '{}'::jsonb,
        '{}'::jsonb
      )
    `);

    // Generar token de autenticación
    const token = await auth.createCustomToken(userRecord.uid);
    
    // NOTA: En el frontend, deberás usar signInWithCustomToken para obtener el ID token

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        firstName,
        lastName,
        userType,
      },
      token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(400).json({
      error: 'Error creating user',
      details: error.message,
    });
  }
});

// Login de usuario
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body as SignInData;

    // Verificar credenciales con Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    
    // Obtener usuario de nuestra base de datos
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userRecord.uid));

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Generar token
    const token = await auth.createCustomToken(userRecord.uid);
    
    // NOTA: En el frontend, deberás usar signInWithCustomToken para obtener el ID token

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        profileImageUrl: user.profileImageUrl,
      },
      token,
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      details: error.message,
    });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decodedToken.uid));

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Invalid token',
      details: error.message,
    });
  }
});

// Ruta para sincronizar el usuario de Firebase con la base de datos
router.get('/sync', authMiddleware, authController.syncUser);

export default router;
