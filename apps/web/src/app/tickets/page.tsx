"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { PortalTicket } from "@/lib/portal/types";
import styles from "../portal.module.css";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => { void fetch("/api/tickets").then((response) => response.json()).then(({ data }) => setTickets(data)); }, []);
  async function toggleListing(ticket: PortalTicket) {
    const response = await fetch(`/api/tickets/${ticket.id}/listing`, ticket.status === "LISTED" ? { method: "DELETE" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: "0.07" }) });
    if (!response.ok) return setNotice("Unable to update listing.");
    const { data } = await response.json() as { data: PortalTicket };
    setTickets((items) => items.map((item) => item.id === data.id ? data : item));
    setNotice(ticket.status === "LISTED" ? "Listing cancelled. Contract execution will be added with the Monad ABI." : "Ticket listed at 0.07 MON. Contract execution will be added with the Monad ABI.");
  }
  const active = tickets.filter((ticket) => ticket.status !== "USED");
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.eyebrow}>[TICKET_VAULT]</p><h1>My Tickets</h1><p>Tickets you own, trade, and carry on-chain.</p></div><div className={styles.stats}><div><b>{tickets.length}</b><span>Total Tickets</span></div><div><b>{active.length}</b><span>Active</span></div></div></section><section className={`cornerAccents ${styles.panel}`}><div className={styles.sectionHead}><h2>[YOUR_TICKETS]</h2><span>{active.length} AVAILABLE</span></div>{notice && <p className={styles.result}>{notice}</p>}<div className={styles.grid}>{tickets.map((ticket) => <article className={styles.card} key={ticket.id}><div className={styles.ticketImage} style={{ backgroundImage: `url(${ticket.image})` }} /><div><h3>{ticket.eventName}</h3><p>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(ticket.startsAt))} · {ticket.venue}</p><b className={styles.badge}>{ticket.status}</b><div className={styles.actions}><button type="button">View Ticket</button>{ticket.status !== "USED" && <button onClick={() => void toggleListing(ticket)} type="button">{ticket.status === "LISTED" ? "Cancel Listing" : "Sell · 0.07 MON"}</button>}</div></div></article>)}</div></section></div></AppShell>;
}
