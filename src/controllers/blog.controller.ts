import { Request, Response } from 'express';
import { db } from '../db';
import { blogPosts, users } from '../schema';
import { desc, eq } from 'drizzle-orm';
import { format } from 'date-fns';
import type { BlogPost as BlogPostType } from '../types/schema';

interface BlogPostResponse {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string;
  category: string | null;
  subcategories: string[];
  tags: string[];
  featuredImage: string | null;
  imageUrl: string | null;
  gallery: Array<{ url: string; alt?: string; type?: string }> | [];
  videoUrl: string | null;
  readingTime: number | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  visibility: 'public' | 'private' | 'draft' | 'archived' | null;
  allowComments: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

// Obtener publicaciones recientes del blog
export const getRecentPosts = async (req: Request, res: Response) => {
  try {
    const recentPosts = await db
      .select({
        // Información básica
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        subtitle: blogPosts.subtitle,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        
        // Categorización
        category: blogPosts.category,
        subcategories: blogPosts.subcategories || [],
        tags: blogPosts.tags || [],
        
        // Multimedia
        featuredImage: blogPosts.featuredImage,
        gallery: blogPosts.gallery || [],
        videoUrl: blogPosts.videoUrl,
        readingTime: blogPosts.readingTime,
        
        // Estadísticas
        viewCount: blogPosts.viewCount,
        likeCount: blogPosts.likeCount,
        commentCount: blogPosts.commentCount,
        shareCount: blogPosts.shareCount,
        saveCount: blogPosts.saveCount,
        
        // Visibilidad y estado
        visibility: blogPosts.visibility,
        allowComments: blogPosts.allowComments,
        isFeatured: blogPosts.isFeatured,
        isVerified: blogPosts.isVerified,
        
        // SEO
        seoTitle: blogPosts.seoTitle,
        seoDescription: blogPosts.seoDescription,
        seoKeywords: blogPosts.seoKeywords,
        
        // Fechas
        publishedAt: blogPosts.publishedAt,
        scheduledAt: blogPosts.scheduledAt,
        expiresAt: blogPosts.expiresAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        
        // Autor
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.visibility, 'public'))
      .orderBy(desc(blogPosts.publishedAt || blogPosts.createdAt))
      .limit(5);

    // Formatear fechas y preparar respuesta
    const formattedPosts: BlogPostResponse[] = recentPosts.map(post => {
      // Asegurarse de que las fechas sean cadenas de texto
      const formatDate = (date: any) => date ? format(new Date(String(date)), "yyyy-MM-dd'T'HH:mm:ss") : null;
      
      const formattedPost: BlogPostResponse = {
        id: post.id,
        title: post.title,
        slug: post.slug || `post-${post.id}`,
        subtitle: post.subtitle || null,
        excerpt: post.excerpt || null,
        content: post.content,
        category: post.category,
        subcategories: post.subcategories || [],
        tags: post.tags || [],
        featuredImage: post.featuredImage,
        imageUrl: post.featuredImage, // Usamos featuredImage como imageUrl
        gallery: Array.isArray(post.gallery) ? post.gallery : [],
        videoUrl: post.videoUrl || null,
        readingTime: post.readingTime || null,
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        shareCount: post.shareCount || 0,
        saveCount: post.saveCount || 0,
        visibility: post.visibility,
        allowComments: post.allowComments ?? true,
        isFeatured: post.isFeatured || false,
        isVerified: post.isVerified || false,
        seoTitle: post.seoTitle || null,
        seoDescription: post.seoDescription || null,
        seoKeywords: post.seoKeywords || null,
        publishedAt: formatDate(post.publishedAt),
        scheduledAt: formatDate(post.scheduledAt),
        expiresAt: formatDate(post.expiresAt),
        createdAt: formatDate(post.createdAt) || new Date().toISOString(),
        updatedAt: formatDate(post.updatedAt),
        author: {
          id: post.author.id,
          firstName: post.author.firstName || null,
          lastName: post.author.lastName || null,
          profileImageUrl: post.author.profileImageUrl || null
        }
      };
      
      return formattedPost;
    });
    
    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching recent blog posts:', error);
    res.status(500).json({ error: 'Error fetching recent blog posts' });
  }
};

// Controlador para compatibilidad con rutas existentes
export const blogController = {
  getRecentPosts
};
