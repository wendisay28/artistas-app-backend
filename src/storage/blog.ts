import { Database } from '../db.js';
import { blogPosts, users } from '../schema.js';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export class BlogStorage {
  constructor(private db: Database) {}

  private async getBlogPostQuery(id?: number, filters?: { authorId?: string, category?: string, visibility?: 'draft' | 'public' | 'private', search?: string }) {
    const authorAlias = alias(users, 'author');
    
    const query = this.db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        content: blogPosts.content,
        authorId: blogPosts.authorId,
        tags: blogPosts.tags,
        category: blogPosts.category,
        visibility: blogPosts.visibility,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        likeCount: blogPosts.likeCount,
        commentCount: blogPosts.commentCount,
        author: authorAlias
      })
      .from(blogPosts)
      .leftJoin(authorAlias, eq(blogPosts.authorId, authorAlias.id));

    if (id) {
      query.where(eq(blogPosts.id, id));
    }

    if (filters?.authorId) {
      query.where(eq(blogPosts.authorId, filters.authorId));
    }

    if (filters?.category) {
      query.where(eq(blogPosts.category, filters.category));
    }

    if (filters?.visibility) {
      query.where(eq(blogPosts.visibility, filters.visibility));
    }

    return query;
  }

  async getBlogPost(id: number): Promise<(typeof blogPosts.$inferSelect & {
    author: typeof users.$inferSelect
  }) | undefined> {
    const query = this.getBlogPostQuery(id);
    const [result] = await query;

    if (!result) return undefined;

    return {
      ...result,
      tags: result.tags || [],
      category: result.category || null,
      visibility: result.visibility || 'draft',
      excerpt: result.excerpt || null,
      featuredImage: result.featuredImage || null,
      publishedAt: result.publishedAt || null,
      author: result.author || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  async getBlogPosts(filters: { authorId?: string, category?: string, visibility?: 'draft' | 'public' | 'private', search?: string }): Promise<(typeof blogPosts.$inferSelect & { author: typeof users.$inferSelect })[]> {
    const query = this.getBlogPostQuery(undefined, filters);
    const results = await query;

    return results.map((result) => ({
      ...result,
      tags: result.tags || [],
      category: result.category || null,
      visibility: result.visibility || 'draft',
      excerpt: result.excerpt || null,
      featuredImage: result.featuredImage || null,
      publishedAt: result.publishedAt || null,
      author: result.author || {
        id: '',
        email: '',
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'general' as const,
        bio: null,
        city: null,
        isVerified: false,
        createdAt: null,
        updatedAt: null
      }
    }));
  }

  async createBlogPost(post: Omit<typeof blogPosts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof blogPosts.$inferSelect> {
    const [result] = await this.db.insert(blogPosts).values({
      ...post,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result;
  }

  async updateBlogPost(id: number, post: Partial<typeof blogPosts.$inferInsert>): Promise<typeof blogPosts.$inferSelect> {
    const [result] = await this.db.update(blogPosts)
      .set({
        ...post,
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return result;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
  }
}
