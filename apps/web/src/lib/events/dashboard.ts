import type { EventRepository, EventSummary } from "./types";

export interface DashboardSummary {
  liveEvents: number;
  ticketsSold: number;
  events: EventSummary[];
}

export async function getDashboardSummary(repository: EventRepository): Promise<DashboardSummary> {
  const events = await repository.list();
  return { liveEvents: events.filter((event) => event.status !== "sold_out").length, ticketsSold: events.reduce((total, event) => total + event.totalTickets - event.availableTickets, 0), events: events.slice(0, 3) };
}
