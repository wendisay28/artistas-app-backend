import { Request, Response } from 'express';
import { Venue } from '../models/venue.model';

export const venueController = {
  async getAll(req: Request, res: Response) {
    try {
      const { 
        city, 
        venueType, 
        capacity, 
        services, 
        search,
        sortBy = 'name'
      } = req.query;

      // Construir el filtro
      const filter: any = {};
      
      if (city) filter.city = city;
      if (venueType) filter.venueType = venueType;
      if (capacity) filter.capacity = { $gte: parseInt(capacity as string) };
      if (services) filter.services = { $all: (services as string).split(',') };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Determinar el orden
      let sort: any = {};
      switch (sortBy) {
        case 'rating':
          sort = { rating: -1 };
          break;
        case 'capacity':
          sort = { capacity: -1 };
          break;
        case 'recent':
          sort = { createdAt: -1 };
          break;
        case 'popular':
          sort = { rating: -1, capacity: -1 };
          break;
        default:
          sort = { name: 1 };
      }

      const venues = await Venue.find(filter)
        .sort(sort)
        .populate('owner', 'firstName lastName');

      res.json(venues);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching venues' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const venue = await Venue.findById(req.params.id)
        .populate('owner', 'firstName lastName email');

      if (!venue) {
        return res.status(404).json({ error: 'Venue not found' });
      }

      res.json(venue);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching venue' });
    }
  }
};
