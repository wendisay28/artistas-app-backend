import { Request, Response } from 'express';
import { db } from '../db.js';
import { users, categories, disciplines, roles } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';

// Tipo local flexible para respuesta enriquecida del artista
interface ArtistWithDetails extends Record<string, any> {
  isFeatured: boolean;
  rating: number | null;
  totalReviews: number;
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
    const rows = await db
      .select({
        user: users,
        category: categories,
        discipline: disciplines,
        role: roles,
      })
      .from(users)
      .leftJoin(categories, eq(users.categoryId, categories.id))
      .leftJoin(disciplines, eq(users.disciplineId, disciplines.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.userType, 'artist'))
      .orderBy(users.firstName, users.lastName);

    const mapped = rows.map(({ user: u, category, discipline, role }) => {
      const nameParts = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      const displayName = u.displayName || nameParts || (u.email?.split('@')[0]) || 'Artista';

      const metadata = (u.artistMetadata as Record<string, any> | undefined);

      return {
        id: u.id,
        type: 'artist',
        name: displayName,
        // bio: texto CORTO del header del perfil. Fuente: users.bio. NO es "Acerca de mí".
        bio: u.bio ?? '',
        // description: texto LARGO de la sección "Acerca de mí". Fuente: users.description.
        description: u.description ?? '',
        image: u.profileImageUrl ?? '',
        gallery: Array.isArray(u.gallery) ? u.gallery : [],
        location: u.city ?? 'Colombia',
        rating: u.rating ? parseFloat(String(u.rating)) : 4.5,
        reviews: u.totalReviews ?? 0,
        price: u.pricePerHour ? parseFloat(String(u.pricePerHour)) : 0,
        verified: u.isVerified ?? false,
        tags: u.tags ?? [],
        services: [],
        category: category?.name || '',
        categoryId: category?.code,
        disciplineId: discipline?.code,
        roleId: role?.code,
        specialty: metadata?.specialty,
        niche: metadata?.niche,
        experience: metadata?.yearsExperience || (u.yearsOfExperience ? `${u.yearsOfExperience} años` : 'No especificado'),
        style: metadata?.style || '',
        availability: u.availability || 'Disponible',
        responseTime: metadata?.responseTime || 'No especificado',
        schedule: u.schedule ?? '',
        workExperience: u.workExperience ?? [],
        education: u.education ?? [],
        socialMedia: u.socialMedia ?? null,
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

    const [artistUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.userType, 'artist')));

    if (!artistUser) {
      return res.status(404).json({ message: 'Artista no encontrado' });
    }

    const response: ArtistWithDetails = {
      ...artistUser,
      isFeatured: artistUser.isFeatured ?? false,
      rating: artistUser.rating ? parseFloat(String(artistUser.rating)) : null,
      totalReviews: artistUser.totalReviews ?? 0,
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
