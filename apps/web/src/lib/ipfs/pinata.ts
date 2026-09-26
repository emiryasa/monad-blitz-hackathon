import type { EventMetadataInput, PinnedMetadata } from "./types";
import { toIpfsGatewayUrl } from "./url";

const endpoint = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export async function pinEventMetadata(metadata: EventMetadataInput): Promise<PinnedMetadata> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not configured.");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ pinataContent: metadata, pinataMetadata: { name: metadata.name } }),
  });

  if (!response.ok) throw new Error("Pinata metadata upload failed.");
  const payload = (await response.json()) as { IpfsHash: string };
  const uri = `ipfs://${payload.IpfsHash}` as const;
  return { cid: payload.IpfsHash, uri, gatewayUrl: toIpfsGatewayUrl(uri) };
}
