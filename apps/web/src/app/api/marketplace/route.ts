import { listMarketplaceTickets } from "@/lib/chain/tickets";

export async function GET() { return Response.json({ data: await listMarketplaceTickets() }); }
