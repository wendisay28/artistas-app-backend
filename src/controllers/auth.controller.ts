
import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { AuthService, AuthenticationError } from '../services/auth.service.js';
import { db } from '../db.js';
import { users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { auth } from '../config/firebase.js';

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      res.json(result);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async getUser(req: Request, res: Response) {
    res.json(req.user);
  },

  /**
   * Sincroniza el usuario de Firebase con la base de datos local
   * Crea el usuario si no existe, o lo actualiza si es necesario
   */
  async syncUser(req: Request, res: Response) {
    try {
      const firebaseUser = req.user; // Usuario autenticado por el middleware
      
      if (!firebaseUser) {
        return res.status(401).json({ 
          success: false, 
          error: 'No autenticado' 
        });
      }

      // Obtener información actualizada de Firebase
      let firebaseInfo;
      try {
        firebaseInfo = await auth.getUser(firebaseUser._id);
      } catch (error) {
        console.error('Error al obtener información de Firebase:', error);
        return res.status(401).json({
          success: false,
          error: 'Error al verificar la autenticación',
          details: 'No se pudo obtener la información del usuario de Firebase'
        });
      }

      // Verificar si el usuario ya existe en la base de datos
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, firebaseUser._id))
        .limit(1);

      let user = existingUser;

      // Si el usuario no existe, crearlo
      if (!existingUser) {
        console.log(`Creando nuevo usuario en la base de datos: ${firebaseUser._id}`);
        
        try {
          // Preparar datos del usuario
          const email = firebaseInfo.email || ''; // Asegurar que email no sea undefined
          const displayName = firebaseInfo.displayName || email.split('@')[0] || 'Usuario';
          const [firstName, ...lastNameParts] = displayName.split(' ');
          const lastName = lastNameParts.join(' ') || null;
          
          // Insertar el usuario en la base de datos con los valores por defecto
          const result = await db
            .insert(users)
            .values({
              id: firebaseUser._id,
              email: email,
              firstName: firstName,
              lastName: lastName,
              displayName: displayName,
              profileImageUrl: firebaseInfo.photoURL || null,
              userType: 'general' as const, // Tipo de usuario por defecto
              isVerified: firebaseInfo.emailVerified || false,
              // Campos de onboarding - usuario nuevo necesita completar onboarding
              emailVerified: firebaseInfo.emailVerified || false,
              onboardingCompleted: false,
              onboardingStep: 'user-type-selection',
              onboardingStartedAt: sql`CURRENT_TIMESTAMP`,
              // Valores por defecto
              isFeatured: false,
              isAvailable: true,
              rating: sql`0.00::numeric`,
              totalReviews: 0,
              fanCount: 0,
              preferences: sql`'{}'::jsonb`,
              settings: sql`'{}'::jsonb`,
              createdAt: sql`CURRENT_TIMESTAMP`,
              updatedAt: sql`CURRENT_TIMESTAMP`
            })
            .returning();
            
          if (result && result.length > 0) {
            user = result[0];
            console.log(`✅ Usuario creado exitosamente: ${user.id}`);
          } else {
            throw new Error('No se pudo crear el usuario en la base de datos');
          }
          
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          console.error('❌ Error al crear el usuario en la base de datos:', errorMessage);
          return res.status(500).json({
            success: false,
            error: 'Error al crear el usuario en la base de datos',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          });
        }
      } else {
        console.log(`✅ Usuario encontrado en la base de datos: ${user.id}`);
        
        // Actualizar información del usuario si es necesario
        try {
          const updates: Record<string, any> = {};
          let needsUpdate = false;
          
          // Verificar si hay campos que necesitan actualización
          if (firebaseInfo.displayName && firebaseInfo.displayName !== user.displayName) {
            updates.displayName = firebaseInfo.displayName;
            needsUpdate = true;
          }
          
          if (firebaseInfo.photoURL && firebaseInfo.photoURL !== user.profileImageUrl) {
            updates.profileImageUrl = firebaseInfo.photoURL;
            needsUpdate = true;
          }
          
          if (firebaseInfo.emailVerified !== undefined && firebaseInfo.emailVerified !== user.isVerified) {
            updates.isVerified = firebaseInfo.emailVerified;
            needsUpdate = true;
          }
          
          // Actualizar si es necesario
          if (needsUpdate) {
            updates.updatedAt = new Date();
            const [updatedUser] = await db
              .update(users)
              .set(updates)
              .where(eq(users.id, user.id))
              .returning();
              
            if (updatedUser) {
              user = updatedUser;
              console.log(`🔄 Usuario actualizado: ${user.id}`);
            }
          }
          
        } catch (updateError) {
          console.error('❌ Error al actualizar el usuario:', updateError);
          // No devolvemos error, solo registramos ya que la operación principal es exitosa
        }
      }

      // Devolver la información del usuario
      res.json({
        success: true,
        user: {
          _id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl,
          userType: user.userType,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
      
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error al sincronizar usuario:', error);
      res.status(500).json({
        success: false,
        error: 'Error al sincronizar el usuario',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};
