import { portalRepository } from "@/lib/portal/repository";

export async function GET() { return Response.json({ data: await portalRepository.listDrafts() }); }

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const required = ["name", "description", "startsAt", "venue", "category", "supply", "price"];
  if (required.some((key) => !body[key])) return Response.json({ error: "Please complete all required event details." }, { status: 400 });
  const event = await portalRepository.createEvent({ name: String(body.name), description: String(body.description), startsAt: String(body.startsAt), venue: String(body.venue), category: String(body.category), supply: Number(body.supply), price: String(body.price), image: String(body.image || "/lock.png") });
  return Response.json({ data: event }, { status: 201 });
}
