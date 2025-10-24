import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { db } from '../db.js';
import { users } from '../schema.js';
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
} from '../types/user.types.js';

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
    console.log(`🔍 Intentando login para el usuario: ${email}`);

    try {
      // Buscar usuario por email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        console.log('❌ Usuario no encontrado');
        throw new AuthenticationError('Credenciales inválidas');
      }

      console.log(`✅ Usuario encontrado: ${user.id}`);
      
      // Verificar si el usuario tiene contraseña
      const userWithPassword = user as User & { password?: string };
      if (!userWithPassword.password) {
        console.log('❌ El usuario no tiene contraseña configurada');
        throw new AuthenticationError('Credenciales inválidas');
      }

      console.log('🔑 Verificando contraseña...');
      
      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
      console.log(`🔑 Resultado de la comparación de contraseña: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log('❌ Contraseña incorrecta');
        throw new AuthenticationError('Credenciales inválidas');
      }

      // Crear el objeto de usuario con la contraseña
      const userData: UserData = {
        ...user,
        password: userWithPassword.password
      };
      
      console.log('✅ Contraseña válida');

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
    } catch (error) {
      console.error('❌ Error en el login:', error);
      throw error;
    }
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    const {
      email,
      password,
      firstName,
      lastName,
      userType = 'general',
      city,
      phone
    } = data;

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

    // Extraer nombre del email si no se proporciona firstName
    const emailUsername = email.split('@')[0];
    const defaultFirstName = firstName || emailUsername;

    // Crear objeto con los datos del nuevo usuario
    const newUserData = {
      id: userId,
      email,
      password: hashedPassword,
      firstName: defaultFirstName,
      lastName: lastName || null,
      userType: userType as 'general' | 'artist',
      city: city || null,
      phone: phone || null,
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
      // Campos de onboarding - usuario nuevo necesita completar onboarding
      emailVerified: false,
      onboardingCompleted: false,
      onboardingStep: 'user-type-selection',
      onboardingStartedAt: now,
      // Campos con valores por defecto
      displayName: null,
      profileImageUrl: null,
      coverImageUrl: null,
      bio: null,
      address: null,
      website: null,
      socialMedia: {},
      isFeatured: false,
      username: null,
      shortBio: null,
      interestedCategories: null,
      interestedTags: null,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      onboardingData: null,
      onboardingCompletedAt: null
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
