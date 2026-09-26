import { portalRepository } from "@/lib/portal/repository";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  return Response.json({ data: await portalRepository.listCheckIns(eventId) });
}

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { ticketId } = await request.json() as { ticketId?: string };
  const { eventId } = await context.params;
  if (!ticketId) return Response.json({ error: "Ticket ID is required." }, { status: 400 });
  const result = await portalRepository.checkIn(eventId, ticketId);
  return Response.json({ data: result }, { status: result.ok ? 200 : 409 });
}
