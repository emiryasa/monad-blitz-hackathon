import type { EventCategory, EventRepository, EventSummary } from "./types";
import { formatEther, type Address } from "viem";
import { publicClient } from "@/lib/chain/client";
import { eventFactoryAbi, eventTicketAbi } from "@/lib/chain/contracts";
import { eventFactoryAddress } from "@/lib/chain/config";
import { toIpfsGatewayUrl } from "@/lib/ipfs/url";

const seedEvents: EventSummary[] = [
  { id: "monad-builders-night", name: "Monad Builders Night", description: "A preview event showing how an on-chain event will appear.", category: "technology", status: "upcoming", startsAt: "2026-10-19T18:30:00.000Z", venue: "DasDas", city: "Istanbul", ticketPrice: "0.05", currency: "MON", availableTickets: 100, totalTickets: 100, image: "/computer.png", isDemo: true },
  { id: "onchain-art-assembly", name: "Onchain Art Assembly", description: "A preview event showing how an on-chain event will appear.", category: "art", status: "upcoming", startsAt: "2026-10-23T19:00:00.000Z", venue: "Arter", city: "Istanbul", ticketPrice: "0.05", currency: "MON", availableTickets: 100, totalTickets: 100, image: "/hands.png", isDemo: true },
  { id: "monadic-sounds", name: "Monadic Sounds", description: "A preview event showing how an on-chain event will appear.", category: "music", status: "upcoming", startsAt: "2026-10-27T20:00:00.000Z", venue: "Zorlu PSM", city: "Istanbul", ticketPrice: "0.05", currency: "MON", availableTickets: 100, totalTickets: 100, image: "/watchtower.png", isDemo: true },
];

interface EventMetadata {
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type?: string; value?: string | number }>;
}

function metadataValue(metadata: EventMetadata, trait: string) {
  return metadata.attributes?.find((item) => item.trait_type?.toLowerCase() === trait.toLowerCase())?.value;
}

async function loadMetadata(uri: string): Promise<EventMetadata> {
  if (!uri) return {};
  try {
    const response = await fetch(toIpfsGatewayUrl(uri), { next: { revalidate: 60 } });
    return response.ok ? await response.json() as EventMetadata : {};
  } catch {
    return {};
  }
}

async function listOnChainEvents(): Promise<EventSummary[]> {
  const factoryAddress = eventFactoryAddress;
  if (!factoryAddress) return [];
  try {
    const count = await publicClient.readContract({ address: factoryAddress, abi: eventFactoryAbi, functionName: "eventCount" });
    return await Promise.all(Array.from({ length: Number(count) }, async (_, index) => {
      const info = await publicClient.readContract({ address: factoryAddress, abi: eventFactoryAbi, functionName: "getEvent", args: [BigInt(index)] });
      const [available, metadata] = await Promise.all([
        publicClient.readContract({ address: info.ticket, abi: eventTicketAbi, functionName: "ticketsAvailable" }),
        loadMetadata(info.eventMetadataURI),
      ]);
      const category = String(metadataValue(metadata, "Category") || "other").toLowerCase() as EventCategory;
      const location = String(metadataValue(metadata, "Venue") || "Location TBA");
      const [venue, ...cityParts] = location.split(",");
      return {
        id: info.ticket.toLowerCase(),
        name: info.name,
        description: metadata.description || "On-chain event on Monad.",
        category,
        status: available === BigInt(0) ? "sold_out" : Number(info.salesStartAt) * 1000 > Date.now() ? "upcoming" : "on_sale",
        startsAt: new Date(Number(info.eventStartsAt) * 1000).toISOString(),
        venue: venue.trim(),
        city: cityParts.join(",").trim() || "TBA",
        ticketPrice: formatEther(info.primaryPrice),
        currency: "MON" as const,
        availableTickets: Number(available),
        totalTickets: Number(info.maxSupply),
        image: metadata.image ? toIpfsGatewayUrl(metadata.image) : "/lock.png",
        contractAddress: info.ticket as Address,
        organizer: info.organizer as Address,
        symbol: info.symbol,
        creatorFeeBps: Number(info.creatorFeeBps),
      } satisfies EventSummary;
    }));
  } catch (error) {
    console.error("Unable to load Monad events", error);
    return [];
  }
}

class SeedEventRepository implements EventRepository {
  async list(category?: EventCategory) {
    const events = [...await listOnChainEvents(), ...seedEvents];
    return category ? events.filter((event) => event.category === category) : events;
  }

  async findById(id: string) {
    return (await this.list()).find((event) => event.id.toLowerCase() === id.toLowerCase()) ?? null;
  }
}

export const eventRepository: EventRepository = new SeedEventRepository();
