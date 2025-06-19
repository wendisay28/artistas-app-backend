export type EventType = 'concert' | 'exhibition' | 'workshop' | 'festival' | 'conference' | 'theater' | 'dance' | 'other';
export type EventCategory = 'música' | 'teatro' | 'arte' | 'deportes' | 'gastronomía' | 'conferencia' | 'talleres' | 'otros';

export interface BaseEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  eventType: EventType;
  category: EventCategory;
  subcategories?: string[];
  location?: string;
  virtualLink?: string;
  coverImage: string;
  maxAttendees?: number;
  allowRecommendations: boolean;
  isRecurring: boolean;
  additionalDates?: Date[];
  creatorId: string;
  creatorType: 'general' | 'company';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FreeEvent extends BaseEvent {
  isPaid: false;
  price?: never;
  allowReservations?: boolean;
}

export interface PaidEvent extends BaseEvent {
  isPaid: true;
  price: number;
  allowReservations: boolean;
}

export type Event = FreeEvent | PaidEvent;

export interface CreateEventInput {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  eventType: EventType;
  category: EventCategory;
  subcategories?: string[];
  location?: string;
  virtualLink?: string;
  coverImage: string;
  maxAttendees?: number;
  allowRecommendations: boolean;
  isRecurring: boolean;
  additionalDates?: Date[];
  isPaid: boolean;
  price?: number;
  allowReservations?: boolean;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

export interface EventFilterOptions {
  category?: EventCategory;
  eventType?: EventType;
  isPaid?: boolean;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}
