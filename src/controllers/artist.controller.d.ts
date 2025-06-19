import { Request, Response } from 'express';

export declare const getFeatured: (req: Request, res: Response) => Promise<void>;
export declare const getAll: (req: Request, res: Response) => Promise<void>;
export declare const getById: (req: Request, res: Response) => Promise<void>;

export declare const artistController: {
  getFeatured: (req: Request, res: Response) => Promise<void>;
  getAll: (req: Request, res: Response) => Promise<void>;
  getById: (req: Request, res: Response) => Promise<void>;
};
