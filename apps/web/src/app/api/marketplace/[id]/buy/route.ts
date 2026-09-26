import { portalRepository } from "@/lib/portal/repository";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const ticket = await portalRepository.buyListing(id);
  if (!ticket) return Response.json({ error: "Listing is no longer available." }, { status: 404 });
  return Response.json({ data: ticket, status: "awaiting_contract" }, { status: 201 });
}
