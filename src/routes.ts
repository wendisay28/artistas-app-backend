import type { Express, Router, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage/index.js";
import { setupAuth, isAuthenticated } from "./replitAuth.js";
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

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

type AuthenticatedRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// WebSocket connection storage
const wsConnections = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
  app.post('/api/hiring/requests', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/blog', isAuthenticated, async (req: any, res) => {
    const post = {
      title: req.body.title,
      content: req.body.content,
      authorId: req.user.id,
      tags: req.body.tags,
      excerpt: req.body.excerpt,
      featuredImage: req.body.featuredImage,
      category: req.body.category,
      visibility: req.body.visibility as 'draft' | 'public' | 'private',
      publishedAt: req.body.publishedAt
    };

    try {
      const newPost = await storage.blogStorage.createBlogPost(post);
      res.json(newPost);
    } catch (error) {
      res.status(500).json({ error: 'Error creating blog post' });
    }
  });

  // Reviews routes
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
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
  app.post('/api/hiring/responses', isAuthenticated, async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    try {
      const { requestId, message, proposal } = req.body;
      
      // Get artist ID from user ID
      const artists = await storage.artistStorage.getArtists({ userId: user.id });
      if (!artists || artists.length === 0) {
        return res.status(400).json({ error: 'User is not registered as an artist' });
      }
      const artist = artists[0];

      // Create the response
      const response = await storage.hiring.createHiringResponse({
        requestId,
        artistId: artist.id,
        proposal,
        accepted: true, // Default to accepted when artist responds
        message
      });

      res.json(response);
    } catch (error) {
      console.error('Error creating hiring response:', error);
      res.status(500).json({ error: 'Failed to create hiring response' });
    }
  });

  // Messages routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getUserMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: 'Error fetching messages' });
    }
  });

  app.get('/api/messages/conversation/:userId', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
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
