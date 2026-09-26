import { chainIntegrationStatus } from "@/lib/chain/gateway";

export function GET() {
  return Response.json({ data: chainIntegrationStatus });
}
