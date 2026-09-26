import { portalRepository } from "@/lib/portal/repository";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { price } = await request.json() as { price?: string };
  if (!price || !/^\d+(\.\d+)?$/.test(price)) return Response.json({ error: "A valid listing price is required." }, { status: 400 });
  const { id } = await context.params;
  const ticket = await portalRepository.setListing(id, price);
  if (!ticket) return Response.json({ error: "Ticket not found." }, { status: 404 });
  return Response.json({ data: ticket, status: "awaiting_contract" }, { status: 201 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ticket = await portalRepository.setListing(id);
  if (!ticket) return Response.json({ error: "Ticket not found." }, { status: 404 });
  return Response.json({ data: ticket, status: "awaiting_contract" });
}
