import { eventRepository } from "@/lib/events/repository";
import type { EventCategory } from "@/lib/events/types";

const categories = new Set<EventCategory>(["music", "technology", "art", "community"]);

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");

  if (category && !categories.has(category as EventCategory)) {
    return Response.json({ error: "Invalid event category." }, { status: 400 });
  }

  const events = await eventRepository.list(category as EventCategory | undefined);
  return Response.json({ data: events, meta: { count: events.length } });
}
