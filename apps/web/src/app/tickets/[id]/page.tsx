"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { PortalTicket } from "@/lib/portal/types";
import styles from "../../portal.module.css";

export default function TicketPassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const [ticket, setTicket] = useState<PortalTicket | null>(null);
  useEffect(() => { void fetch("/api/tickets").then((response) => response.json()).then(({ data }) => setTicket(data.find((item: PortalTicket) => item.id === id) ?? null)); }, [id]);
  const cells = useMemo(() => Array.from({ length: 121 }, (_, index) => ((index * 13 + id.length * 7) % 10) > 4), [id]);
  if (!ticket) return <AppShell><div className={styles.page}><p className={styles.notice}>Loading ticket pass…</p></div></AppShell>;
  return <AppShell><div className={styles.page}><Link className={styles.eyebrow} href="/tickets">← MY TICKETS</Link><section className={`cornerAccents ${styles.panel}`} style={{ marginTop: 16 }}><div className={styles.sectionHead}><h2>[TICKET_PASS]</h2><span>{ticket.tokenId} · {ticket.status}</span></div><div className={styles.grid}><div className={styles.card}><div className={styles.ticketImage} style={{ backgroundImage: `url(${ticket.image})` }} /><div><h3>{ticket.eventName}</h3><p>{new Date(ticket.startsAt).toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}</p><p>{ticket.venue}</p></div></div><div className={styles.card}><div style={{ display: "grid", gridTemplateColumns: "repeat(11, 10px)", gap: 2, width: 130, height: 130, padding: 10, background: "#fff" }}>{cells.map((filled, index) => <i key={index} style={{ background: filled ? "#000" : "#fff" }} />)}</div><div><h3>Venue Check-In</h3><p>Show this pass at the venue. The QR payload will be signed by EventTicket after contract integration.</p><button className={styles.outline} onClick={() => window.print()} type="button">Print Pass</button></div></div></div></section></div></AppShell>;
}
