export type TicketStatus = "ACTIVE" | "LISTED" | "USED";

export interface PortalTicket { id: string; eventId: string; tokenId: string; eventName: string; startsAt: string; venue: string; image: string; price: string; currency: "MON"; status: TicketStatus; listedPrice?: string }
export interface CheckInRecord { ticketId: string; checkedInAt: string }
export interface Reward { label: string; description: string; }
