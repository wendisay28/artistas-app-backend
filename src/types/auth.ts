export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userType?: 'general' | 'artist' | 'company';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    userType: 'general' | 'artist' | 'company';
    profileImageUrl?: string;
  };
  token: string;
}

export interface DecodedToken {
  uid: string;
  email: string;
  exp: number;
  iat: number;
}
