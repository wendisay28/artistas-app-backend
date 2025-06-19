import { Database, db } from '../db.js';
import { IStorage, StorageConfig } from './interfaces.js';
import { EventStorage } from './events.js';
import { UserStorage } from './users.js';
import { VenueStorage } from './venues.js';
import { ArtistStorage } from './artists.js';
import { MessageStorage } from './messages.js';
import { RecommendationStorage } from './recommendations.js';
import { FavoriteStorage } from './favorites.js';
import { BlogStorage } from './blog.js';
import { ReviewStorage } from './reviews.js';
import { CategoryStorage } from './categories.js';
import { HiringStorage } from './hiring.js';
import {
  favorites,
  users,
  events,
  venues,
  blogPosts,
  artists,
  messages,
  recommendations,
  categories,
} from '../schema.js';

const config: StorageConfig = { db };

export class DatabaseStorage implements IStorage {
  private static instance: DatabaseStorage | null = null;
  private config: StorageConfig;
  public eventStorage: EventStorage;
  public userStorage: UserStorage;
  public venueStorage: VenueStorage;
  public artistStorage: ArtistStorage;
  public messageStorage: MessageStorage;
  public recommendationStorage: RecommendationStorage;
  public favoriteStorage: FavoriteStorage;
  public blogStorage: BlogStorage;
  public categoryStorage: CategoryStorage;
  public reviews: ReviewStorage;
  public hiring: HiringStorage;

  private constructor(config: StorageConfig) {
    this.config = config;
    this.eventStorage = new EventStorage(config.db);
    this.userStorage = new UserStorage(config.db);
    this.venueStorage = new VenueStorage(config.db);
    this.artistStorage = new ArtistStorage(config.db);
    this.messageStorage = new MessageStorage(config.db);
    this.recommendationStorage = new RecommendationStorage(config.db);
    this.favoriteStorage = new FavoriteStorage(config.db);
    this.blogStorage = new BlogStorage(config.db);
    this.categoryStorage = new CategoryStorage(config.db);
    this.reviews = new ReviewStorage(config.db);
    this.hiring = new HiringStorage(config.db);
  }

  public static getInstance(): DatabaseStorage {
    if (!DatabaseStorage.instance) {
      DatabaseStorage.instance = new DatabaseStorage({ db });
    }
    return DatabaseStorage.instance;
  }

  // Category methods
  getCategories(): Promise<typeof categories.$inferSelect[]> {
    return this.categoryStorage.getCategories();
  }

  createCategory(category: Omit<typeof categories.$inferInsert, 'id'>): Promise<typeof categories.$inferSelect> {
    return this.categoryStorage.createCategory(category);
  }

  // User methods
  getUser(id: string): Promise<typeof users.$inferSelect | undefined> {
    return this.userStorage.getUser(id);
  }

  async upsertUser(user: { id: string } & Partial<{ email: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; userType: 'general' | 'artist' | 'company'; bio: string | null; city: string | null; isVerified: boolean }>): Promise<typeof users.$inferSelect> {
    return this.userStorage.upsertUser(user);
  }

  getUsers(filters: { userType?: 'general' | 'artist' | 'company' }): Promise<typeof users.$inferSelect[]> {
    return this.userStorage.getUsers(filters);
  }

  // Event methods
  getEvent(id: number): Promise<(typeof events.$inferSelect & { organizer: typeof users.$inferSelect; category?: typeof categories.$inferSelect }) | undefined> {
    return this.eventStorage.getEvent(id);
  }

  getEvents(filters: { categoryId?: number; organizerId?: string }): Promise<(typeof events.$inferSelect & { organizer: typeof users.$inferSelect; category?: typeof categories.$inferSelect })[]> {
    return this.eventStorage.getEvents(filters);
  }

  createEvent(event: Omit<typeof events.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof events.$inferSelect> {
    return this.eventStorage.createEvent(event);
  }

  updateEvent(id: number, event: Partial<typeof events.$inferInsert>): Promise<typeof events.$inferSelect> {
    return this.eventStorage.updateEvent(id, event);
  }

  deleteEvent(id: number): Promise<void> {
    return this.eventStorage.deleteEvent(id);
  }

  // Venue methods
  getVenue(id: number): Promise<(typeof venues.$inferSelect & { owner: typeof users.$inferSelect }) | undefined> {
    return this.venueStorage.getVenue(id);
  }

  getVenues(filters: { ownerId?: string }): Promise<(typeof venues.$inferSelect & { owner: typeof users.$inferSelect })[]> {
    return this.venueStorage.getVenues(filters);
  }

  createVenue(venue: Omit<typeof venues.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof venues.$inferSelect> {
    return this.venueStorage.createVenue(venue);
  }

  updateVenue(id: number, venue: Partial<typeof venues.$inferInsert>): Promise<typeof venues.$inferSelect> {
    return this.venueStorage.updateVenue(id, venue);
  }

  deleteVenue(id: number): Promise<void> {
    return this.venueStorage.deleteVenue(id);
  }

  // Artist methods
  getArtist(id: number): Promise<(typeof artists.$inferSelect & { user: typeof users.$inferSelect; category?: typeof categories.$inferSelect }) | undefined> {
    return this.artistStorage.getArtist(id);
  }

  getArtists(filters: { categoryId?: number; userId?: string }): Promise<(typeof artists.$inferSelect & { user: typeof users.$inferSelect; category?: typeof categories.$inferSelect })[]> {
    return this.artistStorage.getArtists(filters);
  }

  createArtist(artist: Omit<typeof artists.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof artists.$inferSelect> {
    return this.artistStorage.createArtist(artist);
  }

  updateArtist(id: number, artist: Partial<typeof artists.$inferInsert>): Promise<typeof artists.$inferSelect> {
    return this.artistStorage.updateArtist(id, artist);
  }

  deleteArtist(id: number): Promise<void> {
    return this.artistStorage.deleteArtist(id);
  }

  // Message methods
  getMessage(id: number): Promise<(typeof messages.$inferSelect & { sender: typeof users.$inferSelect; receiver: typeof users.$inferSelect }) | undefined> {
    return this.messageStorage.getMessage(id);
  }

  getMessages(filters: { senderId?: string; receiverId?: string }): Promise<(typeof messages.$inferSelect & { sender: typeof users.$inferSelect; receiver: typeof users.$inferSelect })[]> {
    return this.messageStorage.getMessages(filters);
  }

  getUserMessages(userId: string): Promise<(typeof messages.$inferSelect & { sender: typeof users.$inferSelect; receiver: typeof users.$inferSelect })[]> {
    return this.messageStorage.getUserMessages(userId);
  }

  getConversation(userId1: string, userId2: string): Promise<(typeof messages.$inferSelect & { sender: typeof users.$inferSelect; receiver: typeof users.$inferSelect })[]> {
    return this.messageStorage.getConversation(userId1, userId2);
  }

  sendMessage(message: Omit<typeof messages.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof messages.$inferSelect> {
    return this.messageStorage.sendMessage(message);
  }

  // Recommendation methods
  getRecommendations(filters: { categoryId?: number; city?: string; isActive?: boolean; search?: string }): Promise<(typeof recommendations.$inferSelect & { user: typeof users.$inferSelect })[]> {
    return this.recommendationStorage.getRecommendations(filters);
  }

  createRecommendation(recommendation: Omit<typeof recommendations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof recommendations.$inferSelect> {
    return this.recommendationStorage.createRecommendation(recommendation);
  }

  // Favorite methods
  getFavorites(filters: { userId: string }): Promise<(typeof favorites.$inferSelect & { user: typeof users.$inferSelect })[]> {
    return this.favoriteStorage.getFavorites(filters.userId);
  }

  getUserFavorites(userId: string, targetType?: string): Promise<(typeof favorites.$inferSelect & { user: typeof users.$inferSelect })[]> {
    return this.favoriteStorage.getUserFavorites(userId, targetType);
  }

  addFavorite(favorite: Omit<typeof favorites.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof favorites.$inferSelect> {
    return this.favoriteStorage.addFavorite(favorite);
  }

  removeFavorite(userId: string, targetId: number, targetType: string): Promise<void> {
    return this.favoriteStorage.removeFavorite(userId, targetId, targetType);
  }

  // Blog methods
  getBlogPost(id: number): Promise<(typeof blogPosts.$inferSelect & { author: typeof users.$inferSelect }) | undefined> {
    return this.blogStorage.getBlogPost(id);
  }

  getBlogPosts(filters: { authorId?: string; category?: string; visibility?: 'draft' | 'public' | 'private'; search?: string }): Promise<(typeof blogPosts.$inferSelect & { author: typeof users.$inferSelect })[]> {
    return this.blogStorage.getBlogPosts(filters);
  }

  createBlogPost(post: Omit<typeof blogPosts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<typeof blogPosts.$inferSelect> {
    return this.blogStorage.createBlogPost(post);
  }

  updateBlogPost(id: number, post: Partial<typeof blogPosts.$inferInsert>): Promise<typeof blogPosts.$inferSelect> {
    return this.blogStorage.updateBlogPost(id, post);
  }

  deleteBlogPost(id: number): Promise<void> {
    return this.blogStorage.deleteBlogPost(id);
  }
}

export const storage = DatabaseStorage.getInstance();
