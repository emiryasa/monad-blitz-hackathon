import { formatEther, getAddress, zeroAddress, type Address } from "viem";
import { eventRepository } from "@/lib/events/repository";
import type { EventSummary } from "@/lib/events/types";
import type { PortalTicket, TicketStatus } from "@/lib/portal/types";
import { publicClient } from "./client";
import { eventTicketAbi, ticketMarketplaceAbi } from "./contracts";
import { marketplaceAddress } from "./config";

function ticketId(collection: Address, tokenId: bigint) {
  return `${collection.toLowerCase()}-${tokenId}`;
}

function toPortalTicket(
  event: EventSummary,
  tokenId: bigint,
  status: TicketStatus,
  listing?: { seller: Address; price: bigint; expiresAt: bigint },
): PortalTicket {
  const collection = event.contractAddress as Address;
  return {
    id: ticketId(collection, tokenId),
    eventId: event.id,
    tokenId: `#${tokenId.toString().padStart(4, "0")}`,
    tokenIdValue: tokenId.toString(),
    contractAddress: collection,
    eventName: event.name,
    startsAt: event.startsAt,
    venue: `${event.venue}, ${event.city}`,
    image: event.image,
    price: event.ticketPrice,
    currency: "MON",
    status,
    listedPrice: listing ? formatEther(listing.price) : undefined,
    seller: listing?.seller,
    expiresAt: listing ? new Date(Number(listing.expiresAt) * 1000).toISOString() : undefined,
  };
}

async function chainEvents() {
  return (await eventRepository.list()).filter(
    (event): event is EventSummary & { contractAddress: Address } => Boolean(event.contractAddress),
  );
}

async function currentListing(collection: Address, tokenId: bigint) {
  if (!marketplaceAddress) return undefined;
  const [seller, price, expiresAt] = await publicClient.readContract({
    address: marketplaceAddress,
    abi: ticketMarketplaceAbi,
    functionName: "listings",
    args: [collection, tokenId],
  });
  if (seller === zeroAddress) return undefined;
  return { seller, price, expiresAt };
}

export async function listOwnedTickets(ownerInput: string): Promise<PortalTicket[]> {
  const owner = getAddress(ownerInput);
  const events = await chainEvents();
  const groups = await Promise.all(events.map(async (event) => {
    const collection = event.contractAddress;
    const minted = await publicClient.readContract({ address: collection, abi: eventTicketAbi, functionName: "totalMinted" });
    const tokens = Array.from({ length: Number(minted) }, (_, index) => BigInt(index + 1));
    const owned = await Promise.all(tokens.map(async (tokenId) => {
      const tokenOwner = await publicClient.readContract({ address: collection, abi: eventTicketAbi, functionName: "ownerOf", args: [tokenId] });
      if (tokenOwner.toLowerCase() !== owner.toLowerCase()) return null;
      const [used, listing] = await Promise.all([
        publicClient.readContract({ address: collection, abi: eventTicketAbi, functionName: "isUsed", args: [tokenId] }),
        currentListing(collection, tokenId),
      ]);
      return toPortalTicket(event, tokenId, used ? "USED" : listing ? "LISTED" : "ACTIVE", listing);
    }));
    return owned.filter((ticket): ticket is PortalTicket => ticket !== null);
  }));
  return groups.flat();
}

export async function listMarketplaceTickets(): Promise<PortalTicket[]> {
  const marketplace = marketplaceAddress;
  if (!marketplace) return [];
  const events = await chainEvents();
  const groups = await Promise.all(events.map(async (event) => {
    const collection = event.contractAddress;
    const minted = await publicClient.readContract({ address: collection, abi: eventTicketAbi, functionName: "totalMinted" });
    const tokens = Array.from({ length: Number(minted) }, (_, index) => BigInt(index + 1));
    const listings = await Promise.all(tokens.map(async (tokenId) => {
      const listing = await currentListing(collection, tokenId);
      if (!listing) return null;
      const valid = await publicClient.readContract({ address: marketplace, abi: ticketMarketplaceAbi, functionName: "isListingValid", args: [collection, tokenId] }).catch(() => false);
      return valid ? toPortalTicket(event, tokenId, "LISTED", listing) : null;
    }));
    return listings.filter((ticket): ticket is PortalTicket => ticket !== null);
  }));
  return groups.flat();
}
