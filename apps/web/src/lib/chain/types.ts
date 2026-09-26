export type Address = `0x${string}`;

export interface CreateEventInput {
  name: string;
  symbol: string;
  metadataUri: string;
  ticketPriceWei: bigint;
  maxSupply: number;
  royaltyBps: number;
}

export interface ListingInput {
  ticketContract: Address;
  tokenId: bigint;
  priceWei: bigint;
}

export interface TicketingGateway {
  createEvent(input: CreateEventInput): Promise<{ transactionHash: Address }>;
  buyPrimaryTicket(eventAddress: Address, quantity: number): Promise<{ transactionHash: Address }>;
  listTicket(input: ListingInput): Promise<{ transactionHash: Address }>;
  updateListing(listingId: bigint, priceWei: bigint): Promise<{ transactionHash: Address }>;
  cancelListing(listingId: bigint): Promise<{ transactionHash: Address }>;
  buyListedTicket(listingId: bigint): Promise<{ transactionHash: Address }>;
  consumeTicket(ticketContract: Address, tokenId: bigint): Promise<{ transactionHash: Address }>;
}

export type ChainIntegrationState = "awaiting_contracts" | "ready";

export interface ChainIntegrationStatus {
  state: ChainIntegrationState;
  network: "monad-testnet";
  requiredArtifacts: string[];
}
