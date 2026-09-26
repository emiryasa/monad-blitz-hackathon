import type { EventCategory, EventRepository, EventSummary } from "./types";

const seedEvents: EventSummary[] = [
  { id: "monad-builders-night", name: "Monad Builders Night", description: "A gathering for builders shaping the on-chain future.", category: "technology", status: "on_sale", startsAt: "2026-10-19T18:30:00.000Z", venue: "DasDas", city: "Istanbul", ticketPrice: "0.05", currency: "MON", availableTickets: 80, totalTickets: 100, image: "/computer.png" },
  { id: "onchain-art-assembly", name: "Onchain Art Assembly", description: "An evening at the intersection of digital art and ownership.", category: "art", status: "on_sale", startsAt: "2026-10-23T19:00:00.000Z", venue: "Arter", city: "Istanbul", ticketPrice: "0.05", currency: "MON", availableTickets: 65, totalTickets: 100, image: "/hands.png" },
  { id: "monadic-sounds", name: "Monadic Sounds", description: "A live music experience with tickets that stay with you.", category: "music", status: "upcoming", startsAt: "2026-10-27T20:00:00.000Z", venue: "Zorlu PSM", city: "Istanbul", ticketPrice: "0.05", currency: "MON", availableTickets: 50, totalTickets: 100, image: "/watchtower.png" },
];

class SeedEventRepository implements EventRepository {
  async list(category?: EventCategory) {
    return category ? seedEvents.filter((event) => event.category === category) : seedEvents;
  }

  async findById(id: string) {
    return seedEvents.find((event) => event.id === id) ?? null;
  }
}

export const eventRepository: EventRepository = new SeedEventRepository();
