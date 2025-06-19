import { Request, Response } from 'express';
import { User, IUser } from '../models/user.model';

export const userController = {
  // Obtener perfil del usuario actual
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
    }
  },

  // Actualizar tipo de perfil
  async updateUserType(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const { userType } = req.body;
      
      // Validar tipo de usuario
      if (!['artist', 'general', 'company'].includes(userType)) {
        return res.status(400).json({ message: 'Tipo de usuario no válido' });
      }
      
      // Actualizar el tipo de usuario
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { userType },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      res.json({
        message: 'Tipo de usuario actualizado correctamente',
        user: updatedUser
      });
      
    } catch (error) {
      console.error('Error al actualizar tipo de usuario:', error);
      res.status(500).json({ message: 'Error al actualizar el tipo de usuario' });
    }
  },

  // Actualizar perfil
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const updateData = req.body;
      
      // Eliminar campos que no se pueden actualizar
      const { password, email, userType, ...safeUpdateData } = updateData;
      
      // Actualizar el perfil
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        safeUpdateData,
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      res.json({
        message: 'Perfil actualizado correctamente',
        user: updatedUser
      });
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ message: 'Error al actualizar el perfil' });
    }
  },

  // Obtener perfil público
  async getPublicProfile(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId)
        .select('-password -email -isVerified -__v')
        .lean();
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Filtrar datos según el tipo de perfil
      let profileData: Partial<IUser> = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        city: user.city,
        bio: user.bio,
        userType: user.userType,
        socialMedia: user.socialMedia
      };
      
      // Añadir campos específicos según el tipo de perfil
      if (user.userType === 'artist') {
        profileData = {
          ...profileData,
          artisticName: user.artisticName,
          artisticCategories: user.artisticCategories,
          skills: user.skills,
          portfolio: user.portfolio
        };
      } else if (user.userType === 'company') {
        profileData = {
          ...profileData,
          companyName: user.companyName,
          companyCategory: user.companyCategory,
          address: user.address,
          services: user.services
        };
      }
      
      res.json(profileData);
      
    } catch (error) {
      console.error('Error al obtener perfil público:', error);
      res.status(500).json({ message: 'Error al obtener el perfil' });
    }
  }
};
