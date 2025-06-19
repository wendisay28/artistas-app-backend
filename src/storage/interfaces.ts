import { Database } from '../db.js';
import { events, users, categories, venues, artists, messages, recommendations, favorites, blogPosts } from '../schema.js';

export interface IStorage {
  // Category methods
  getCategories(): Promise<typeof categories.$inferSelect[]>;
  createCategory(category: Omit<typeof categories.$inferInsert, 'id'>): Promise<typeof categories.$inferSelect>;
  getEvent(id: number): Promise<(typeof events.$inferSelect & { organizer: typeof users.$inferSelect; category?: typeof categories.$inferSelect }) | undefined>;
  getEvents(filters: { categoryId?: number; organizerId?: string }): Promise<(typeof events.$inferSelect & { organizer: typeof users.$inferSelect; category?: typeof categories.$inferSelect })[]>;
  getUser(id: string): Promise<typeof users.$inferSelect | undefined>;
  getUsers(filters: { userType?: 'general' | 'artist' | 'company' }): Promise<typeof users.$inferSelect[]>;
  getVenue(id: number): Promise<(typeof venues.$inferSelect & { owner: typeof users.$inferSelect }) | undefined>;
  getVenues(filters: { ownerId?: string }): Promise<(typeof venues.$inferSelect & { owner: typeof users.$inferSelect })[]>;
  getArtist(id: number): Promise<(typeof artists.$inferSelect & { user: typeof users.$inferSelect; category?: typeof categories.$inferSelect }) | undefined>;
  getArtists(filters: { categoryId?: number; userId?: string }): Promise<(typeof artists.$inferSelect & { user: typeof users.$inferSelect; category?: typeof categories.$inferSelect })[]>;
  createArtist(artist: Omit<typeof artists.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof artists.$inferSelect>;
  updateArtist(id: number, artist: Partial<typeof artists.$inferInsert>): Promise<typeof artists.$inferSelect>;
  deleteArtist(id: number): Promise<void>;
  getMessage(id: number): Promise<(typeof messages.$inferSelect & { sender: typeof users.$inferSelect; receiver: typeof users.$inferSelect }) | undefined>;
  getMessages(filters: { senderId?: string; receiverId?: string }): Promise<(typeof messages.$inferSelect & { sender: typeof users.$inferSelect; receiver: typeof users.$inferSelect })[]>;
  getUserMessages(userId: string): Promise<(typeof messages.$inferSelect & { sender: typeof users.$inferSelect; receiver: typeof users.$inferSelect })[]>;
  getConversation(userId1: string, userId2: string): Promise<(typeof messages.$inferSelect & { sender: typeof users.$inferSelect; receiver: typeof users.$inferSelect })[]>;
  sendMessage(message: Omit<typeof messages.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof messages.$inferSelect>;
  getRecommendations(filters: { categoryId?: number, city?: string, isActive?: boolean, search?: string }): Promise<(typeof recommendations.$inferSelect & { user: typeof users.$inferSelect })[]>;
  createRecommendation(recommendation: Omit<typeof recommendations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof recommendations.$inferSelect>;
  getFavorites(filters: { userId: string }): Promise<(typeof favorites.$inferSelect & { user: typeof users.$inferSelect })[]>;
  getUserFavorites(userId: string, targetType?: string): Promise<(typeof favorites.$inferSelect & { user: typeof users.$inferSelect })[]>;
  addFavorite(favorite: Omit<typeof favorites.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof favorites.$inferSelect>;
  removeFavorite(userId: string, targetId: number, targetType: string): Promise<void>;
  getBlogPost(id: number): Promise<(typeof blogPosts.$inferSelect & { author: typeof users.$inferSelect }) | undefined>;
  getBlogPosts(filters: { authorId?: string, category?: string, visibility?: 'draft' | 'public' | 'private', search?: string }): Promise<(typeof blogPosts.$inferSelect & { author: typeof users.$inferSelect })[]>;
  
  // Mutation methods
  createEvent(event: Omit<typeof events.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof events.$inferSelect>;
  updateEvent(id: number, event: Partial<typeof events.$inferInsert>): Promise<typeof events.$inferSelect>;
  deleteEvent(id: number): Promise<void>;
  
  createVenue(venue: Omit<typeof venues.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof venues.$inferSelect>;
  updateVenue(id: number, venue: Partial<typeof venues.$inferInsert>): Promise<typeof venues.$inferSelect>;
  deleteVenue(id: number): Promise<void>;
  
  createBlogPost(post: Omit<typeof blogPosts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof blogPosts.$inferSelect>;
  updateBlogPost(id: number, post: Partial<typeof blogPosts.$inferInsert>): Promise<typeof blogPosts.$inferSelect>;
  deleteBlogPost(id: number): Promise<void>;
}

export interface StorageConfig {
  db: Database;
}
