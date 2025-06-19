import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { 
  UserData, 
  UserInsert, 
  SanitizedUser, 
  JwtPayload, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  User 
} from '../types/user.types';

// Los tipos ahora están definidos en src/types/user.types.ts

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthService {
  private static readonly JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '7d';
  private static readonly SALT_ROUNDS: number = 10;

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Buscar usuario por email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Asegurarse de que el usuario tiene una contraseña
    if (!user) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Obtener la contraseña con un tipo seguro
    const userWithPassword = user as User & { password: string };
    if (!userWithPassword.password) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Crear el objeto de usuario con la contraseña
    const userData: UserData = {
      ...user,
      password: userWithPassword.password
    };

    // Verificar contraseña
    const passwordToCompare = userWithPassword.password;
    if (!passwordToCompare) {
      throw new AuthenticationError('Credenciales inválidas');
    }
    
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);
    if (!isPasswordValid) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Actualizar última conexión
    await db
      .update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, userData.id));

    // Generar token JWT
    const token = this.generateToken(userData);

    // Devolver token y usuario (sin contraseña)
    return {
      token,
      user: this.sanitizeUser(userData)
    };
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName, userType = 'general', city } = data;

    // Verificar si el usuario ya existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      throw new AuthenticationError('El correo electrónico ya está en uso');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
    const userId = uuidv4();
    const now = new Date();

    // Crear objeto con los datos del nuevo usuario
    const newUserData = {
      id: userId,
      email,
      password: hashedPassword,
      firstName,
      lastName: lastName || null,
      userType: userType as 'general' | 'artist' | 'company',
      city: city || null,
      isVerified: false,
      isAvailable: true,
      rating: '0.00',
      totalReviews: 0,
      fanCount: 0,
      preferences: {},
      settings: {},
      lastActive: now,
      createdAt: now,
      updatedAt: now,
      // Campos con valores por defecto
      displayName: null,
      profileImageUrl: null,
      coverImageUrl: null,
      bio: null,
      address: null,
      phone: null,
      website: null,
      socialMedia: {},
      isFeatured: false
    } as const;

    // Insertar nuevo usuario
    const [newUser] = await db
      .insert(users)
      .values(newUserData as any)
      .returning();

    // Crear UserData a partir del nuevo usuario
    const userData: UserData = {
      ...newUser,
      password: hashedPassword
    };

    // Generar token JWT
    const token = this.generateToken(userData);

    // Devolver token y usuario (sin contraseña)
    return {
      token,
      user: this.sanitizeUser(userData)
    };
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private static sanitizeUser(user: UserData): SanitizedUser {
    if (!user) {
      throw new Error('User is required');
    }
    
    // Crear un objeto con las propiedades del usuario sin la contraseña
    const { password: _, ...userData } = user as UserData & { password?: string };
    return userData as unknown as SanitizedUser;
  }

  private static generateToken(user: UserData): string {
    if (!user || !user.id || !user.email || !user.userType) {
      throw new Error('Invalid user data for token generation');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType as 'general' | 'artist' | 'company'
    };

    return jwt.sign(
      payload,
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }
}
