import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  // Datos básicos
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'artist' | 'general' | 'company';
  profileImageUrl?: string;
  city?: string;
  bio?: string;
  isVerified: boolean;
  rating?: number;
  
  // Campos específicos para artistas
  artisticName?: string;
  artisticCategories?: string[];
  skills?: string[];
  portfolio?: Array<{
    type: 'image' | 'video';
    url: string;
    title?: string;
    description?: string;
  }>;
  
  // Campos específicos para empresas/espacios culturales
  companyName?: string;
  companyCategory?: string;
  address?: string;
  services?: string[];
  
  // Campos comunes
  socialMedia?: {
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  // Datos básicos
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true
  },
  lastName: { 
    type: String, 
    trim: true 
  },
  userType: { 
    type: String, 
    enum: ['artist', 'general', 'company'],
    default: 'general'
  },
  profileImageUrl: { type: String },
  city: { type: String },
  bio: { type: String },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  
  // Campos específicos para artistas
  artisticName: { type: String },
  artisticCategories: [{ type: String }],
  skills: [{ type: String }],
  portfolio: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: { type: String, required: true },
    title: { type: String },
    description: { type: String }
  }],
  
  // Campos específicos para empresas/espacios culturales
  companyName: { type: String },
  companyCategory: { type: String },
  address: { type: String },
  services: [{ type: String }],
  
  // Redes sociales
  socialMedia: {
    website: { type: String },
    instagram: { type: String },
    facebook: { type: String },
    twitter: { type: String },
    youtube: { type: String },
    tiktok: { type: String }
  }
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema);
