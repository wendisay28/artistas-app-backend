import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

// WebSocket server will be configured with HTTP server
import { 
  insertArtistSchema,
  insertEventSchema,
  insertVenueSchema,
  insertRecommendationSchema,
  insertBlogPostSchema,
  insertFavoriteSchema,
  insertReviewSchema,
  insertHiringRequestSchema,
  insertHiringResponseSchema,
  insertMessageSchema,
  categories
} from "@shared/schema";

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
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  // Artists routes
  app.get('/api/artists', async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        city: req.query.city as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        availability: req.query.availability as string,
        rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
        search: req.query.search as string,
      };
      
      const artists = await storage.getArtists(filters);
      res.json(artists);
    } catch (error) {
      console.error("Error fetching artists:", error);
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });

  app.get('/api/artists/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const artist = await storage.getArtist(id);
      
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      res.json(artist);
    } catch (error) {
      console.error("Error fetching artist:", error);
      res.status(500).json({ message: "Failed to fetch artist" });
    }
  });

  app.post('/api/artists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const artistData = insertArtistSchema.parse({ ...req.body, userId });
      
      const artist = await storage.createArtist(artistData);
      res.status(201).json(artist);
    } catch (error) {
      console.error("Error creating artist:", error);
      res.status(400).json({ message: "Failed to create artist" });
    }
  });

  app.put('/api/artists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Check if user owns this artist profile
      const existingArtist = await storage.getArtist(id);
      if (!existingArtist || existingArtist.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this artist" });
      }
      
      const artistData = insertArtistSchema.partial().parse(req.body);
      const artist = await storage.updateArtist(id, artistData);
      res.json(artist);
    } catch (error) {
      console.error("Error updating artist:", error);
      res.status(400).json({ message: "Failed to update artist" });
    }
  });

  // Events routes
  app.get('/api/events', async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        city: req.query.city as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        eventType: req.query.eventType as string,
        search: req.query.search as string,
      };
      
      const events = await storage.getEvents(filters);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const organizerId = req.user.claims.sub;
      const eventData = insertEventSchema.parse({ ...req.body, organizerId });
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ message: "Failed to create event" });
    }
  });

  // Venues routes
  app.get('/api/venues', async (req, res) => {
    try {
      const filters = {
        city: req.query.city as string,
        venueType: req.query.venueType as string,
        search: req.query.search as string,
      };
      
      const venues = await storage.getVenues(filters);
      res.json(venues);
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });

  app.post('/api/venues', isAuthenticated, async (req: any, res) => {
    try {
      const ownerId = req.user.claims.sub;
      const venueData = insertVenueSchema.parse({ ...req.body, ownerId });
      
      const venue = await storage.createVenue(venueData);
      res.status(201).json(venue);
    } catch (error) {
      console.error("Error creating venue:", error);
      res.status(400).json({ message: "Failed to create venue" });
    }
  });

  // Recommendations routes
  app.get('/api/recommendations', async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        city: req.query.city as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };
      
      const recommendations = await storage.getRecommendations(filters);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post('/api/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const recommendationData = insertRecommendationSchema.parse({ ...req.body, authorId });
      
      const recommendation = await storage.createRecommendation(recommendationData);
      res.status(201).json(recommendation);
    } catch (error) {
      console.error("Error creating recommendation:", error);
      res.status(400).json({ message: "Failed to create recommendation" });
    }
  });

  // Blog routes
  app.get('/api/blog', async (req, res) => {
    try {
      const filters = {
        authorId: req.query.authorId as string,
        category: req.query.category as string,
        visibility: req.query.visibility as string || "public",
        search: req.query.search as string,
      };
      
      const blogPosts = await storage.getBlogPosts(filters);
      res.json(blogPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.post('/api/blog', isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const blogPostData = insertBlogPostSchema.parse({ ...req.body, authorId });
      
      const blogPost = await storage.createBlogPost(blogPostData);
      res.status(201).json(blogPost);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(400).json({ message: "Failed to create blog post" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetType = req.query.targetType as string;
      
      const favorites = await storage.getUserFavorites(userId, targetType);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favoriteData = insertFavoriteSchema.parse({ ...req.body, userId });
      
      const favorite = await storage.addFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(400).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:targetType/:targetId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetType, targetId } = req.params;
      
      const success = await storage.removeFavorite(userId, targetType, parseInt(targetId));
      
      if (success) {
        res.json({ message: "Favorite removed successfully" });
      } else {
        res.status(404).json({ message: "Favorite not found" });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Reviews routes
  app.get('/api/reviews/:targetType/:targetId', async (req, res) => {
    try {
      const { targetType, targetId } = req.params;
      const reviews = await storage.getReviews(targetType, parseInt(targetId));
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const reviewerId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({ ...req.body, reviewerId });
      
      // Check if user can review this target
      const canReview = await storage.canUserReview(reviewerId, reviewData.targetType, reviewData.targetId);
      
      if (!canReview) {
        return res.status(403).json({ message: "You can only review artists/events you have contracted or attended" });
      }
      
      const review = await storage.createReview({ ...reviewData, canReview: true });
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Failed to create review" });
    }
  });

  // Hiring requests routes
  app.get('/api/hiring-requests', isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getActiveHiringRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching hiring requests:", error);
      res.status(500).json({ message: "Failed to fetch hiring requests" });
    }
  });

  app.get('/api/hiring-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const request = await storage.getHiringRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Hiring request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching hiring request:", error);
      res.status(500).json({ message: "Failed to fetch hiring request" });
    }
  });

  app.post('/api/hiring-requests', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = req.user.claims.sub;
      
      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const requestData = insertHiringRequestSchema.parse({ 
        ...req.body, 
        clientId,
        expiresAt
      });
      
      const request = await storage.createHiringRequest(requestData);
      
      // Notify relevant artists via WebSocket
      broadcastToCategory(requestData.categoryId, requestData.city, {
        type: 'hiring_request',
        data: request
      });
      
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating hiring request:", error);
      res.status(400).json({ message: "Failed to create hiring request" });
    }
  });

  app.post('/api/hiring-requests/:id/responses', isAuthenticated, async (req: any, res) => {
    try {
      const requestId = req.params.id;
      const userId = req.user.claims.sub;
      
      // Find artist profile for this user
      const artists = await storage.getArtists({ userId });
      if (artists.length === 0) {
        return res.status(403).json({ message: "Only artists can respond to hiring requests" });
      }
      
      const artist = artists[0];
      const responseData = insertHiringResponseSchema.parse({
        ...req.body,
        requestId,
        artistId: artist.id
      });
      
      const response = await storage.createHiringResponse(responseData);
      
      // Notify client via WebSocket
      const request = await storage.getHiringRequest(requestId);
      if (request) {
        notifyUser(request.clientId, {
          type: 'hiring_response',
          data: { response, artist }
        });
      }
      
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating hiring response:", error);
      res.status(400).json({ message: "Failed to create hiring response" });
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
      res.status(500).json({ message: "Failed to fetch messages" });
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
      for (const [userId, connection] of wsConnections.entries()) {
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

  function broadcastToCategory(categoryId: number, city: string, data: any) {
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
