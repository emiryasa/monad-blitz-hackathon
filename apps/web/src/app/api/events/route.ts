import { eventRepository } from "@/lib/events/repository";
import type { EventCategory } from "@/lib/events/types";

const categories = new Set<EventCategory>(["music", "technology", "conference", "sports", "art", "theater", "festival", "community", "other"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q")?.trim().toLowerCase();

  if (category && !categories.has(category as EventCategory)) {
    return Response.json({ error: "Invalid event category." }, { status: 400 });
  }

  let events = await eventRepository.list(category as EventCategory | undefined);
  if (query) events = events.filter((event) => `${event.name} ${event.description} ${event.city}`.toLowerCase().includes(query));
  return Response.json({ data: events, meta: { count: events.length } });
}
