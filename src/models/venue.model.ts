import { Schema, model, Document } from 'mongoose';

export interface IVenue extends Document {
  name: string;
  description: string;
  city: string;
  venueType: string;
  capacity: number;
  services: string[];
  imageUrl?: string;
  rating?: number;
  owner: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const venueSchema = new Schema<IVenue>({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true,
    trim: true
  },
  venueType: { 
    type: String, 
    required: true,
    enum: [
      'Teatro', 'Auditorio', 'Galería', 'Centro Cultural', 
      'Café Cultural', 'Biblioteca', 'Museo', 'Sala de Conciertos', 
      'Espacio Abierto', 'Club'
    ]
  },
  capacity: { 
    type: Number, 
    required: true,
    min: 1
  },
  services: [{
    type: String,
    enum: [
      'sound', 'lighting', 'projection', 'catering',
      'parking', 'accessibility'
    ]
  }],
  imageUrl: String,
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices para búsqueda eficiente
venueSchema.index({ city: 1 });
venueSchema.index({ venueType: 1 });
venueSchema.index({ capacity: 1 });
venueSchema.index({ services: 1 });

export const Venue = model<IVenue>('Venue', venueSchema);
