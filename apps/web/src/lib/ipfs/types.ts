export interface EventMetadataInput {
  name: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export interface PinnedMetadata {
  cid: string;
  uri: `ipfs://${string}`;
  gatewayUrl: string;
}
