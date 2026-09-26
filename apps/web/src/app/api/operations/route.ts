import { chainIntegrationStatus } from "@/lib/chain/gateway";

export async function GET() {
  return Response.json({ data: { ...chainIntegrationStatus, supportedIntents: ["createEvent", "buyPrimaryTicket", "listTicket", "buyListedTicket", "transferFrom", "consumeTicket"] } });
}
