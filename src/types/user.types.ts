import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from '../schema';

// Definir tipos base del esquema
export type User = InferSelectModel<typeof users>;
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
  firstName: string;
  lastName?: string | null;
  userType?: 'general' | 'artist' | 'company';
  city?: string | null;
}

// Tipo para la respuesta de autenticación
export interface AuthResponse {
  token: string;
  user: SanitizedUser;
}
