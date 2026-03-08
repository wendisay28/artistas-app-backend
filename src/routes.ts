import type { Express, Router, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage/index.js";
import { artistsController } from "./controllers/artists.controller.js";
import { 
  getArtistAvailability,
  createBooking,
  updateBookingStatus,
  getUserBookings
} from "./controllers/availability.controller.js";
import { auth } from "./config/firebase.js";
import { 
  users,
  artists,
  events,
  venues,
  recommendations,
  reviews,
  hiringRequests,
  hiringResponses,
  messages,
  categories
} from "./schema.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Create schemas
const insertArtistSchema = z.object({
  userId: z.string(),
  artistName: z.string(),
  categoryId: z.number().optional(),
  subcategories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  artistType: z.string().optional(),
  presentationType: z.array(z.string()).optional(),
  serviceTypes: z.array(z.string()).optional(),
  pricePerHour: z.number().optional(),
  experience: z.string().optional(),
  description: z.string().optional(),
  portfolio: z.any().optional(),
  isAvailable: z.boolean().optional(),
  canTravel: z.boolean().optional()
});

const insertEventSchema = z.object({
  organizerId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  subcategories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  eventType: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  isOutdoor: z.boolean().optional(),
  capacity: z.number().optional(),
  ticketPrice: z.number().optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
  multimedia: z.any().optional()
});

const insertHiringRequestSchema = z.object({
  userId: z.string(),
  artistId: z.number(),
  eventId: z.number().optional(),
  venueId: z.number().optional(),
  message: z.string(),
  budget: z.number().optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).optional()
});

const insertHiringResponseSchema = z.object({
  requestId: z.number(),
  artistId: z.string(),
  message: z.string(),
  proposal: z.any().optional(),
  accepted: z.boolean().optional()
});

const insertMessageSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string(),
  isRead: z.boolean().optional()
});

const insertRecommendationSchema = z.object({
  userId: z.string(),
  artistId: z.number().optional(),
  eventId: z.number().optional(),
  venueId: z.number().optional(),
  type: z.enum(['artist', 'event', 'venue']),
  score: z.string()
});

const insertReviewSchema = z.object({
  userId: z.string(),
  artistId: z.number().optional(),
  eventId: z.number().optional(),
  venueId: z.number().optional(),
  type: z.enum(['artist', 'event', 'venue']),
  score: z.string(),
  reason: z.string().optional()
});

const insertVenueSchema = z.object({
  ownerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  venueType: z.string().optional(),
  services: z.array(z.string()).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  openingHours: z.any().optional(),
  contact: z.any().optional(),
  multimedia: z.any().optional(),
  coordinates: z.any().optional(),
  dailyRate: z.number().optional(),
  capacity: z.number().optional(),
  isAvailable: z.boolean().optional()
});

// Create update schemas
const updateArtistSchema = insertArtistSchema.partial();
const updateVenueSchema = insertVenueSchema.partial();
const updateEventSchema = insertEventSchema.partial();
const updateHiringRequestSchema = insertHiringRequestSchema.partial();
const updateHiringResponseSchema = insertHiringResponseSchema.partial();

import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';


// WebSocket connection storage
const wsConnections = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase Auth middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = await auth.verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Initialize default categories
  try {
    const existingCategories = await storage.getCategories();
    if (existingCategories.length === 0) {
      const defaultCategories = [
        { name: "Música", icon: "fas fa-music", description: "Artistas musicales de todos los géneros" },
        { name: "Danza", icon: "fas fa-dance", description: "Bailarines y coreógrafos profesionales" },
        { name: "Teatro", icon: "fas fa-theater-masks", description: "Actores y grupos teatrales" },
        { name: "Artes Visuales", icon: "fas fa-paint-brush", description: "Pintores, escultores y artistas visuales" },
        { name: "Fotografía", icon: "fas fa-camera", description: "Fotógrafos profesionales" },
        { name: "Literatura", icon: "fas fa-book", description: "Escritores y narradores" },
        { name: "Audiovisual", icon: "fas fa-video", description: "Productores y creadores audiovisuales" },
        { name: "Circo", icon: "fas fa-hat-wizard", description: "Artistas circenses y de variedades" },
      ];
      
      // Note: We would need to add a createCategory method to storage to insert these
      console.log("Default categories would be created here");
    }
  } catch (error) {
    console.error("Error initializing categories:", error);
  }

  // Auth routes
  app.post('/api/hiring/requests', requireAuth, async (req: any, res) => {
    try {
      const request = await storage.hiring.createHiringRequest({
        ...req.body,
        clientId: req.user.id
      });

      res.json(request);
    } catch (error) {
      console.error('Error creating hiring request:', error);
      res.status(500).json({ error: 'Failed to create hiring request' });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Artists routes for hiring page
  app.get('/v1/explorer/artists/map', artistsController.getArtistsForMap);
  app.get('/v1/explorer/artists', artistsController.getArtistsByFilters);
  app.get('/v1/explorer/artists/:id', artistsController.getArtistById);

  // Availability/Booking routes
  app.get('/v1/artists/:id/availability', getArtistAvailability);
  app.post('/v1/bookings', requireAuth, createBooking);
  app.patch('/v1/bookings/:id', requireAuth, updateBookingStatus);
  app.get('/v1/bookings', requireAuth, getUserBookings);

  // Users routes (basic CRUD for profile and userType)
  app.get('/api/users/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.get('/api/users/me', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ message: 'Failed to fetch current user' });
    }
  });

  app.get('/api/users/me/setup-status', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user has completed basic profile setup
      const isComplete = !!(user.firstName && user.lastName && user.userType);
      res.json({ isComplete });
    } catch (error) {
      console.error('Error checking profile setup status:', error);
      res.status(500).json({ message: 'Failed to check setup status' });
    }
  });

  app.post('/api/users', async (req: any, res) => {
    try {
      const {
        uid,
        id,
        email,
        firstName,
        lastName,
        photoURL,
        profileImageUrl,
        userType,
        bio,
        city,
        isVerified
      } = req.body || {};

      const newUser = await storage.upsertUser({
        id: id || uid,
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        profileImageUrl: (profileImageUrl ?? photoURL) ?? null,
        userType,
        bio: bio ?? null,
        city: city ?? null,
        isVerified: isVerified ?? false,
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating/upserting user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/users/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const {
        email,
        firstName,
        lastName,
        profileImageUrl,
        photoURL,
        userType,
        bio,
        city,
        isVerified
      } = req.body || {};

      const updatedUser = await storage.upsertUser({
        id,
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        profileImageUrl: (profileImageUrl ?? photoURL) ?? null,
        userType,
        bio: bio ?? null,
        city: city ?? null,
        isVerified: isVerified ?? false,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Blog routes
  app.get('/api/blog', async (req: any, res) => {
    try {
      const filters = {
        authorId: req.query.authorId,
        category: req.query.category,
        visibility: req.query.visibility as 'draft' | 'public' | 'private',
        search: req.query.search
      };

      const posts = await storage.blogStorage.getBlogPosts(filters);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
  });

  app.post('/api/blog', requireAuth, async (req: any, res) => {
    const post = {
      title: req.body.title,
      content: req.body.content,
      authorId: req.user.id,
      slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      tags: req.body.tags,
      excerpt: req.body.excerpt,
      featuredImage: req.body.featuredImage,
      category: req.body.category,
      visibility: req.body.visibility as 'draft' | 'public' | 'private',
      publishedAt: req.body.publishedAt || new Date()
    };

    try {
      const newPost = await storage.blogStorage.createBlogPost(post);
      res.json(newPost);
    } catch (error) {
      res.status(500).json({ error: 'Error creating blog post' });
    }
  });

  // Reviews routes
  app.get('/api/reviews/me', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub;
      // Usar el método existente del controlador de perfiles
      const reviews = await storage.reviews.getReviews('artist', parseInt(userId));
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ error: 'Failed to fetch user reviews' });
    }
  });

  app.post('/api/reviews', requireAuth, async (req: any, res) => {
    try {
      const { targetType, targetId, score, reason } = req.body;
      const userId = req.user.id;

      const canReview = await storage.reviews.canUserReview(
        userId,
        targetType as 'artist' | 'event' | 'venue',
        targetId
      );

      if (!canReview) {
        return res.status(400).json({ error: 'User cannot review this item' });
      }

      const review = await storage.reviews.createReview({
        userId,
        type: targetType as 'artist' | 'event' | 'venue',
        score: score.toString(),
        reason: reason,
        artistId: targetType === 'artist' ? targetId : undefined,
        eventId: targetType === 'event' ? targetId : undefined,
        venueId: targetType === 'venue' ? targetId : undefined
      });

      res.json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  });

  // Hiring responses routes
  app.post('/api/hiring/responses', requireAuth, async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    try {
      const { requestId: rawRequestId, message, proposal } = req.body;
      
      // Validar y convertir requestId a número
      if (rawRequestId === undefined || rawRequestId === null) {
        return res.status(400).json({ error: 'requestId is required' });
      }
      
      const requestId = Number(rawRequestId);
      if (isNaN(requestId)) {
        return res.status(400).json({ error: 'requestId must be a valid number' });
      }
      
      // Get artist ID from user ID
      const artists = await storage.artistStorage.getArtists();
      const userArtists = artists.filter(artist => artist.artist.userId === user.id);
      
      if (!userArtists || userArtists.length === 0) {
        return res.status(400).json({ error: 'User is not registered as an artist' });
      }
      
      const artist = userArtists[0];
      if (!artist || !artist.artist || typeof artist.artist.id !== 'number') {
        return res.status(400).json({ error: 'Invalid artist data' });
      }

      // Create the response
      const response = await storage.hiring.createHiringResponse({
        requestId, // Ya es un número
        artistId: artist.artist.id, // Aseguramos que es un número
        proposal: proposal || '',
        accepted: true, // Default to accepted when artist responds
        message: message || ''
      });

      res.json(response);
    } catch (error) {
      console.error('Error creating hiring response:', error);
      res.status(500).json({ error: 'Failed to create hiring response' });
    }
  });

  // Messages routes
  app.get('/api/messages', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getUserMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: 'Error fetching messages' });
    }
  });

  app.get('/api/messages/threads', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allMessages = await storage.getUserMessages(userId);

      const threadsMap = new Map<string, {
        userId: string;
        lastMessageId: number;
        lastMessageText: string;
        lastMessageAt: Date | null;
        otherUser: any;
        unreadCount: number;
      }>();

      for (const m of allMessages) {
        const otherUserId = m.senderId === userId ? m.receiverId : m.senderId;
        const otherUser = m.senderId === userId ? (m as any).receiver : (m as any).sender;

        const existing = threadsMap.get(otherUserId);
        const isUnreadForMe = m.receiverId === userId && !m.isRead;
        const unreadInc = isUnreadForMe ? 1 : 0;

        if (!existing) {
          threadsMap.set(otherUserId, {
            userId: otherUserId,
            lastMessageId: m.id,
            lastMessageText: m.content,
            lastMessageAt: m.createdAt || null,
            otherUser,
            unreadCount: unreadInc,
          });
          continue;
        }

        const prevDate = existing.lastMessageAt ? new Date(existing.lastMessageAt).getTime() : 0;
        const curDate = m.createdAt ? new Date(m.createdAt).getTime() : 0;

        if (curDate >= prevDate) {
          existing.lastMessageId = m.id;
          existing.lastMessageText = m.content;
          existing.lastMessageAt = m.createdAt || null;
          existing.otherUser = otherUser;
        }
        existing.unreadCount += unreadInc;
      }

      const threads = Array.from(threadsMap.values())
        .sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        })
        .map((t) => ({
          id: t.userId,
          otherUser: t.otherUser,
          lastMessage: {
            id: t.lastMessageId,
            text: t.lastMessageText,
            createdAt: t.lastMessageAt,
          },
          unreadCount: t.unreadCount,
        }));

      res.json(threads);
    } catch (error) {
      console.error('Error fetching message threads:', error);
      res.status(500).json({ message: 'Failed to fetch message threads' });
    }
  });

  app.get('/api/messages/conversation/:userId', requireAuth, async (req: any, res) => {
    try {
      const userId1 = req.user.claims.sub;
      const userId2 = req.params.userId;
      
      const conversation = await storage.getConversation(userId1, userId2);
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post('/api/messages', requireAuth, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId });
      
      const message = await storage.sendMessage(messageData);
      
      // Notify receiver via WebSocket
      notifyUser(messageData.receiverId, {
        type: 'new_message',
        data: message
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth' && message.userId) {
          wsConnections.set(message.userId, ws);
          console.log(`User ${message.userId} connected to WebSocket`);
          
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Successfully authenticated'
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove connection from map
      const entries = Array.from(wsConnections.entries());
      for (const [userId, connection] of entries) {
        if (connection === ws) {
          wsConnections.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Helper functions for WebSocket notifications
  function notifyUser(userId: string, data: any) {
    const connection = wsConnections.get(userId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(data));
    }
  }

  function broadcastToCategory(categoryId: number | undefined, city: string, data: any) {
    if (!categoryId) {
      console.warn('Attempted to broadcast without categoryId');
      return;
    }

    // This would need to be enhanced to track which artists are in which categories
    // For now, broadcast to all connected users
    wsConnections.forEach((connection, userId) => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(data));
      }
    });
  }

  return httpServer;
}
