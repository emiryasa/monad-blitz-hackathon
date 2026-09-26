"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EventSummary } from "@/lib/events/types";
import styles from "./page.module.css";
import catalogStyles from "./discover-catalog.module.css";

const categories = ["All", "Music", "Conference", "Sports", "Art", "Theater", "Festival", "Other"];

export function DiscoverCatalog({ initialEvents }: { initialEvents: EventSummary[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category.toLowerCase());
    if (query.trim()) params.set("q", query.trim());

    async function loadEvents() {
      try {
        const response = await fetch(`/api/events?${params}`, { signal: controller.signal });
        if (response.ok) setEvents((await response.json() as { data: EventSummary[] }).data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") throw error;
      }
    }

    void loadEvents();
    return () => controller.abort();
  }, [category, query]);

  return <><label className={catalogStyles.search}><svg aria-hidden="true" className={catalogStyles.searchIcon} viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg><input aria-label="Search events" placeholder="Search by name, symbol, or address..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><section className={`cornerAccents ${styles.categories}`}>{categories.map((item) => <button className={category === item ? styles.active : ""} type="button" onClick={() => setCategory(item)} key={item}>{item}</button>)}</section><section className={`cornerAccents ${styles.events}`}><div className={styles.grid}>{events.length ? events.map((event) => <Link href={`/discover/${event.id}`} className={styles.card} key={event.id}><div className={styles.image} style={{ backgroundImage: `url(${event.image})` }} /><div className={styles.status}><b>{event.status === "on_sale" ? "ON SALE" : "UPCOMING"}</b></div><div className={styles.details}><h2>{event.name}</h2><p>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(event.startsAt)).toUpperCase()}</p><p>Creator: event organizer</p></div><div className={`cornerAccents ${styles.ticketInfo}`}><span><small>Price</small><b>{event.ticketPrice} {event.currency}</b></span><span><small>Available</small><b>{event.availableTickets}/{event.totalTickets}</b></span></div></Link>) : <p className={catalogStyles.empty}>No events match your search.</p>}</div></section></>;
}
