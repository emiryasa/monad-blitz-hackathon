import { portalRepository } from "@/lib/portal/repository";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { recipient } = await request.json() as { recipient?: string };
  const { id } = await context.params;
  if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) return Response.json({ error: "Enter a valid recipient address." }, { status: 400 });
  const transfer = await portalRepository.transferTicket(id, recipient);
  if (!transfer) return Response.json({ error: "This ticket cannot be transferred." }, { status: 409 });
  return Response.json({ data: transfer }, { status: 201 });
}
