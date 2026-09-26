import { eventRepository } from "@/lib/events/repository";
import type { CheckInRecord, EventDraft, PortalTicket, Reward } from "./types";

const tickets: PortalTicket[] = [
  { id: "ticket-001", eventId: "monad-builders-night", tokenId: "#0001", eventName: "Monad Builders Night", startsAt: "2026-10-19T18:30:00.000Z", venue: "DasDas, Istanbul", image: "/computer.png", price: "0.05", currency: "MON", status: "ACTIVE" },
  { id: "ticket-002", eventId: "onchain-art-assembly", tokenId: "#0042", eventName: "Onchain Art Assembly", startsAt: "2026-10-23T19:00:00.000Z", venue: "Arter, Istanbul", image: "/hands.png", price: "0.05", currency: "MON", status: "LISTED", listedPrice: "0.07" },
];
const checkIns: CheckInRecord[] = [];
const rewards: Reward[] = [
  { label: "0.01 MON", description: "A small on-chain credit for your next event." },
  { label: "BONUS", description: "Double points on your next ticket purchase." },
  { label: "FREE TICKET", description: "A ticket credit up to 0.05 MON." },
  { label: "TRY AGAIN", description: "A fresh spin is available tomorrow." },
  { label: "STICKET NFT", description: "An exclusive collectible for your wallet." },
];
const drafts: EventDraft[] = [];

export const portalRepository = {
  async listTickets() { return tickets; },
  async listCreatorEvents() { return eventRepository.list(); },
  async listCheckIns(eventId: string) { return checkIns.filter((record) => tickets.find((ticket) => ticket.id === record.ticketId)?.eventId === eventId); },
  async listRewards() { return rewards; },
  async listTicketForEvent(eventId: string, ticketId: string) { return tickets.find((ticket) => ticket.eventId === eventId && (ticket.id === ticketId || ticket.tokenId.replace("#", "") === ticketId)) ?? null; },
  async checkIn(eventId: string, ticketId: string) {
    const ticket = await this.listTicketForEvent(eventId, ticketId);
    if (!ticket) return { ok: false, message: "Ticket was not found for this event." };
    if (ticket.status === "USED" || checkIns.some((record) => record.ticketId === ticket.id)) return { ok: false, message: "This ticket has already been checked in." };
    ticket.status = "USED";
    const record = { ticketId: ticket.id, checkedInAt: new Date().toISOString() };
    checkIns.unshift(record);
    return { ok: true, record, ticket };
  },
  async setListing(id: string, price?: string) {
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket) return null;
    ticket.status = price ? "LISTED" : "ACTIVE";
    ticket.listedPrice = price;
    return ticket;
  },
  async spin() { return rewards[Math.floor(Math.random() * rewards.length)]; },
  async createEvent(draft: Omit<EventDraft, "id" | "status">) {
    const event = { ...draft, id: `draft-${Date.now()}`, status: "awaiting_contract" as const };
    drafts.unshift(event);
    return event;
  },
  async listDrafts() { return drafts; },
  async listMarketplace() { return tickets.filter((ticket) => ticket.status === "LISTED"); },
  async buyListing(id: string) {
    const ticket = tickets.find((item) => item.id === id && item.status === "LISTED");
    if (!ticket) return null;
    ticket.status = "ACTIVE";
    ticket.listedPrice = undefined;
    return ticket;
  },
  async transferTicket(id: string, recipient: string) {
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket || ticket.status === "USED") return null;
    return { ticket, recipient, status: "awaiting_contract" as const };
  },
};
