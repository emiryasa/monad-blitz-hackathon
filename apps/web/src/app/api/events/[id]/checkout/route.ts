import { eventRepository } from "@/lib/events/repository";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const event = await eventRepository.findById(id);

  if (!event) return Response.json({ error: "Event not found." }, { status: 404 });
  if (!event.availableTickets) return Response.json({ error: "Tickets are sold out." }, { status: 409 });

  return Response.json({ data: { eventId: event.id, amount: event.ticketPrice, currency: event.currency, status: "awaiting_contract" } }, { status: 201 });
}
