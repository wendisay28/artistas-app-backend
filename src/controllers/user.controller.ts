import { Request, Response } from 'express';
import { storage } from '../storage/index.js';

export const userController = {
  async getProfile(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'No autenticado' });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
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
        firstName,
        lastName,
        username,
        profileImageUrl,
        bio,
        city,
        address,
        isVerified,
        userType,
      } = req.body || {};

      // Validar userType opcionalmente
      let safeUserType: 'general' | 'artist' | 'company' | undefined = undefined as any;
      if (userType !== undefined) {
        const allowed = ['general', 'artist', 'company'];
        if (!allowed.includes(userType)) {
          return res.status(400).json({ message: 'userType inválido' });
        }
        safeUserType = userType;
      }

      // Build update object with only defined values
      const updateData: any = { id: userId };
      if (email !== undefined) updateData.email = email;
      if (firstName !== undefined && firstName !== null) updateData.firstName = firstName;
      if (lastName !== undefined && lastName !== null) updateData.lastName = lastName;
      if (username !== undefined && username !== null) updateData.username = username;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (city !== undefined) updateData.city = city;
      if (address !== undefined) updateData.address = address;
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (safeUserType !== undefined) updateData.userType = safeUserType;

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
  }
};
