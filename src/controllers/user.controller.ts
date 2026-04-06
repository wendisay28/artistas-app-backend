import { Request, Response } from 'express';
import { storage } from '../storage/index.js';
import { auth } from '../config/firebase.js';
import { users, companies, reviews, categories, disciplines, roles, specializations, gallery, featuredItems } from '../schema.js';
import { eq, and, or, desc, sql } from 'drizzle-orm';

export const userController = {
  async getProfile(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'No autenticado' });
      
      let user = await storage.getUser(userId);
      
      // Si no existe en PostgreSQL, crearlo desde Firebase
      if (!user) {
        console.log('🔄 Usuario no encontrado en BD, sincronizando desde Firebase:', userId);
        
        try {
          // Obtener usuario desde Firebase
          const firebaseUser: any = await auth.getUser(userId);
          if (!firebaseUser) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
          }
          
          // Crear usuario en PostgreSQL con datos básicos de Firebase
          const newUser = await storage.upsertUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email || '',
            profileImageUrl: firebaseUser.photoURL || null,
            isVerified: true,
            userType: 'general', // Por defecto, luego puede actualizar a 'artist'
            onboardingCompleted: false,
          } as any);
          
          console.log('✅ Usuario sincronizado correctamente:', newUser.id);
          user = newUser;
        } catch (firebaseError) {
          console.error('❌ Error al sincronizar usuario desde Firebase:', firebaseError);
          return res.status(500).json({ message: 'Error al sincronizar usuario' });
        }
      }
      
      return res.json(user);
    } catch (e) {
      console.error('getProfile error:', e);
      return res.status(500).json({ message: 'Error al obtener el perfil' });
    }
  },

  async updateUserType(req: any, res: Response) {
    try {
      console.log('🔄 updateUserType: Iniciando');
      console.log('🔄 req.user:', req.user);
      console.log('🔄 req.body:', req.body);
      
      const userId = req.user?.id;
      if (!userId) {
        console.error('❌ No hay userId');
        return res.status(401).json({ message: 'No autenticado' });
      }
      
      const { userType } = req.body || {};
      console.log('🔄 userType recibido:', userType);
      
      const allowed = ['general', 'artist', 'company'];
      if (!allowed.includes(userType)) {
        console.error('❌ userType inválido:', userType);
        return res.status(400).json({ message: 'userType inválido' });
      }
      
      console.log('🔄 Llamando a storage.upsertUser con:', { id: userId, userType });
      const updated = await storage.upsertUser({ id: userId, userType });
      console.log('✅ Usuario actualizado:', updated);
      
      return res.json(updated);
    } catch (e: any) {
      console.error('❌ updateUserType error:', e);
      console.error('❌ Stack:', e.stack);
      return res.status(500).json({ message: 'Error al actualizar el tipo de usuario', error: e.message });
    }
  },

  async updateProfile(req: any, res: Response) {
    try {
      console.log('🔵 updateProfile - req.body:', JSON.stringify(req.body, null, 2));

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'No autenticado' });
      const {
        email,
        displayName,
        firstName: rawFirstName,
        lastName: rawLastName,
        username,
        photoURL,
        profileImageUrl,
        coverImageUrl,
        bio,
        city,
        schedule,
        address,
        isVerified,
        userType,
        role,
        onboardingCompleted,
        socialMedia,
      } = req.body || {};

      // Resolver firstName/lastName desde displayName si no vienen explícitos
      let firstName = rawFirstName;
      let lastName = rawLastName;
      if (!firstName && displayName) {
        const parts = displayName.trim().split(' ');
        firstName = parts[0] ?? '';
        lastName = parts.slice(1).join(' ') || undefined;
      }

      // Validar userType opcionalmente (acepta también "role" que envía el onboarding)
      const rawUserType = userType ?? role;
      let safeUserType: 'general' | 'artist' | 'company' | undefined = undefined as any;
      if (rawUserType !== undefined) {
        const allowed = ['general', 'artist', 'company'];
        if (!allowed.includes(rawUserType)) {
          return res.status(400).json({ message: 'userType inválido' });
        }
        safeUserType = rawUserType;
      }

      // Build update object with only defined values
      const updateData: any = { id: userId };
      if (email !== undefined) updateData.email = email;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (firstName !== undefined && firstName !== null) updateData.firstName = firstName;
      if (lastName !== undefined && lastName !== null) updateData.lastName = lastName;
      if (username !== undefined && username !== null) updateData.username = username;
      // photoURL es alias de profileImageUrl (lo usa el onboarding)
      const resolvedImageUrl = profileImageUrl ?? photoURL;
      if (resolvedImageUrl !== undefined) updateData.profileImageUrl = resolvedImageUrl;
      if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (city !== undefined) updateData.city = city;
      if (schedule !== undefined) updateData.schedule = schedule;
      if (address !== undefined) updateData.address = address;
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (safeUserType !== undefined) updateData.userType = safeUserType;
      if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;
      if (socialMedia !== undefined) updateData.socialMedia = socialMedia;

      console.log('🔵 updateProfile - updateData:', JSON.stringify(updateData, null, 2));

      const updated = await storage.upsertUser(updateData);
      return res.json(updated);
    } catch (e) {
      console.error('updateProfile error:', e);
      return res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
  },

  async getPublicProfile(req: any, res: Response) {
    try {
      const userId = req.params.userId || req.params.id;
      if (!userId) return res.status(400).json({ message: 'userId requerido' });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      return res.json(user);
    } catch (e) {
      console.error('getPublicProfile error:', e);
      return res.status(500).json({ message: 'Error al obtener el perfil público' });
    }
  },

  async searchUsers(req: any, res: Response) {
    try {
      const { q, limit = '5' } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({ users: [] });
      }

      const searchQuery = q.trim().toLowerCase();
      const limitNum = Math.min(parseInt(limit as string) || 5, 20); // Max 20 results

      const users = await storage.searchUsers(searchQuery, limitNum);

      // Formatear resultado para el frontend
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario',
        username: user.username,
        avatar: user.profileImageUrl,
        verified: user.isVerified,
        category: user.userType === 'artist' ? 'artist' : undefined,
      }));

      return res.json({ users: formattedUsers });
    } catch (e) {
      console.error('searchUsers error:', e);
      return res.status(500).json({ message: 'Error al buscar usuarios' });
    }
  }
};
