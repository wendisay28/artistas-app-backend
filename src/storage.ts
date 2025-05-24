import {
  users,
  artists,
  events,
  venues,
  recommendations,
  blogPosts,
  favorites,
  reviews,
  hiringRequests,
  hiringResponses,
  messages,
  categories,
  type User,
  type UpsertUser,
  type Artist,
  type InsertArtist,
  type Event,
  type InsertEvent,
  type Venue,
  type InsertVenue,
  type Recommendation,
  type InsertRecommendation,
  type BlogPost,
  type InsertBlogPost,
  type Favorite,
  type InsertFavorite,
  type Review,
  type InsertReview,
  type HiringRequest,
  type InsertHiringRequest,
  type HiringResponse,
  type InsertHiringResponse,
  type Message,
  type InsertMessage,
  type Category,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, ilike, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  
  // Artists
  getArtists(filters?: {
    categoryId?: number;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: string;
    rating?: number;
    search?: string;
  }): Promise<(Artist & { user: User; category?: Category })[]>;
  getArtist(id: number): Promise<(Artist & { user: User; category?: Category }) | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: number, artist: Partial<InsertArtist>): Promise<Artist>;
  
  // Events
  getEvents(filters?: {
    categoryId?: number;
    city?: string;
    startDate?: Date;
    eventType?: string;
    search?: string;
  }): Promise<(Event & { organizer: User; category?: Category })[]>;
  getEvent(id: number): Promise<(Event & { organizer: User; category?: Category }) | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  
  // Venues
  getVenues(filters?: {
    city?: string;
    venueType?: string;
    search?: string;
  }): Promise<(Venue & { owner: User })[]>;
  getVenue(id: number): Promise<(Venue & { owner: User }) | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue>;
  
  // Recommendations
  getRecommendations(filters?: {
    categoryId?: number;
    city?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<(Recommendation & { author: User; category?: Category })[]>;
  getRecommendation(id: number): Promise<(Recommendation & { author: User; category?: Category }) | undefined>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  
  // Blog Posts
  getBlogPosts(filters?: {
    authorId?: string;
    category?: string;
    visibility?: string;
    search?: string;
  }): Promise<(BlogPost & { author: User })[]>;
  getBlogPost(id: number): Promise<(BlogPost & { author: User }) | undefined>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, blogPost: Partial<InsertBlogPost>): Promise<BlogPost>;
  
  // Favorites
  getUserFavorites(userId: string, targetType?: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, targetType: string, targetId: number): Promise<boolean>;
  isFavorite(userId: string, targetType: string, targetId: number): Promise<boolean>;
  
  // Reviews
  getReviews(targetType: string, targetId: number): Promise<(Review & { reviewer: User })[]>;
  createReview(review: InsertReview): Promise<Review>;
  canUserReview(userId: string, targetType: string, targetId: number): Promise<boolean>;
  
  // Hiring Requests
  getActiveHiringRequests(): Promise<(HiringRequest & { client: User; category?: Category })[]>;
  getHiringRequest(id: string): Promise<(HiringRequest & { client: User; category?: Category; responses: (HiringResponse & { artist: Artist & { user: User } })[] }) | undefined>;
  createHiringRequest(request: InsertHiringRequest): Promise<HiringRequest>;
  getHiringRequestsForArtist(categoryId: number, city: string): Promise<(HiringRequest & { client: User; category?: Category })[]>;
  
  // Hiring Responses
  createHiringResponse(response: InsertHiringResponse): Promise<HiringResponse>;
  getHiringResponsesForRequest(requestId: string): Promise<(HiringResponse & { artist: Artist & { user: User } })[]>;
  updateHiringResponseStatus(id: number, status: string): Promise<HiringResponse>;
  
  // Messages
  getConversation(userId1: string, userId2: string): Promise<(Message & { sender: User; receiver: User })[]>;
  getUserMessages(userId: string): Promise<(Message & { sender: User; receiver: User })[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // User operations (Required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  // Artists
  async getArtists(filters?: {
    categoryId?: number;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: string;
    rating?: number;
    search?: string;
  }): Promise<(Artist & { user: User; category?: Category })[]> {
    let query = db
      .select({
        id: artists.id,
        userId: artists.userId,
        artistName: artists.artistName,
        categoryId: artists.categoryId,
        subcategories: artists.subcategories,
        tags: artists.tags,
        artistType: artists.artistType,
        presentationType: artists.presentationType,
        serviceTypes: artists.serviceTypes,
        pricePerHour: artists.pricePerHour,
        experience: artists.experience,
        description: artists.description,
        portfolio: artists.portfolio,
        isAvailable: artists.isAvailable,
        canTravel: artists.canTravel,
        rating: artists.rating,
        totalReviews: artists.totalReviews,
        fanCount: artists.fanCount,
        createdAt: artists.createdAt,
        updatedAt: artists.updatedAt,
        user: users,
        category: categories,
      })
      .from(artists)
      .leftJoin(users, eq(artists.userId, users.id))
      .leftJoin(categories, eq(artists.categoryId, categories.id));

    const conditions = [];
    
    if (filters?.categoryId) {
      conditions.push(eq(artists.categoryId, filters.categoryId));
    }
    
    if (filters?.city) {
      conditions.push(eq(users.city, filters.city));
    }
    
    if (filters?.minPrice) {
      conditions.push(gte(artists.pricePerHour, filters.minPrice.toString()));
    }
    
    if (filters?.maxPrice) {
      conditions.push(lte(artists.pricePerHour, filters.maxPrice.toString()));
    }
    
    if (filters?.availability === 'available') {
      conditions.push(eq(artists.isAvailable, true));
    }
    
    if (filters?.rating) {
      conditions.push(gte(artists.rating, filters.rating.toString()));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`(${artists.artistName} ILIKE ${`%${filters.search}%`} OR ${artists.description} ILIKE ${`%${filters.search}%`})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(artists.rating), desc(artists.createdAt));
  }

  async getArtist(id: number): Promise<(Artist & { user: User; category?: Category }) | undefined> {
    const [artist] = await db
      .select({
        id: artists.id,
        userId: artists.userId,
        artistName: artists.artistName,
        categoryId: artists.categoryId,
        subcategories: artists.subcategories,
        tags: artists.tags,
        artistType: artists.artistType,
        presentationType: artists.presentationType,
        serviceTypes: artists.serviceTypes,
        pricePerHour: artists.pricePerHour,
        experience: artists.experience,
        description: artists.description,
        portfolio: artists.portfolio,
        isAvailable: artists.isAvailable,
        canTravel: artists.canTravel,
        rating: artists.rating,
        totalReviews: artists.totalReviews,
        fanCount: artists.fanCount,
        createdAt: artists.createdAt,
        updatedAt: artists.updatedAt,
        user: users,
        category: categories,
      })
      .from(artists)
      .leftJoin(users, eq(artists.userId, users.id))
      .leftJoin(categories, eq(artists.categoryId, categories.id))
      .where(eq(artists.id, id));
    
    return artist;
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [newArtist] = await db.insert(artists).values(artist).returning();
    return newArtist;
  }

  async updateArtist(id: number, artist: Partial<InsertArtist>): Promise<Artist> {
    const [updatedArtist] = await db
      .update(artists)
      .set({ ...artist, updatedAt: new Date() })
      .where(eq(artists.id, id))
      .returning();
    return updatedArtist;
  }

  // Events
  async getEvents(filters?: {
    categoryId?: number;
    city?: string;
    startDate?: Date;
    eventType?: string;
    search?: string;
  }): Promise<(Event & { organizer: User; category?: Category })[]> {
    let query = db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        title: events.title,
        description: events.description,
        categoryId: events.categoryId,
        subcategories: events.subcategories,
        tags: events.tags,
        eventType: events.eventType,
        startDate: events.startDate,
        endDate: events.endDate,
        location: events.location,
        city: events.city,
        isOutdoor: events.isOutdoor,
        isAccessible: events.isAccessible,
        capacity: events.capacity,
        price: events.price,
        requiresReservation: events.requiresReservation,
        purchaseLink: events.purchaseLink,
        multimedia: events.multimedia,
        rating: events.rating,
        totalReviews: events.totalReviews,
        attendeeCount: events.attendeeCount,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: users,
        category: categories,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(categories, eq(events.categoryId, categories.id));

    const conditions = [];
    
    if (filters?.categoryId) {
      conditions.push(eq(events.categoryId, filters.categoryId));
    }
    
    if (filters?.city) {
      conditions.push(eq(events.city, filters.city));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(events.startDate, filters.startDate));
    }
    
    if (filters?.eventType) {
      conditions.push(eq(events.eventType, filters.eventType));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`(${events.title} ILIKE ${`%${filters.search}%`} OR ${events.description} ILIKE ${`%${filters.search}%`})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(events.startDate));
  }

  async getEvent(id: number): Promise<(Event & { organizer: User; category?: Category }) | undefined> {
    const [event] = await db
      .select({
        id: events.id,
        organizerId: events.organizerId,
        title: events.title,
        description: events.description,
        categoryId: events.categoryId,
        subcategories: events.subcategories,
        tags: events.tags,
        eventType: events.eventType,
        startDate: events.startDate,
        endDate: events.endDate,
        location: events.location,
        city: events.city,
        isOutdoor: events.isOutdoor,
        isAccessible: events.isAccessible,
        capacity: events.capacity,
        price: events.price,
        requiresReservation: events.requiresReservation,
        purchaseLink: events.purchaseLink,
        multimedia: events.multimedia,
        rating: events.rating,
        totalReviews: events.totalReviews,
        attendeeCount: events.attendeeCount,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: users,
        category: categories,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(categories, eq(events.categoryId, categories.id))
      .where(eq(events.id, id));
    
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  // Venues
  async getVenues(filters?: {
    city?: string;
    venueType?: string;
    search?: string;
  }): Promise<(Venue & { owner: User })[]> {
    let query = db
      .select({
        id: venues.id,
        ownerId: venues.ownerId,
        name: venues.name,
        description: venues.description,
        venueType: venues.venueType,
        services: venues.services,
        address: venues.address,
        city: venues.city,
        openingHours: venues.openingHours,
        contact: venues.contact,
        multimedia: venues.multimedia,
        coordinates: venues.coordinates,
        dailyRate: venues.dailyRate,
        rating: venues.rating,
        totalReviews: venues.totalReviews,
        createdAt: venues.createdAt,
        updatedAt: venues.updatedAt,
        owner: users,
      })
      .from(venues)
      .leftJoin(users, eq(venues.ownerId, users.id));

    const conditions = [];
    
    if (filters?.city) {
      conditions.push(eq(venues.city, filters.city));
    }
    
    if (filters?.venueType) {
      conditions.push(eq(venues.venueType, filters.venueType));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`(${venues.name} ILIKE ${`%${filters.search}%`} OR ${venues.description} ILIKE ${`%${filters.search}%`})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(venues.rating), desc(venues.createdAt));
  }

  async getVenue(id: number): Promise<(Venue & { owner: User }) | undefined> {
    const [venue] = await db
      .select({
        id: venues.id,
        ownerId: venues.ownerId,
        name: venues.name,
        description: venues.description,
        venueType: venues.venueType,
        services: venues.services,
        address: venues.address,
        city: venues.city,
        openingHours: venues.openingHours,
        contact: venues.contact,
        multimedia: venues.multimedia,
        coordinates: venues.coordinates,
        dailyRate: venues.dailyRate,
        rating: venues.rating,
        totalReviews: venues.totalReviews,
        createdAt: venues.createdAt,
        updatedAt: venues.updatedAt,
        owner: users,
      })
      .from(venues)
      .leftJoin(users, eq(venues.ownerId, users.id))
      .where(eq(venues.id, id));
    
    return venue;
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [newVenue] = await db.insert(venues).values(venue).returning();
    return newVenue;
  }

  async updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue> {
    const [updatedVenue] = await db
      .update(venues)
      .set({ ...venue, updatedAt: new Date() })
      .where(eq(venues.id, id))
      .returning();
    return updatedVenue;
  }

  // Recommendations
  async getRecommendations(filters?: {
    categoryId?: number;
    city?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<(Recommendation & { author: User; category?: Category })[]> {
    let query = db
      .select({
        id: recommendations.id,
        authorId: recommendations.authorId,
        title: recommendations.title,
        description: recommendations.description,
        categoryId: recommendations.categoryId,
        tags: recommendations.tags,
        city: recommendations.city,
        estimatedDate: recommendations.estimatedDate,
        isActive: recommendations.isActive,
        responseCount: recommendations.responseCount,
        createdAt: recommendations.createdAt,
        updatedAt: recommendations.updatedAt,
        author: users,
        category: categories,
      })
      .from(recommendations)
      .leftJoin(users, eq(recommendations.authorId, users.id))
      .leftJoin(categories, eq(recommendations.categoryId, categories.id));

    const conditions = [];
    
    if (filters?.categoryId) {
      conditions.push(eq(recommendations.categoryId, filters.categoryId));
    }
    
    if (filters?.city) {
      conditions.push(eq(recommendations.city, filters.city));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(recommendations.isActive, filters.isActive));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`(${recommendations.title} ILIKE ${`%${filters.search}%`} OR ${recommendations.description} ILIKE ${`%${filters.search}%`})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(recommendations.createdAt));
  }

  async getRecommendation(id: number): Promise<(Recommendation & { author: User; category?: Category }) | undefined> {
    const [recommendation] = await db
      .select({
        id: recommendations.id,
        authorId: recommendations.authorId,
        title: recommendations.title,
        description: recommendations.description,
        categoryId: recommendations.categoryId,
        tags: recommendations.tags,
        city: recommendations.city,
        estimatedDate: recommendations.estimatedDate,
        isActive: recommendations.isActive,
        responseCount: recommendations.responseCount,
        createdAt: recommendations.createdAt,
        updatedAt: recommendations.updatedAt,
        author: users,
        category: categories,
      })
      .from(recommendations)
      .leftJoin(users, eq(recommendations.authorId, users.id))
      .leftJoin(categories, eq(recommendations.categoryId, categories.id))
      .where(eq(recommendations.id, id));
    
    return recommendation;
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [newRecommendation] = await db.insert(recommendations).values(recommendation).returning();
    return newRecommendation;
  }

  // Blog Posts
  async getBlogPosts(filters?: {
    authorId?: string;
    category?: string;
    visibility?: string;
    search?: string;
  }): Promise<(BlogPost & { author: User })[]> {
    let query = db
      .select({
        id: blogPosts.id,
        authorId: blogPosts.authorId,
        title: blogPosts.title,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        category: blogPosts.category,
        tags: blogPosts.tags,
        visibility: blogPosts.visibility,
        likeCount: blogPosts.likeCount,
        commentCount: blogPosts.commentCount,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        author: users,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id));

    const conditions = [];
    
    if (filters?.authorId) {
      conditions.push(eq(blogPosts.authorId, filters.authorId));
    }
    
    if (filters?.category) {
      conditions.push(eq(blogPosts.category, filters.category));
    }
    
    if (filters?.visibility) {
      conditions.push(eq(blogPosts.visibility, filters.visibility));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`(${blogPosts.title} ILIKE ${`%${filters.search}%`} OR ${blogPosts.content} ILIKE ${`%${filters.search}%`})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPost(id: number): Promise<(BlogPost & { author: User }) | undefined> {
    const [blogPost] = await db
      .select({
        id: blogPosts.id,
        authorId: blogPosts.authorId,
        title: blogPosts.title,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        category: blogPosts.category,
        tags: blogPosts.tags,
        visibility: blogPosts.visibility,
        likeCount: blogPosts.likeCount,
        commentCount: blogPosts.commentCount,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        author: users,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.id, id));
    
    return blogPost;
  }

  async createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost> {
    const [newBlogPost] = await db.insert(blogPosts).values(blogPost).returning();
    return newBlogPost;
  }

  async updateBlogPost(id: number, blogPost: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [updatedBlogPost] = await db
      .update(blogPosts)
      .set({ ...blogPost, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedBlogPost;
  }

  // Favorites
  async getUserFavorites(userId: string, targetType?: string): Promise<Favorite[]> {
    let query = db.select().from(favorites).where(eq(favorites.userId, userId));
    
    if (targetType) {
      query = query.where(and(eq(favorites.userId, userId), eq(favorites.targetType, targetType)));
    }
    
    return await query.orderBy(desc(favorites.createdAt));
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, targetType: string, targetId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.targetType, targetType),
          eq(favorites.targetId, targetId)
        )
      );
    
    return result.rowCount > 0;
  }

  async isFavorite(userId: string, targetType: string, targetId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.targetType, targetType),
          eq(favorites.targetId, targetId)
        )
      );
    
    return !!favorite;
  }

  // Reviews
  async getReviews(targetType: string, targetId: number): Promise<(Review & { reviewer: User })[]> {
    return await db
      .select({
        id: reviews.id,
        reviewerId: reviews.reviewerId,
        targetType: reviews.targetType,
        targetId: reviews.targetId,
        rating: reviews.rating,
        comment: reviews.comment,
        canReview: reviews.canReview,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        reviewer: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(and(eq(reviews.targetType, targetType), eq(reviews.targetId, targetId)))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async canUserReview(userId: string, targetType: string, targetId: number): Promise<boolean> {
    // TODO: Implement logic to check if user has contracted/attended
    // For now, return true for all logged in users
    return true;
  }

  // Hiring Requests
  async getActiveHiringRequests(): Promise<(HiringRequest & { client: User; category?: Category })[]> {
    return await db
      .select({
        id: hiringRequests.id,
        clientId: hiringRequests.clientId,
        categoryId: hiringRequests.categoryId,
        description: hiringRequests.description,
        city: hiringRequests.city,
        eventDate: hiringRequests.eventDate,
        eventTime: hiringRequests.eventTime,
        minBudget: hiringRequests.minBudget,
        maxBudget: hiringRequests.maxBudget,
        additionalDetails: hiringRequests.additionalDetails,
        status: hiringRequests.status,
        responseCount: hiringRequests.responseCount,
        createdAt: hiringRequests.createdAt,
        expiresAt: hiringRequests.expiresAt,
        client: users,
        category: categories,
      })
      .from(hiringRequests)
      .leftJoin(users, eq(hiringRequests.clientId, users.id))
      .leftJoin(categories, eq(hiringRequests.categoryId, categories.id))
      .where(and(eq(hiringRequests.status, "active"), gte(hiringRequests.expiresAt, new Date())))
      .orderBy(desc(hiringRequests.createdAt));
  }

  async getHiringRequest(id: string): Promise<(HiringRequest & { client: User; category?: Category; responses: (HiringResponse & { artist: Artist & { user: User } })[] }) | undefined> {
    const [request] = await db
      .select({
        id: hiringRequests.id,
        clientId: hiringRequests.clientId,
        categoryId: hiringRequests.categoryId,
        description: hiringRequests.description,
        city: hiringRequests.city,
        eventDate: hiringRequests.eventDate,
        eventTime: hiringRequests.eventTime,
        minBudget: hiringRequests.minBudget,
        maxBudget: hiringRequests.maxBudget,
        additionalDetails: hiringRequests.additionalDetails,
        status: hiringRequests.status,
        responseCount: hiringRequests.responseCount,
        createdAt: hiringRequests.createdAt,
        expiresAt: hiringRequests.expiresAt,
        client: users,
        category: categories,
      })
      .from(hiringRequests)
      .leftJoin(users, eq(hiringRequests.clientId, users.id))
      .leftJoin(categories, eq(hiringRequests.categoryId, categories.id))
      .where(eq(hiringRequests.id, id));

    if (!request) return undefined;

    const responses = await this.getHiringResponsesForRequest(id);

    return { ...request, responses };
  }

  async createHiringRequest(request: InsertHiringRequest): Promise<HiringRequest> {
    const [newRequest] = await db.insert(hiringRequests).values(request).returning();
    return newRequest;
  }

  async getHiringRequestsForArtist(categoryId: number, city: string): Promise<(HiringRequest & { client: User; category?: Category })[]> {
    return await db
      .select({
        id: hiringRequests.id,
        clientId: hiringRequests.clientId,
        categoryId: hiringRequests.categoryId,
        description: hiringRequests.description,
        city: hiringRequests.city,
        eventDate: hiringRequests.eventDate,
        eventTime: hiringRequests.eventTime,
        minBudget: hiringRequests.minBudget,
        maxBudget: hiringRequests.maxBudget,
        additionalDetails: hiringRequests.additionalDetails,
        status: hiringRequests.status,
        responseCount: hiringRequests.responseCount,
        createdAt: hiringRequests.createdAt,
        expiresAt: hiringRequests.expiresAt,
        client: users,
        category: categories,
      })
      .from(hiringRequests)
      .leftJoin(users, eq(hiringRequests.clientId, users.id))
      .leftJoin(categories, eq(hiringRequests.categoryId, categories.id))
      .where(
        and(
          eq(hiringRequests.status, "active"),
          eq(hiringRequests.categoryId, categoryId),
          eq(hiringRequests.city, city),
          gte(hiringRequests.expiresAt, new Date())
        )
      )
      .orderBy(desc(hiringRequests.createdAt));
  }

  // Hiring Responses
  async createHiringResponse(response: InsertHiringResponse): Promise<HiringResponse> {
    const [newResponse] = await db.insert(hiringResponses).values(response).returning();
    return newResponse;
  }

  async getHiringResponsesForRequest(requestId: string): Promise<(HiringResponse & { artist: Artist & { user: User } })[]> {
    return await db
      .select({
        id: hiringResponses.id,
        requestId: hiringResponses.requestId,
        artistId: hiringResponses.artistId,
        responseType: hiringResponses.responseType,
        proposedPrice: hiringResponses.proposedPrice,
        message: hiringResponses.message,
        status: hiringResponses.status,
        createdAt: hiringResponses.createdAt,
        artist: {
          id: artists.id,
          userId: artists.userId,
          artistName: artists.artistName,
          categoryId: artists.categoryId,
          subcategories: artists.subcategories,
          tags: artists.tags,
          artistType: artists.artistType,
          presentationType: artists.presentationType,
          serviceTypes: artists.serviceTypes,
          pricePerHour: artists.pricePerHour,
          experience: artists.experience,
          description: artists.description,
          portfolio: artists.portfolio,
          isAvailable: artists.isAvailable,
          canTravel: artists.canTravel,
          rating: artists.rating,
          totalReviews: artists.totalReviews,
          fanCount: artists.fanCount,
          createdAt: artists.createdAt,
          updatedAt: artists.updatedAt,
          user: users,
        },
      })
      .from(hiringResponses)
      .leftJoin(artists, eq(hiringResponses.artistId, artists.id))
      .leftJoin(users, eq(artists.userId, users.id))
      .where(eq(hiringResponses.requestId, requestId))
      .orderBy(desc(hiringResponses.createdAt));
  }

  async updateHiringResponseStatus(id: number, status: string): Promise<HiringResponse> {
    const [updatedResponse] = await db
      .update(hiringResponses)
      .set({ status })
      .where(eq(hiringResponses.id, id))
      .returning();
    return updatedResponse;
  }

  // Messages
  async getConversation(userId1: string, userId2: string): Promise<(Message & { sender: User; receiver: User })[]> {
    return await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        messageType: messages.messageType,
        relatedId: messages.relatedId,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: { id: users.id, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl } as User,
        receiver: { id: users.id, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl } as User,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        sql`(${messages.senderId} = ${userId1} AND ${messages.receiverId} = ${userId2}) OR (${messages.senderId} = ${userId2} AND ${messages.receiverId} = ${userId1})`
      )
      .orderBy(asc(messages.createdAt));
  }

  async getUserMessages(userId: string): Promise<(Message & { sender: User; receiver: User })[]> {
    return await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        messageType: messages.messageType,
        relatedId: messages.relatedId,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: { id: users.id, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl } as User,
        receiver: { id: users.id, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl } as User,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`)
      .orderBy(desc(messages.createdAt));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }
}

export const storage = new DatabaseStorage();
