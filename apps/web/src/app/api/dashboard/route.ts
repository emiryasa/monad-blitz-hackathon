import { getDashboardSummary } from "@/lib/events/dashboard";
import { eventRepository } from "@/lib/events/repository";

export async function GET() {
  return Response.json({ data: await getDashboardSummary(eventRepository) });
}
