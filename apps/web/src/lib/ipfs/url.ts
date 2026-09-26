const fallbackGateway = "https://gateway.pinata.cloud/ipfs";

export function toIpfsGatewayUrl(uri: string): string {
  if (!uri.startsWith("ipfs://")) return uri;
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY?.replace(/\/$/, "") ?? fallbackGateway;
  return `${gateway}/${uri.slice("ipfs://".length)}`;
}
