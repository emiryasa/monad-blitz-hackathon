"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { WalletGate } from "@/components/wallet-gate";
import { useWallet } from "@/components/wallet-provider";
import type { PortalTicket } from "@/lib/portal/types";
import styles from "./page.module.css";

export default function TicketsPage() {
  const { address } = useWallet();
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => { if (address) void fetch("/api/tickets").then((response) => response.json()).then(({ data }) => setTickets(data)); }, [address]);
  const active = tickets.filter((ticket) => ticket.status !== "USED");
  const value = tickets.reduce((total, ticket) => total + Number(ticket.price), 0).toFixed(2);
  async function toggleListing(ticket: PortalTicket) { const response = await fetch(`/api/tickets/${ticket.id}/listing`, ticket.status === "LISTED" ? { method: "DELETE" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price: "0.07" }) }); if (!response.ok) return setNotice("Unable to update listing."); const { data } = await response.json() as { data: PortalTicket }; setTickets((items) => items.map((item) => item.id === data.id ? data : item)); setNotice(ticket.status === "LISTED" ? "Listing cancelled." : "Listing prepared for 0.07 MON. Wallet signing will be enabled with the contract ABI."); }
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.header}`}><div className={styles.intro}>{address && <p className={styles.address}>{address.slice(0, 6)}...{address.slice(-4)}</p>}<h1>My Tickets</h1><p>&gt; NFT_COLLECTION // READY_TO_USE_OR_TRADE</p></div><div className={styles.stats}><div><span>[TOTAL_TICKETS]</span><b>{address ? tickets.length : "—"}</b></div><div><span>[ACTIVE]</span><b>{address ? active.length : "—"}</b></div><div><span>[TOTAL_VALUE]</span><b>{address ? `${value} MON` : "—"}</b></div></div></section>{!address ? <WalletGate resource="NFT tickets" /> : <section className={`cornerAccents ${styles.panel}`}><div className={styles.panelHead}><h2>[ACTIVE_TICKETS]</h2><span>{active.length} tickets</span></div>{notice && <p className={styles.empty}>{notice}</p>}{active.length ? <div className={styles.grid}>{active.map((ticket) => <article className={styles.card} key={ticket.id}><div className={styles.image} style={{ backgroundImage: `url(${ticket.image})` }}><b className={styles.token}>{ticket.tokenId}</b></div><h3>{ticket.eventName}</h3><p>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(ticket.startsAt))} · {ticket.venue}</p><b className={styles.badge}>{ticket.status}</b><div className={styles.actions}><Link href={`/tickets/${ticket.id}`}>View</Link><button onClick={() => void toggleListing(ticket)} type="button">{ticket.status === "LISTED" ? "Cancel Listing" : "Sell"}</button></div></article>)}</div> : <p className={styles.empty}>[NO_TICKETS] Start collecting NFT tickets from events.</p>}</section>}</div></AppShell>;
}
