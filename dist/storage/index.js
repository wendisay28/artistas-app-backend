// External Dependencies
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
// Database Schema
import { db } from '../db.js';
import * as schema from '../schema.js';
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
const { users, events, venues, blogPosts, artists, categories, messages, recommendations } = schema;
const config = { db };
export class DatabaseStorage {
    constructor(config) {
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
    static getInstance(config) {
        if (!DatabaseStorage.instance) {
            DatabaseStorage.instance = new DatabaseStorage(config);
        }
        return DatabaseStorage.instance;
    }
    // Category methods
    async getCategories() {
        return this.categoryStorage.getCategories();
    }
    async createCategory(category) {
        return this.categoryStorage.createCategory(category);
    }
    // User methods
    async getUser(id) {
        return this.userStorage.getUser(id);
    }
    async getUsers(filters = {}) {
        return this.userStorage.getUsers(filters);
    }
    async upsertUser(user) {
        const now = new Date();
        // Primero verificar si el usuario ya existe
        const [existingUser] = await this.db
            .select()
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);
        if (existingUser) {
            // Si existe, solo actualizar los campos proporcionados
            const updateData = {
                updatedAt: now
            };
            if (user.email !== undefined)
                updateData.email = user.email;
            if (user.firstName !== undefined)
                updateData.firstName = user.firstName;
            if (user.lastName !== undefined)
                updateData.lastName = user.lastName;
            if (user.profileImageUrl !== undefined)
                updateData.profileImageUrl = user.profileImageUrl;
            if (user.coverImageUrl !== undefined)
                updateData.coverImageUrl = user.coverImageUrl;
            if (user.userType !== undefined)
                updateData.userType = user.userType;
            if (user.bio !== undefined)
                updateData.bio = user.bio;
            if (user.city !== undefined)
                updateData.city = user.city;
            if (user.isVerified !== undefined)
                updateData.isVerified = user.isVerified;
            if (user.onboardingCompleted !== undefined)
                updateData.onboardingCompleted = user.onboardingCompleted;
            const [result] = await this.db
                .update(users)
                .set(updateData)
                .where(eq(users.id, user.id))
                .returning();
            return result;
        }
        else {
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
                isVerified: user.isVerified ?? false,
                createdAt: now,
                updatedAt: now
            })
                .returning();
            if (!result) {
                throw new Error('Failed to create user');
            }
            return result;
        }
    }
    async searchUsers(query, limit = 5) {
        return this.userStorage.searchUsers(query, limit);
    }
    // Artist methods
    async getArtist(id) {
        try {
            const result = await this.db
                .select()
                .from(artists)
                .leftJoin(users, eq(artists.userId, users.id))
                .leftJoin(categories, eq(artists.categoryId, categories.id))
                .where(eq(artists.id, id))
                .limit(1);
            if (result.length === 0) {
                return undefined;
            }
            const artistData = result[0];
            const artist = artistData.artists;
            const user = artistData.users;
            const category = artistData.categories;
            if (!user) {
                throw new Error('User not found for artist');
            }
            return {
                ...artist,
                user,
                category: category || undefined
            };
        }
        catch (error) {
            console.error('Error fetching artist:', error);
            throw new Error('Failed to fetch artist');
        }
    }
    async getArtists(filters = {}) {
        // Delegate to ArtistStorage which includes discipline, role, specialization joins
        return this.artistStorage.getArtists({ userId: filters.userId });
    }
    async createArtist(artistData) {
        try {
            const [newArtist] = await this.db
                .insert(artists)
                .values({
                ...artistData,
                createdAt: new Date(),
                updatedAt: new Date()
            })
                .returning();
            if (!newArtist) {
                throw new Error('Failed to create artist');
            }
            return newArtist;
        }
        catch (error) {
            console.error('Error creating artist:', error);
            throw new Error('Failed to create artist');
        }
    }
    async updateArtist(id, artistData) {
        try {
            console.log('🔧 storage.updateArtist - artistData ANTES de limpiar:', Object.keys(artistData));
            // Limpiar undefined values antes de actualizar (Postgres no acepta undefined)
            const cleanData = Object.fromEntries(Object.entries(artistData).filter(([_, v]) => v !== undefined));
            console.log('🧹 storage.updateArtist - cleanData DESPUÉS de limpiar:', Object.keys(cleanData));
            console.log('🧹 storage.updateArtist - cleanData valores:', JSON.stringify(cleanData, null, 2));
            console.log('📝 DESCRIPTION en storage:', cleanData.description);
            const [updatedArtist] = await this.db
                .update(artists)
                .set({
                ...cleanData,
                updatedAt: new Date()
            })
                .where(eq(artists.id, id))
                .returning();
            if (!updatedArtist) {
                throw new Error(`Artist with ID ${id} not found`);
            }
            return updatedArtist;
        }
        catch (error) {
            console.error(`Error updating artist ${id}:`, error);
            throw new Error('Failed to update artist');
        }
    }
    // Message methods
    async getMessage(id) {
        return this.messageStorage.getMessage(id);
    }
    async getMessages(filters = {}) {
        return this.messageStorage.getMessages(filters);
    }
    async sendMessage(message) {
        return this.messageStorage.sendMessage(message);
    }
    async getUserMessages(userId) {
        return this.messageStorage.getUserMessages(userId);
    }
    async getConversation(userId1, userId2) {
        return this.messageStorage.getConversation(userId1, userId2);
    }
    // Recommendation methods
    async getRecommendations(filters = {}) {
        return this.recommendationStorage.getRecommendations(filters);
    }
    async createRecommendation(recommendation) {
        return this.recommendationStorage.createRecommendation(recommendation);
    }
    // Blog methods
    async getBlogPost(id) {
        return this.blogStorage.getBlogPost(id);
    }
    async getBlogPosts(filters = {}) {
        return this.blogStorage.getBlogPosts(filters);
    }
    async createBlogPost(post) {
        return this.blogStorage.createBlogPost(post);
    }
    async updateBlogPost(id, post) {
        return this.blogStorage.updateBlogPost(id, post);
    }
    async deleteBlogPost(id) {
        return this.blogStorage.deleteBlogPost(id);
    }
    // Event methods
    async getEvent(id) {
        return this.eventStorage.getEvent(id);
    }
    async getEvents(filters = {}) {
        return this.eventStorage.getEvents(filters);
    }
    async createEvent(event) {
        return this.eventStorage.createEvent(event);
    }
    async updateEvent(id, event) {
        return this.eventStorage.updateEvent(id, event);
    }
    async deleteEvent(id) {
        return this.eventStorage.deleteEvent(id);
    }
    // Venue methods
    async getVenue(id) {
        const companyAlias = alias(users, 'company');
        const results = await this.db
            .select()
            .from(venues)
            .innerJoin(companyAlias, eq(venues.companyId, companyAlias.id))
            .where(eq(venues.id, id));
        const result = results[0];
        if (!result || !result.company)
            return undefined;
        return {
            ...result.venues,
            owner: result.company
        };
    }
    async getVenues(filters = {}) {
        const companyAlias = alias(users, 'company');
        // Construir la consulta base
        const query = this.db
            .select()
            .from(venues)
            .innerJoin(companyAlias, eq(venues.companyId, companyAlias.id));
        // Aplicar filtros condicionalmente
        const filteredQuery = filters.ownerId
            ? query.where(eq(companyAlias.id, filters.ownerId))
            : query;
        const results = await filteredQuery;
        // Mapear los resultados al formato esperado
        return results.map(row => ({
            ...row.venues,
            owner: row.company
        }));
    }
    async createVenue(venue) {
        return this.venueStorage.createVenue(venue);
    }
    async updateVenue(id, venue) {
        return this.venueStorage.updateVenue(id, venue);
    }
    async deleteVenue(id) {
        return this.venueStorage.deleteVenue(id);
    }
    // Artist deletion
    async deleteArtist(id) {
        try {
            await this.db.delete(artists).where(eq(artists.id, id));
        }
        catch (error) {
            console.error(`Error deleting artist ${id}:`, error);
            throw new Error('Failed to delete artist');
        }
    }
    // Company methods
    async getCompany(id) {
        return this.companyStorage.getCompany(id);
    }
    async getCompaniesByUserId(userId) {
        return this.companyStorage.getCompaniesByUserId(userId);
    }
    async getCompanies(filters = {}) {
        return this.companyStorage.getCompanies(filters);
    }
    async getPrimaryCompany(userId) {
        return this.companyStorage.getPrimaryCompany(userId);
    }
    async createCompany(companyData) {
        return this.companyStorage.createCompany(companyData);
    }
    async updateCompany(id, companyData) {
        return this.companyStorage.updateCompany(id, companyData);
    }
    async deleteCompany(id) {
        return this.companyStorage.deleteCompany(id);
    }
    async setPrimaryCompany(userId, companyId) {
        return this.companyStorage.setPrimaryCompany(userId, companyId);
    }
    async getPublicCompanyProfile(id) {
        return this.companyStorage.getPublicCompanyProfile(id);
    }
    async isCompanyOwner(companyId, userId) {
        return this.companyStorage.isCompanyOwner(companyId, userId);
    }
}
DatabaseStorage.instance = null;
// Export a singleton instance of the storage
export const storage = DatabaseStorage.getInstance({ db });
