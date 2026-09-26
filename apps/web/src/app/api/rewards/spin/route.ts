import { portalRepository } from "@/lib/portal/repository";

export async function POST() {
  return Response.json({ data: await portalRepository.spin(), status: "awaiting_contract" }, { status: 201 });
}
