import { InferSelectModel } from 'drizzle-orm';
import * as schema from '../schema';

export type User = InferSelectModel<typeof schema.users> & {
  isFeatured: boolean;
  rating: string | null;
  totalReviews: number;
};

export type Category = InferSelectModel<typeof schema.categories>;
export type Artist = InferSelectModel<typeof schema.artists>;
export type Event = InferSelectModel<typeof schema.events>;
export type Venue = InferSelectModel<typeof schema.venues>;
export type Recommendation = InferSelectModel<typeof schema.recommendations>;
export type BlogPost = InferSelectModel<typeof schema.blogPosts>;
// Agrega más tipos según sea necesario
