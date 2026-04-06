import { Request, Response } from 'express';
import { artistStorage } from '../storage/artists.js';

export const artistsController = {
  /**
   * Get artists for map display (only those with coordinates)
   */
  async getArtistsForMap(req: Request, res: Response) {
    try {
      const { limit = 100, category, city } = req.query;

      const artists = await artistStorage.getArtists({
        limit: Number(limit),
        category: category as string,
        city: city as string,
      });

      // Transform to map format
      const artistsForMap = artists.map(artist => ({
        id: artist.artist.id,
        name: artist.artist.artistName || artist.user.displayName || 'Sin nombre',
        profession: '',
        category: artist.category?.name || '',
        bio: artist.artist.bio,
        description: artist.artist.description,
        city: artist.artist.baseCity,
        coordinates: null,
        isAvailable: artist.artist.isAvailable,
        rating: artist.artist.rating ? Number(artist.artist.rating) : 0,
        totalReviews: artist.artist.totalReviews || 0,
        profileImageUrl: artist.artist.profileImageUrl,
        tags: artist.artist.tags || [],
        hourlyRate: artist.artist.hourlyRate ? Number(artist.artist.hourlyRate) : 0,
        pricingType: artist.artist.pricingType || 'depends',
        availability: artist.artist.availability,
        createdAt: artist.artist.createdAt,
        updatedAt: artist.artist.updatedAt,
      }));

      res.json(artistsForMap);
    } catch (error) {
      console.error('Error getting artists for map:', error);
      res.status(500).json({ message: 'Error al obtener artistas para el mapa' });
    }
  },

  /**
   * Get artists with filters for hiring page
   */
  async getArtistsByFilters(req: Request, res: Response) {
    try {
      const {
        limit = 50,
        query,
        category,
        city,
        priceMin,
        priceMax,
        availability
      } = req.query;

      const artists = await artistStorage.getArtists({
        limit: Number(limit),
        query: query as string | undefined,
        category: category as string,
        city: city as string,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        availability: availability !== undefined ? availability === 'true' : undefined,
      });

      const artistsData = artists.map(artist => {
        const metadata = artist.artist.artistMetadata as Record<string, any> | undefined;

        return {
          id: artist.artist.id,
          name: artist.artist.artistName || artist.user.displayName || 'Sin nombre',
          profession: '',
          category: artist.category?.name || '',
          categoryId: artist.category?.code,
          disciplineId: artist.discipline?.code,
          roleId: artist.role?.code,
          specialty: metadata?.specialty,
          niche: metadata?.niche,
          bio: artist.artist.bio,
          description: artist.artist.description,
          city: artist.artist.baseCity,
          coordinates: null,
          isAvailable: artist.artist.isAvailable,
          rating: artist.artist.rating ? Number(artist.artist.rating) : 0,
          totalReviews: artist.artist.totalReviews || 0,
          profileImageUrl: artist.artist.profileImageUrl,
          tags: artist.artist.tags || [],
          hourlyRate: artist.artist.hourlyRate ? Number(artist.artist.hourlyRate) : 0,
          pricingType: artist.artist.pricingType || 'depends',
          availability: artist.artist.availability,
          createdAt: artist.artist.createdAt,
          updatedAt: artist.artist.updatedAt,
          workExperience: artist.artist.workExperience || [],
          education: artist.artist.education || [],
          socialMedia: artist.artist.socialMedia || null,
          yearsOfExperience: artist.artist.yearsOfExperience,
        };
      });

      res.json(artistsData);
    } catch (error) {
      console.error('Error getting artists by filters:', error);
      res.status(500).json({ message: 'Error al obtener artistas' });
    }
  },

  /**
   * Get artist by ID (userId string)
   */
  async getArtistById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const artist = await artistStorage.getArtist(id);

      if (!artist) {
        return res.status(404).json({ message: 'Artista no encontrado' });
      }

      const metadata = artist.artist.artistMetadata as Record<string, any> | undefined;
      const artistData = {
        id: artist.artist.id,
        name: artist.artist.artistName || artist.user.displayName || 'Sin nombre',
        profession: '',
        category: artist.category?.name || '',
        categoryId: artist.category?.code,
        disciplineId: artist.discipline?.code,
        roleId: artist.role?.code,
        specialty: metadata?.specialty,
        niche: metadata?.niche,
        bio: artist.artist.bio,
        description: artist.artist.description,
        city: artist.artist.baseCity,
        coordinates: null,
        isAvailable: artist.artist.isAvailable,
        rating: artist.artist.rating ? Number(artist.artist.rating) : 0,
        totalReviews: artist.artist.totalReviews || 0,
        profileImageUrl: artist.artist.profileImageUrl,
        tags: artist.artist.tags || [],
        hourlyRate: artist.artist.hourlyRate ? Number(artist.artist.hourlyRate) : 0,
        pricingType: artist.artist.pricingType || 'depends',
        availability: artist.artist.availability,
        createdAt: artist.artist.createdAt,
        updatedAt: artist.artist.updatedAt,
        workExperience: artist.artist.workExperience || [],
        education: artist.artist.education || [],
        socialMedia: artist.artist.socialMedia || null,
        yearsOfExperience: artist.artist.yearsOfExperience,
      };

      res.json(artistData);
    } catch (error) {
      console.error('Error getting artist by ID:', error);
      res.status(500).json({ message: 'Error al obtener artista' });
    }
  },
};
