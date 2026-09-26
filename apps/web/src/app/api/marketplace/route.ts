import { portalRepository } from "@/lib/portal/repository";

export async function GET() { return Response.json({ data: await portalRepository.listMarketplace() }); }
