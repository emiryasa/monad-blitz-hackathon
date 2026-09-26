"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { WalletGate } from "@/components/wallet-gate";
import { useWallet } from "@/components/wallet-provider";
import type { EventSummary } from "@/lib/events/types";
import styles from "./page.module.css";

export default function MyEventsPage() {
  const { address } = useWallet();
  const [events, setEvents] = useState<EventSummary[]>([]);
  useEffect(() => { if (address) void fetch("/api/creator/events").then((response) => response.json()).then(({ data }) => setEvents(data)); }, [address]);
  const revenue = events.reduce((total, event) => total + (event.totalTickets - event.availableTickets) * Number(event.ticketPrice), 0).toFixed(2);
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.header}`}><div className={styles.intro}>{address && <p className={styles.address}>{address.slice(0, 6)}...{address.slice(-4)}</p>}<h1>My Events</h1><p>&gt; CREATOR_DASHBOARD // MANAGE_YOUR_EVENTS</p></div><div className={styles.stats}><div><span>[TOTAL_EVENTS]</span><b>{address ? events.length : "—"}</b></div><div><span>[TOTAL_REVENUE]</span><b>{address ? `${revenue} MON` : "—"}</b></div></div></section>{!address ? <WalletGate resource="created events" /> : <section className={`cornerAccents ${styles.panel}`}><div className={styles.panelHead}><h2>[YOUR_EVENTS]</h2><Link className={styles.create} href="/create">Create New ↗</Link></div>{events.length ? events.map((event) => <article className={styles.event} key={event.id}><div className={styles.image} style={{ backgroundImage: `url(${event.image})` }} /><div><h3>{event.name}</h3><p>Created {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(event.startsAt))}</p><div className={styles.measures}><span>Sold<b>{event.totalTickets - event.availableTickets}/{event.totalTickets}</b></span><span>Revenue<b className={styles.accent}>{((event.totalTickets - event.availableTickets) * Number(event.ticketPrice)).toFixed(2)} MON</b></span><span>Price<b>{event.ticketPrice} MON</b></span></div></div><div className={styles.actions}><Link href={`/discover/${event.id}`}>View ↗</Link><Link className={styles.checkin} href={`/check-in/${event.id}`}>Check-In</Link></div></article>) : <p className={styles.empty}>[NO_EVENTS_YET] Create your first event and start selling tickets.</p>}</section>}</div></AppShell>;
}
