import { artistStorage } from '../storage/artists.js';
export const artistsController = {
    /**
     * Get artists for map display (only those with coordinates)
     */
    async getArtistsForMap(req, res) {
        try {
            const { limit = 100, category, city } = req.query;
            const artists = await artistStorage.getArtists({
                limit: Number(limit),
                category: category,
                city: city,
            });
            // Transform to map format
            const artistsForMap = artists.map(artist => ({
                id: artist.artist.id,
                userId: artist.artist.userId,
                name: artist.artist.artistName || artist.user.displayName || 'Sin nombre',
                profession: '', // No hay campo profession en el schema
                category: artist.category?.name || '',
                bio: artist.artist.bio,
                description: artist.artist.description,
                city: artist.artist.baseCity, // Usar baseCity en lugar de city
                coordinates: null, // No hay campo coordinates en el schema
                isAvailable: artist.artist.isAvailable,
                rating: artist.artist.rating ? Number(artist.artist.rating) : 0,
                totalReviews: artist.artist.totalReviews || 0,
                profileImageUrl: artist.user.profileImageUrl, // Usar profileImageUrl del user
                tags: artist.artist.tags || [],
                hourlyRate: artist.artist.hourlyRate ? Number(artist.artist.hourlyRate) : 0,
                pricingType: artist.artist.pricingType || 'depends',
                availability: artist.artist.availability,
                createdAt: artist.artist.createdAt,
                updatedAt: artist.artist.updatedAt,
            }));
            res.json(artistsForMap);
        }
        catch (error) {
            console.error('Error getting artists for map:', error);
            res.status(500).json({ message: 'Error al obtener artistas para el mapa' });
        }
    },
    /**
     * Get artists with filters for hiring page
     */
    async getArtistsByFilters(req, res) {
        try {
            const { limit = 50, category, city, priceMin, priceMax, availability } = req.query;
            const artists = await artistStorage.getArtists({
                limit: Number(limit),
                category: category,
                city: city,
                priceMin: priceMin ? Number(priceMin) : undefined,
                priceMax: priceMax ? Number(priceMax) : undefined,
                availability: availability !== undefined ? availability === 'true' : undefined,
            });
            // Transform to frontend format
            const artistsData = artists.map(artist => {
                console.log('🎯 Artists Controller - Datos de artista:', {
                    id: artist.artist.id,
                    name: artist.artist.artistName,
                    description: artist.artist.description,
                    bio: artist.artist.bio
                });
                return {
                    id: artist.artist.id,
                    userId: artist.artist.userId,
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
                    profileImageUrl: artist.user.profileImageUrl,
                    tags: artist.artist.tags || [],
                    hourlyRate: artist.artist.hourlyRate ? Number(artist.artist.hourlyRate) : 0,
                    pricingType: artist.artist.pricingType || 'depends',
                    availability: artist.artist.availability,
                    createdAt: artist.artist.createdAt,
                    updatedAt: artist.artist.updatedAt,
                    workExperience: artist.artist.workExperience || [],
                    education: artist.artist.education || [],
                    socialMedia: artist.user.socialMedia || null,
                    yearsOfExperience: artist.artist.yearsOfExperience,
                };
            });
            res.json(artistsData);
        }
        catch (error) {
            console.error('Error getting artists by filters:', error);
            res.status(500).json({ message: 'Error al obtener artistas' });
        }
    },
    /**
     * Get artist by ID
     */
    async getArtistById(req, res) {
        try {
            const { id } = req.params;
            const artist = await artistStorage.getArtist(Number(id)); // Convertir id a number
            if (!artist) {
                return res.status(404).json({ message: 'Artista no encontrado' });
            }
            // Transform to frontend format
            const artistData = {
                id: artist.artist.id,
                userId: artist.artist.userId,
                name: artist.artist.artistName || artist.user.displayName || 'Sin nombre',
                profession: '', // No hay campo profession en el schema
                category: artist.category?.name || '',
                bio: artist.artist.bio,
                description: artist.artist.description,
                city: artist.artist.baseCity, // Usar baseCity en lugar de city
                coordinates: null, // No hay campo coordinates en el schema
                isAvailable: artist.artist.isAvailable,
                rating: artist.artist.rating ? Number(artist.artist.rating) : 0,
                totalReviews: artist.artist.totalReviews || 0,
                profileImageUrl: artist.user.profileImageUrl,
                tags: artist.artist.tags || [],
                hourlyRate: artist.artist.hourlyRate ? Number(artist.artist.hourlyRate) : 0,
                pricingType: artist.artist.pricingType || 'depends',
                availability: artist.artist.availability,
                createdAt: artist.artist.createdAt,
                updatedAt: artist.artist.updatedAt,
                // Campos de perfil completo
                workExperience: artist.artist.workExperience || [],
                education: artist.artist.education || [],
                socialMedia: artist.user.socialMedia || null,
                yearsOfExperience: artist.artist.yearsOfExperience,
            };
            res.json(artistData);
        }
        catch (error) {
            console.error('Error getting artist by ID:', error);
            res.status(500).json({ message: 'Error al obtener artista' });
        }
    },
};
