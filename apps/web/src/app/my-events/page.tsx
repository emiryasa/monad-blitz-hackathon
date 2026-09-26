"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { EventSummary } from "@/lib/events/types";
import styles from "../portal.module.css";

export default function MyEventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  useEffect(() => { void fetch("/api/creator/events").then((response) => response.json()).then(({ data }) => setEvents(data)); }, []);
  const sold = events.reduce((total, event) => total + event.totalTickets - event.availableTickets, 0);
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.eyebrow}>[CREATOR_DASHBOARD]</p><h1>My Events</h1><p>Manage your events, revenue, and guest check-ins.</p></div><div className={styles.stats}><div><b>{events.length}</b><span>Total Events</span></div><div><b>{sold}</b><span>Tickets Sold</span></div></div></section><section className={`cornerAccents ${styles.panel}`}><div className={styles.sectionHead}><h2>[YOUR_EVENTS]</h2><Link className={styles.outline} href="/create">＋ Create New</Link></div>{events.map((event) => <article className={styles.event} key={event.id}><div className={styles.eventImage} style={{ backgroundImage: `url(${event.image})` }} /><div><h3>{event.name}</h3><p>{event.venue}, {event.city} · {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(event.startsAt))}</p></div><div className={styles.eventStats}><span>Sold<b>{event.totalTickets - event.availableTickets}/{event.totalTickets}</b></span><span>Revenue<b>{((event.totalTickets - event.availableTickets) * Number(event.ticketPrice)).toFixed(2)} MON</b></span></div><Link className={styles.primary} href={`/check-in/${event.id}`}>Check In →</Link></article>)}</section></div></AppShell>;
}
