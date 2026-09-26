import { isAddress } from "viem";
import { listOwnedTickets } from "@/lib/chain/tickets";

export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get("owner");
  if (!owner || !isAddress(owner)) return Response.json({ error: "A valid wallet address is required." }, { status: 400 });
  return Response.json({ data: await listOwnedTickets(owner) });
}
