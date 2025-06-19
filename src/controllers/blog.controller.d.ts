import { Request, Response } from 'express';

export declare const getRecentPosts: (req: Request, res: Response) => Promise<void>;

export declare const blogController: {
  getRecentPosts: (req: Request, res: Response) => Promise<void>;
};
