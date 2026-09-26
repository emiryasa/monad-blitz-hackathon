export type EventCategory = "music" | "technology" | "conference" | "sports" | "art" | "theater" | "festival" | "community" | "other";

export type EventStatus = "on_sale" | "sold_out" | "upcoming";

export interface EventSummary {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  startsAt: string;
  venue: string;
  city: string;
  ticketPrice: string;
  currency: "MON";
  availableTickets: number;
  totalTickets: number;
  image: string;
  contractAddress?: `0x${string}`;
  organizer?: `0x${string}`;
  symbol?: string;
  creatorFeeBps?: number;
  isDemo?: boolean;
}

export interface EventRepository {
  list(category?: EventCategory): Promise<EventSummary[]>;
  findById(id: string): Promise<EventSummary | null>;
}
