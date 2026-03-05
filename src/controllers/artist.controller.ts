import { Request, Response } from 'express';
import { db } from '../db.js';
import { users, artists, categories, disciplines, roles } from '../schema.js';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { format } from 'date-fns';

// Tipo local flexible para respuesta enriquecida del artista
interface ArtistWithDetails extends Record<string, any> {
  isFeatured: boolean;
  rating: number | null;
  totalReviews: number;
  details: any | null;
}

// Obtener artistas destacados
export const getFeatured = async (req: Request, res: Response) => {
  try {
    const featuredArtists = await db
      .select()
      .from(users)
      .where(and(eq(users.userType, 'artist'), eq(users.isFeatured, true)))
      .limit(10);

    res.json(featuredArtists);
  } catch (error) {
    console.error('Error fetching featured artists:', error);
    res.status(500).json({ message: 'Error al obtener artistas destacados' });
  }
};

// Obtener todos los artistas (formato para el explorador del frontend)
export const getAll = async (req: Request, res: Response) => {
  try {
    // Traer usuarios artistas junto con su perfil de artista y categorías
    const rows = await db
      .select({
        user: users,
        artist: artists,
        category: categories,
        discipline: disciplines,
        role: roles,
      })
      .from(users)
      .leftJoin(artists, eq(artists.userId, users.id))
      .leftJoin(categories, eq(artists.categoryId, categories.id))
      .leftJoin(disciplines, eq(artists.disciplineId, disciplines.id))
      .leftJoin(roles, eq(artists.roleId, roles.id))
      .where(eq(users.userType, 'artist'))
      .orderBy(users.firstName, users.lastName);

    // Mapear al formato que espera el explorador del frontend
    const mapped = rows.map(({ user: u, artist: a, category, discipline, role }) => {
      const nameParts = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      const displayName = u.displayName || nameParts || (u.email?.split('@')[0]) || 'Artista';

      const metadata = (a as any)?.metadata as Record<string, any> | undefined;

      return {
        id: u.id,
        type: 'artist',
        name: displayName,
        bio: u.bio ?? '',
        image: u.profileImageUrl ?? '',
        gallery: [],                        // sin fotos públicas aún
        location: u.city ?? 'Colombia',
        rating: u.rating ? parseFloat(String(u.rating)) : 4.5,
        reviews: (u as any).reviewsCount ?? 0,
        price: a?.pricePerHour ? parseFloat(String(a.pricePerHour)) : 0,
        verified: u.isVerified ?? false,
        tags: a?.tags ?? [],
        services: [],
        // Devolver categoryId/disciplineId/roleId como los otros endpoints
        category: category?.name || '',
        categoryId: category?.code,
        disciplineId: discipline?.code,
        roleId: role?.code,
        specialty: metadata?.specialty,
        niche: metadata?.niche,
        experience: metadata?.yearsExperience || (a?.yearsOfExperience ? `${a.yearsOfExperience} años` : 'No especificado'),
        style: metadata?.style || '',
        availability: metadata?.artistAvailability || 'Disponible',
        responseTime: metadata?.responseTime || 'No especificado',
        // Campos de perfil completo
        workExperience: (a as any)?.workExperience ?? [],
        education: (a as any)?.education ?? [],
        socialMedia: (u as any)?.socialMedia ?? null,
      };
    });

    res.json({ artists: mapped, total: mapped.length });
  } catch (error) {
    console.error('Error fetching all artists:', error);
    res.status(500).json({ message: 'Error al obtener la lista de artistas' });
  }
};

// Obtener un artista por ID
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const artist = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.userType, 'artist')));

    if (artist.length === 0) {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }

    // Obtener detalles adicionales del artista
    const artistDetails = await db
      .select()
      .from(artists)
      .where(eq(artists.userId, id));

    const artistData = artist[0];
    const artistDetail = artistDetails[0] || null;
    const response: ArtistWithDetails = {
      ...artistData,
      // Exponer campos del perfil artista al nivel raíz para que el frontend los encuentre
      description: artistDetail?.description ?? null,
      tags: artistDetail?.tags ?? [],
      yearsOfExperience: artistDetail?.yearsOfExperience ?? null,
      workExperience: artistDetail?.workExperience ?? [],
      education: artistDetail?.education ?? [],
      artistName: artistDetail?.artistName ?? null,
      isFeatured: artistData.isFeatured ?? false,
      rating: artistData.rating ? parseFloat(artistData.rating) : null,
      totalReviews: artistData.totalReviews ?? 0,
      details: artistDetail,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching artist by ID:', error);
    res.status(500).json({ message: 'Error al obtener el artista' });
  }
};

// Exportar controlador para compatibilidad con rutas existentes
export const artistController = {
  async getFeatured(req: Request, res: Response) {
    try {
      const featuredArtists = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.userType, 'artist'),
            eq(users.isFeatured, true)
          )
        )
        .limit(10);

      res.json(featuredArtists);
    } catch (error) {
      console.error('Error fetching featured artists:', error);
      res.status(500).json({ error: 'Error fetching featured artists' });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const allArtists = await db
        .select()
        .from(users)
        .where(eq(users.userType, 'artist'))
        .orderBy(sql`${users.rating} DESC`);
      
      res.json(allArtists);
    } catch (error) {
      console.error('Error fetching artists:', error);
      res.status(500).json({ error: 'Error fetching artists' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const [artist] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, req.params.id),
            eq(users.userType, 'artist')
          )
        )
        .limit(1);

      if (!artist) {
        return res.status(404).json({ error: 'Artist not found' });
      }

      res.json(artist);
    } catch (error) {
      console.error('Error fetching artist:', error);
      res.status(500).json({ error: 'Error fetching artist' });
    }
  }
};
