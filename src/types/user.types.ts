import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema.js';

// Definir tipos base del esquema
export type User = {
  id: string;
  email: string;
  password?: string | null;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  userType: 'general' | 'artist' | 'company';
  bio: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  socialMedia: any;
  isVerified: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  rating: string | null;
  totalReviews: number;
  fanCount: number;
  preferences: any;
  settings: any;
  lastActive: Date | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

// Asegurarnos de que UserWithId siempre tenga un id
export type UserWithId = User & {
  id: string;
  email: string;
  userType: 'general' | 'artist' | 'company';
};

export type NewUser = InferInsertModel<typeof users>;

// Tipos personalizados
export type UserData = Omit<User, 'password'> & { password?: string };
export type UserInsert = NewUser;
export type SanitizedUser = Omit<User, 'password'>;

// Tipo para el token JWT
export interface JwtPayload {
  id: string;
  email: string;
  userType: 'general' | 'artist' | 'company';
  [key: string]: any;
}

// Tipo para las credenciales de inicio de sesión
export interface LoginCredentials {
  email: string;
  password: string;
}

// Tipo para los datos de registro
export interface RegisterData {
  email: string;
  password: string;
  firstName?: string; // Opcional - se puede pedir en onboarding
  lastName?: string | null;
  userType?: 'general' | 'artist' | 'company'; // Opcional - se decide en onboarding
  city?: string | null;
  phone?: string | null; // Opcional - se puede pedir en onboarding
}

// Tipo para la respuesta de autenticación
export interface AuthResponse {
  token: string;
  user: SanitizedUser;
}
