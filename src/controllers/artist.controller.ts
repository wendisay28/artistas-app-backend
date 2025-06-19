import { Request, Response } from 'express';
import { db } from '../db';
import { users, artists } from '../schema';
import { eq, and, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import type { User, Artist } from '../types/schema';

interface ArtistWithDetails extends Omit<User, 'isFeatured' | 'rating' | 'totalReviews'> {
  isFeatured: boolean;
  rating: number | null;
  totalReviews: number;
  details: Artist | null;
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

// Obtener todos los artistas
export const getAll = async (req: Request, res: Response) => {
  try {
    const allArtists = await db
      .select()
      .from(users)
      .where(eq(users.userType, 'artist'))
      .orderBy(users.firstName, users.lastName);

    res.json(allArtists);
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
    const response: ArtistWithDetails = {
      ...artistData,
      isFeatured: artistData.isFeatured ?? false, // Asegurar que no sea null
      rating: artistData.rating ? parseFloat(artistData.rating) : null,
      totalReviews: artistData.totalReviews ?? 0,
      details: artistDetails[0] || null
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
