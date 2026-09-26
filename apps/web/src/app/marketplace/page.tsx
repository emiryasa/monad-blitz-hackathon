"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { PortalTicket } from "@/lib/portal/types";
import styles from "../portal.module.css";

export default function MarketplacePage() {
  const [listings, setListings] = useState<PortalTicket[]>([]); const [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/marketplace").then((response) => response.json()).then(({ data }) => setListings(data)); }, []);
  async function buy(id: string) { const response = await fetch(`/api/marketplace/${id}/buy`, { method: "POST" }); if (!response.ok) return setMessage("This listing is no longer available."); setListings((items) => items.filter((item) => item.id !== id)); setMessage("Purchase intent prepared. Confirm it with your Monad wallet when contracts are connected."); }
  const floor = listings.length ? Math.min(...listings.map((item) => Number(item.listedPrice))) : 0;
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.eyebrow}>[SECONDARY_MARKET]</p><h1>Marketplace</h1><p>Buy verified tickets from other Sticket holders.</p></div><div className={styles.stats}><div><b>{floor || "—"}</b><span>Floor Price · MON</span></div><div><b>{listings.length}</b><span>Live Listings</span></div></div></section><section className={`cornerAccents ${styles.panel}`}><div className={styles.sectionHead}><h2>[AVAILABLE_LISTINGS]</h2><span>CREATOR ROYALTIES READY</span></div>{message && <p className={styles.result}>{message}</p>}{listings.length ? listings.map((ticket) => <article className={styles.event} key={ticket.id}><div className={styles.eventImage} style={{ backgroundImage: `url(${ticket.image})` }} /><div><h3>{ticket.eventName} · {ticket.tokenId}</h3><p>{ticket.venue} · Original price {ticket.price} MON</p></div><div className={styles.eventStats}><span>Listed price<b>{ticket.listedPrice} MON</b></span><span>Status<b>VERIFIED</b></span></div><button className={styles.primary} onClick={() => void buy(ticket.id)} type="button">Buy Ticket →</button></article>) : <p className={styles.notice}>No secondary listings are available right now.</p>}</section></div></AppShell>;
}
