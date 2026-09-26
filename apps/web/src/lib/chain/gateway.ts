import type { ChainIntegrationStatus, TicketingGateway } from "./types";

export const chainIntegrationStatus: ChainIntegrationStatus = {
  state: "awaiting_contracts",
  network: "monad-testnet",
  requiredArtifacts: [
    "EventFactory ABI and deployed address",
    "EventTicket ABI and deployed address",
  ],
};

export function getTicketingGateway(): TicketingGateway {
  throw new Error(
    "Chain integration is awaiting EventFactory and EventTicket deployment artifacts.",
  );
}
