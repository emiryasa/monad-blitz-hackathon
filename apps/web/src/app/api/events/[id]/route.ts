import { eventRepository } from "@/lib/events/repository";

export async function GET(_request: Request, context: RouteContext<"/api/events/[id]">) {
  const { id } = await context.params;
  const event = await eventRepository.findById(id);

  if (!event) return Response.json({ error: "Event not found." }, { status: 404 });
  return Response.json({ data: event });
}
