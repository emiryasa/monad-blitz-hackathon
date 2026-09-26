import type { ChainIntegrationStatus, TicketingGateway } from "./types";
import { hasChainConfiguration } from "./config";

export const chainIntegrationStatus: ChainIntegrationStatus = {
  state: hasChainConfiguration() ? "ready" : "awaiting_contracts",
  network: "monad-testnet",
  requiredArtifacts: hasChainConfiguration() ? [] : [
    "EventFactory ABI and deployed address",
    "EventTicket ABI and deployed address",
  ],
};

export function getTicketingGateway(): TicketingGateway {
  throw new Error(
    "Chain integration is awaiting EventFactory and EventTicket deployment artifacts.",
  );
}
