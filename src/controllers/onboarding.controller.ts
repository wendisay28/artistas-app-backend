import { Request, Response } from 'express';
import { storage } from '../storage/index.js';
import { eq } from 'drizzle-orm';
import { users, categories, disciplines, roles, specializations } from '../schema.js';
import crypto from 'crypto';
import { EmailService } from '../services/email.service.js'; // Servicio de email

// Helper functions para convertir códigos a IDs
async function getCategoryIdByCode(code: string): Promise<number | null> {
  try {
    const result = await storage.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.code, code))
      .limit(1);
    return result[0]?.id || null;
  } catch (error) {
    console.error(`Error getting category ID for code ${code}:`, error);
    return null;
  }
}

async function getDisciplineIdByCode(code: string): Promise<number | null> {
  try {
    const result = await storage.db
      .select({ id: disciplines.id })
      .from(disciplines)
      .where(eq(disciplines.code, code))
      .limit(1);
    return result[0]?.id || null;
  } catch (error) {
    console.error(`Error getting discipline ID for code ${code}:`, error);
    return null;
  }
}

async function getRoleIdByCode(code: string): Promise<number | null> {
  try {
    const result = await storage.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.code, code))
      .limit(1);
    return result[0]?.id || null;
  } catch (error) {
    console.error(`Error getting role ID for code ${code}:`, error);
    return null;
  }
}

async function getSpecializationIdByCode(code: string): Promise<number | null> {
  try {
    const result = await storage.db
      .select({ id: specializations.id })
      .from(specializations)
      .where(eq(specializations.code, code))
      .limit(1);
    return result[0]?.id || null;
  } catch (error) {
    console.error(`Error getting specialization ID for code ${code}:`, error);
    return null;
  }
}

export const onboardingController = {
  // Obtener el estado actual del onboarding
  async getOnboardingStatus(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const user = await storage.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const userData = user[0];

      return res.json({
        onboardingCompleted: userData.onboardingCompleted || false,
        currentStep: userData.onboardingCompleted ? null : (userData.onboardingStep || 'user-type-selection'),
        onboardingData: userData.onboardingData || {},
        userType: userData.userType,
        emailVerified: userData.emailVerified || false,
      });
    } catch (error) {
      console.error('Error al obtener estado de onboarding:', error);
      return res.status(500).json({ message: 'Error al obtener estado de onboarding' });
    }
  },

  // Guardar progreso del onboarding
  async saveOnboardingProgress(req: any, res: Response) {
    try {
      console.log('💾 saveOnboardingProgress - Inicio');
      console.log('🔍 req.user:', req.user);
      const userId = req.user?.id;
      console.log('🔍 userId:', userId);

      if (!userId) {
        console.error('❌ No hay userId');
        return res.status(401).json({ message: 'No autenticado' });
      }

      const { step, data, userType } = req.body;
      console.log('📦 Datos recibidos:', { step, data, userType });

      // Obtener datos actuales del usuario para combinarlos
      const currentUser = await storage.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const existingData = currentUser[0]?.onboardingData || {};

      // Combinar datos existentes con los nuevos
      const combinedData = {
        ...existingData,
        ...data,
      };

      const updateData: any = {
        onboardingStep: step,
        onboardingData: combinedData, // Guardar datos combinados
        updatedAt: new Date(),
      };

      // Si es el primer paso, guardar la fecha de inicio
      if (step === 'user-type-selection' || step === 'artist-basic-info' || step === 'user-basic-info') {
        updateData.onboardingStartedAt = new Date();
      }

      // Si se especifica el tipo de usuario, actualizarlo
      if (userType) {
        updateData.userType = userType;
      }

      console.log('💾 Actualizando usuario con:', updateData);
      await storage.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      console.log('✅ Progreso guardado exitosamente');
      return res.json({
        success: true,
        message: 'Progreso guardado exitosamente',
      });
    } catch (error: any) {
      console.error('❌ Error al guardar progreso de onboarding:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
      return res.status(500).json({
        message: 'Error al guardar progreso',
        error: error?.message || 'Error desconocido',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
    }
  },

  // Completar onboarding
  async completeOnboarding(req: any, res: Response) {
    try {
      console.log('🚀 completeOnboarding - Inicio');
      const userId = req.user?.id;
      console.log('🔍 userId:', userId);

      if (!userId) {
        console.error('❌ No hay userId');
        return res.status(401).json({ message: 'No autenticado' });
      }

      const { userType, finalData } = req.body;
      console.log('📦 req.body:', JSON.stringify(req.body, null, 2));

      // Actualizar usuario
      const updateData: any = {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingData: finalData,
        onboardingStep: null, // Limpiar el paso actual cuando se completa
        userType: userType || 'general',
        updatedAt: new Date(),
      };

      // Solo agregar los campos si vienen en finalData y no son undefined
      if (finalData?.firstName) updateData.firstName = finalData.firstName;
      if (finalData?.lastName) updateData.lastName = finalData.lastName;
      if (finalData?.username) {
        // Verificar si el username ya existe (y no es del usuario actual)
        try {
          const existingUser = await storage.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, finalData.username))
            .limit(1);

          if (existingUser.length > 0 && existingUser[0].id !== userId) {
            console.error('❌ Username ya existe:', finalData.username);
            return res.status(400).json({
              message: 'El nombre de usuario ya está en uso',
              field: 'username'
            });
          }

          updateData.username = finalData.username;
          // Si es artista y no tiene firstName, usar username como displayName
          if (userType === 'artist' && !finalData?.firstName) {
            updateData.displayName = finalData.username;
          }
        } catch (usernameError) {
          console.error('❌ Error verificando username:', usernameError);
          throw usernameError;
        }
      }
      if (finalData?.city) updateData.city = finalData.city;
      if (finalData?.shortBio) updateData.shortBio = finalData.shortBio;
      if (finalData?.interestedCategories) updateData.interestedCategories = finalData.interestedCategories;
      if (finalData?.interestedTags) updateData.interestedTags = finalData.interestedTags;

      console.log('💾 Actualizando usuario con updateData:', JSON.stringify(updateData, null, 2));
      await storage.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      console.log('✅ Usuario actualizado correctamente');

      // Si es artista, actualizar campos de artista en users (artists merged into users)
      if (userType === 'artist') {
        console.log('🎨 El usuario es artista, procesando perfil de artista en users...');

        // Convertir códigos a IDs
        const categoryId = finalData?.categoryId ? await getCategoryIdByCode(finalData.categoryId) : null;
        const disciplineId = finalData?.disciplineId ? await getDisciplineIdByCode(finalData.disciplineId) : null;
        const roleId = finalData?.roleId ? await getRoleIdByCode(finalData.roleId) : null;
        const specializationId = finalData?.specializationId ? await getSpecializationIdByCode(finalData.specializationId) : null;

        // Convertir additionalTalents (array de códigos a array de IDs)
        const additionalTalents: number[] = [];
        if (finalData?.additionalTalents && Array.isArray(finalData.additionalTalents)) {
          for (const talent of finalData.additionalTalents) {
            const disciplineCode = talent.disciplineId || talent;
            const id = await getDisciplineIdByCode(disciplineCode);
            if (id !== null) {
              additionalTalents.push(id);
            }
          }
        }

        await storage.db
          .update(users)
          .set({
            userType: 'artist',
            artistName: finalData?.username || 'Artista',
            stageName: finalData?.stageName || finalData?.username || null,
            categoryId,
            disciplineId,
            roleId,
            specializationId,
            additionalTalents,
            subcategories: finalData?.subcategories || [],
            tags: finalData?.tags || [],
            baseCity: finalData?.city,
            availability: finalData?.availability || {},
            gallery: finalData?.gallery || [],
            isAvailable: finalData?.isAvailable !== undefined ? finalData.isAvailable : true,
            isProfileComplete: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      // Determinar redirección
      const redirectTo = userType === 'artist' ? '/dashboard' : '/dashboard';

      console.log('🎉 Onboarding completado exitosamente');
      return res.json({
        success: true,
        message: 'Onboarding completado exitosamente',
        data: {
          userId,
          userType,
          onboardingCompleted: true,
          redirectTo,
        },
      });
    } catch (error: any) {
      console.error('❌ Error al completar onboarding:', error);
      console.error('❌ Error stack:', error?.stack);
      console.error('❌ Error message:', error?.message);
      return res.status(500).json({
        message: 'Error al completar onboarding',
        error: error?.message || 'Error desconocido',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
    }
  },

  // Enviar email de verificación
  async sendVerificationEmail(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const user = await storage.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const userData = user[0];

      // Si ya está verificado, no hacer nada
      if (userData.emailVerified) {
        return res.json({
          success: true,
          message: 'El email ya está verificado',
        });
      }

      // Generar token de verificación
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expira en 24 horas

      // Guardar token
      await storage.db
        .update(users)
        .set({
          emailVerificationToken: verificationToken,
          emailVerificationExpires: expiresAt,
        })
        .where(eq(users.id, userId));

      // Enviar email (implementar según tu servicio de email)
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      try {
        await EmailService.sendTicketEmail({
          to: userData.email,
          subject: 'Verifica tu correo electrónico',
          text: `Por favor verifica tu correo electrónico haciendo clic en el siguiente enlace: ${verificationUrl}`,
          html: `
            <h1>Verifica tu correo electrónico</h1>
            <p>Por favor haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>Este enlace expirará en 24 horas.</p>
            <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
          `,
        });
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
        // No fallar si el email no se puede enviar
      }

      return res.json({
        success: true,
        message: 'Email de verificación enviado',
      });
    } catch (error) {
      console.error('Error al enviar email de verificación:', error);
      return res.status(500).json({ message: 'Error al enviar email de verificación' });
    }
  },

  // Verificar email
  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Token no proporcionado' });
      }

      const user = await storage.db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: 'Token inválido' });
      }

      const userData = user[0];

      // Verificar si el token ha expirado
      if (userData.emailVerificationExpires && new Date() > userData.emailVerificationExpires) {
        return res.status(400).json({ message: 'El token ha expirado' });
      }

      // Marcar email como verificado
      await storage.db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id));

      return res.json({
        success: true,
        message: 'Email verificado exitosamente',
      });
    } catch (error) {
      console.error('Error al verificar email:', error);
      return res.status(500).json({ message: 'Error al verificar email' });
    }
  },
};
