import { pinEventMetadata } from "@/lib/ipfs/pinata";
import type { EventMetadataInput } from "@/lib/ipfs/types";

function validMetadata(value: unknown): value is EventMetadataInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<EventMetadataInput>;
  return [input.name, input.description, input.image].every(
    (field) => typeof field === "string" && field.length > 0 && field.length <= 5000,
  );
}

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  if (!validMetadata(payload)) return Response.json({ error: "Invalid event metadata." }, { status: 400 });

  try {
    const pinned = await pinEventMetadata(payload);
    return Response.json({ data: pinned }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Metadata upload failed.";
    return Response.json({ error: message }, { status: 503 });
  }
}
