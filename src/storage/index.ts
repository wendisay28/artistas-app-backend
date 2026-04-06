// External Dependencies
import { eq, isNotNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Database Schema
import { db } from '../db.js';
import * as schema from '../schema.js';

// Storage Interfaces
import type { IStorage, StorageConfig } from './interfaces.js';

// Storage Implementations
import { RecommendationStorage } from './recommendations.js';
import { BlogStorage } from './blog.js';
import { ReviewStorage } from './reviews.js';
import { CategoryStorage } from './categories.js';
import { EventStorage } from './events.js';
import { UserStorage } from './users.js';
import { VenueStorage } from './venues.js';
import { ArtistStorage } from './artists.js';
import { CompanyStorage } from './companies.js';
import { MessageStorage } from './messages.js';
import { HiringStorage } from './hiring.js';

// Re-export commonly used schema tables for easier access
const { users, events, venues, blogPosts, categories, messages, recommendations } = schema;

const config: StorageConfig = { db };

// Definir tipos para las relaciones
type UserWithRelations = typeof users.$inferSelect;
type CategoryWithRelations = typeof categories.$inferSelect;

type SocialMedia = {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
};

// Definir el tipo para el propietario del venue
type VenueOwner = NonNullable<typeof users.$inferSelect>;

// Definir el tipo para el venue con su propietario
type VenueWithCompany = typeof venues.$inferSelect & {
  owner: VenueOwner;
};

export class DatabaseStorage implements IStorage {
  private static instance: DatabaseStorage | null = null;
  private config: StorageConfig;
  public readonly db: PostgresJsDatabase<Record<string, unknown>>;
  
  // Storage implementations
  public eventStorage: EventStorage;
  public userStorage: UserStorage;
  public venueStorage: VenueStorage;
  public artistStorage: ArtistStorage;
  public companyStorage: CompanyStorage;
  public messageStorage: MessageStorage;
  public recommendationStorage: RecommendationStorage;
  public blogStorage: BlogStorage;
  public categoryStorage: CategoryStorage;
  public reviews: ReviewStorage;
  public hiring: HiringStorage;

  private constructor(config: StorageConfig) {
    this.config = config;
    this.db = config.db;
    
    // Initialize storage implementations
    this.eventStorage = new EventStorage(this.db);
    this.userStorage = new UserStorage(this.db);
    this.venueStorage = new VenueStorage(this.db);
    this.artistStorage = new ArtistStorage(this.db);
    this.companyStorage = new CompanyStorage(this.db);
    this.messageStorage = new MessageStorage(this.db);
    this.recommendationStorage = new RecommendationStorage(this.db);
    this.blogStorage = new BlogStorage(this.db);
    this.categoryStorage = new CategoryStorage(this.db);
    this.reviews = new ReviewStorage(this.db);
    this.hiring = new HiringStorage(this.db);
  }

  public static getInstance(config: StorageConfig): DatabaseStorage {
    if (!DatabaseStorage.instance) {
      DatabaseStorage.instance = new DatabaseStorage(config);
    }
    return DatabaseStorage.instance;
  }

  // Category methods
  async getCategories(): Promise<CategoryWithRelations[]> {
    return this.categoryStorage.getCategories();
  }

  async createCategory(category: Omit<typeof categories.$inferInsert, 'id'>): Promise<CategoryWithRelations> {
    return this.categoryStorage.createCategory(category);
  }

  // User methods
  async getUser(id: string): Promise<UserWithRelations | undefined> {
    return this.userStorage.getUser(id);
  }

  async getUsers(filters: { userType?: 'general' | 'artist' | 'company' } = {}): Promise<UserWithRelations[]> {
    return this.userStorage.getUsers(filters);
  }

  async upsertUser(
    user: { id: string } & Partial<{
      email: string;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      profileImageUrl: string | null;
      coverImageUrl: string | null;
      userType: 'general' | 'artist' | 'company';
      bio: string | null;
      city: string | null;
      isVerified: boolean;
      onboardingCompleted: boolean;
      socialMedia: Record<string, string | undefined>;
    }>
  ): Promise<UserWithRelations> {
    console.log('🔍 [DatabaseStorage.upsertUser] Recibido user.username:', user.username);
    const now = new Date();
    
    // Primero verificar si el usuario ya existe
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    if (existingUser) {
      // Si existe, solo actualizar los campos proporcionados
      const updateData: any = {
        updatedAt: now
      };
      
      if (user.email !== undefined) updateData.email = user.email;
      if (user.firstName !== undefined) updateData.firstName = user.firstName;
      if (user.lastName !== undefined) updateData.lastName = user.lastName;
      if (user.username !== undefined) updateData.username = user.username || null;
      if (user.profileImageUrl !== undefined) updateData.profileImageUrl = user.profileImageUrl;
      if (user.coverImageUrl !== undefined) updateData.coverImageUrl = user.coverImageUrl;
      if (user.userType !== undefined) updateData.userType = user.userType;
      if (user.bio !== undefined) updateData.bio = user.bio;
      if (user.city !== undefined) updateData.city = user.city;
      if (user.isVerified !== undefined) updateData.isVerified = user.isVerified;
      if (user.onboardingCompleted !== undefined) updateData.onboardingCompleted = user.onboardingCompleted;
      if (user.socialMedia !== undefined) updateData.socialMedia = user.socialMedia;
      
      console.log('🔍 [DatabaseStorage.upsertUser] updateData:', JSON.stringify(updateData, null, 2));
      
      const [result] = await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();
      
      console.log('🔍 [DatabaseStorage.upsertUser] result.username:', result.username);
      
      return result as UserWithRelations;
    } else {
      // Si no existe, crear uno nuevo con valores por defecto
      const [result] = await this.db
        .insert(users)
        .values({
          id: user.id,
          email: user.email || '',
          firstName: user.firstName || 'Usuario',
          lastName: user.lastName || '',
          profileImageUrl: user.profileImageUrl ?? null,
          userType: user.userType ?? 'general',
          bio: user.bio ?? null,
          city: user.city ?? null,
          socialMedia: user.socialMedia ?? {},
          isVerified: user.isVerified ?? false,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      if (!result) {
        throw new Error('Failed to create user');
      }
      
      return result as UserWithRelations;
    }
  }

  async searchUsers(query: string, limit: number = 5): Promise<UserWithRelations[]> {
    return this.userStorage.searchUsers(query, limit);
  }

  // Artist methods — all delegated to ArtistStorage (artists merged into users)
  async getArtist(userId: string) {
    return this.artistStorage.getArtist(userId);
  }

  async getArtists(filters: { categoryId?: number; userId?: string } = {}) {
    return this.artistStorage.getArtists({ userId: filters.userId });
  }

  async createArtist(artistData: { userId: string; artistName: string; categoryId?: number | null; bio?: string | null }) {
    return this.artistStorage.createArtist(artistData);
  }

  async updateArtist(userId: string, artistData: Partial<typeof users.$inferInsert>) {
    const cleanData = Object.fromEntries(
      Object.entries(artistData).filter(([_, v]) => v !== undefined)
    ) as any;
    return this.artistStorage.updateArtist(userId, cleanData);
  }

  // Message methods
  async getMessage(id: number) {
    return this.messageStorage.getMessage(id);
  }

  async getMessages(filters: { senderId?: string; receiverId?: string } = {}) {
    return this.messageStorage.getMessages(filters);
  }

  async sendMessage(message: Omit<typeof messages.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.messageStorage.sendMessage(message);
  }

  async getUserMessages(userId: string) {
    return this.messageStorage.getUserMessages(userId);
  }

  async getConversation(userId1: string, userId2: string) {
    return this.messageStorage.getConversation(userId1, userId2);
  }

  // Recommendation methods
  async getRecommendations(filters: { categoryId?: number, city?: string, isActive?: boolean, search?: string } = {}) {
    return this.recommendationStorage.getRecommendations(filters);
  }

  async createRecommendation(recommendation: Omit<typeof recommendations.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.recommendationStorage.createRecommendation(recommendation);
  }

  // Blog methods
  async getBlogPost(id: number) {
    return this.blogStorage.getBlogPost(id);
  }

  async getBlogPosts(filters: { authorId?: string, category?: string, visibility?: 'draft' | 'public' | 'private', search?: string } = {}) {
    return this.blogStorage.getBlogPosts(filters);
  }

  async createBlogPost(post: Omit<typeof blogPosts.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.blogStorage.createBlogPost(post);
  }

  async updateBlogPost(id: number, post: Partial<typeof blogPosts.$inferInsert>) {
    return this.blogStorage.updateBlogPost(id, post);
  }

  async deleteBlogPost(id: number) {
    return this.blogStorage.deleteBlogPost(id);
  }

  // Event methods
  async getEvent(id: number) {
    return this.eventStorage.getEvent(id);
  }

  async getEvents(filters: { categoryId?: number; organizerId?: string } = {}) {
    return this.eventStorage.getEvents(filters);
  }

  async createEvent(event: Omit<typeof events.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.eventStorage.createEvent(event);
  }

  async updateEvent(id: number, event: Partial<typeof events.$inferInsert>) {
    return this.eventStorage.updateEvent(id, event);
  }

  async deleteEvent(id: number) {
    return this.eventStorage.deleteEvent(id);
  }

  // Venue methods
  async getVenue(id: number): Promise<VenueWithCompany | undefined> {
    const companyAlias = alias(users, 'company');
    
    const results = await this.db
      .select({
        venue: venues,
        owner: companyAlias
      })
      .from(venues)
      .innerJoin(companyAlias, eq(venues.companyId, companyAlias.id))
      .where(eq(venues.id, id));

    const result = results[0];
    if (!result) return undefined;

    return {
      ...result.venue,
      owner: result.owner
    };
  }

  async getVenues(filters: { ownerId?: string } = {}): Promise<VenueWithCompany[]> {
    const companyAlias = alias(users, 'company');
    
    // Construir la consulta base con select explícito
    const query = this.db
      .select({
        venue: venues,
        owner: companyAlias
      })
      .from(venues)
      .innerJoin(companyAlias, eq(venues.companyId, companyAlias.id));

    // Aplicar filtros condicionalmente
    const filteredQuery = filters.ownerId 
      ? query.where(eq(companyAlias.id, filters.ownerId))
      : query;

    const results = await filteredQuery;
    
    // Mapear los resultados al formato esperado
    return results.map(row => ({
      ...row.venue,
      owner: row.owner
    }));
  }

  async createVenue(venue: Omit<typeof venues.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.venueStorage.createVenue(venue);
  }

  async updateVenue(id: number, venue: Partial<typeof venues.$inferInsert>) {
    return this.venueStorage.updateVenue(id, venue);
  }

  async deleteVenue(id: number) {
    return this.venueStorage.deleteVenue(id);
  }

  // Artist deletion (degrades user to 'general' type)
  async deleteArtist(userId: string): Promise<void> {
    return this.artistStorage.deleteArtist(userId);
  }

  // Company methods
  async getCompany(id: number) {
    return this.companyStorage.getCompany(id);
  }

  async getCompaniesByUserId(userId: string) {
    return this.companyStorage.getCompaniesByUserId(userId);
  }

  async getCompanies(filters: { companyType?: string; city?: string; isActive?: boolean } = {}) {
    return this.companyStorage.getCompanies(filters);
  }

  async getPrimaryCompany(userId: string) {
    return this.companyStorage.getPrimaryCompany(userId);
  }

  async createCompany(companyData: any) {
    return this.companyStorage.createCompany(companyData);
  }

  async updateCompany(id: number, companyData: any) {
    return this.companyStorage.updateCompany(id, companyData);
  }

  async deleteCompany(id: number) {
    return this.companyStorage.deleteCompany(id);
  }

  async setPrimaryCompany(userId: string, companyId: number) {
    return this.companyStorage.setPrimaryCompany(userId, companyId);
  }

  async getPublicCompanyProfile(id: number) {
    return this.companyStorage.getPublicCompanyProfile(id);
  }

  async isCompanyOwner(companyId: number, userId: string) {
    return this.companyStorage.isCompanyOwner(companyId, userId);
  }
}

// Export a singleton instance of the storage
export const storage = DatabaseStorage.getInstance({ db });
