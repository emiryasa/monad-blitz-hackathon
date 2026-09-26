export type TicketStatus = "ACTIVE" | "LISTED" | "USED";

export interface PortalTicket { id: string; eventId: string; tokenId: string; eventName: string; startsAt: string; venue: string; image: string; price: string; currency: "MON"; status: TicketStatus; listedPrice?: string; contractAddress?: `0x${string}`; tokenIdValue?: string; seller?: `0x${string}`; expiresAt?: string }
export interface CheckInRecord { ticketId: string; checkedInAt: string }
export interface Reward { label: string; description: string; }
export interface EventDraft { id: string; name: string; description: string; startsAt: string; venue: string; category: string; supply: number; price: string; image: string; status: "awaiting_contract"; }
