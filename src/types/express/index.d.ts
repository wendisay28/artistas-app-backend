import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: string;
        [key: string]: any;
      };
    }

    interface Response {
      success: (data?: any, message?: string, statusCode?: number) => void;
      error: (message: string, statusCode?: number, error?: any) => void;
    }
  }
}

export {};
