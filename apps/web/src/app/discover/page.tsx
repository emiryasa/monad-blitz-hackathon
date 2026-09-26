import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { eventRepository } from "@/lib/events/repository";
import styles from "./page.module.css";

export default async function DiscoverPage() {
  const events = await eventRepository.list();

  return <AppShell><div className={styles.page}>
    <section className={`cornerAccents ${styles.intro}`}><p>● LIVE ON CHAIN</p><h1>Discover Events</h1><span>Browse upcoming events, buy tickets as NFTs, and join the future of transparent ticketing.</span><input aria-label="Search events" placeholder="Search events..." /></section>
    <section className={`cornerAccents ${styles.stats}`}><div><b>{events.length}</b><span>Live Events</span></div><div><b>{events.reduce((total, event) => total + event.totalTickets - event.availableTickets, 0)}</b><span>Tickets Sold</span></div><div><b>MON</b><span>Network</span></div></section>
    <section className={styles.catalog}><div className={styles.filters}>{["All", "Music", "Conference", "Sports", "Art", "Theater", "Festival", "Other"].map((label, index) => <button className={index === 0 ? styles.selected : ""} type="button" key={label}>{label}</button>)}</div><div className={styles.grid}>{events.map((event) => <Link href={`/discover/${event.id}`} className={`cornerAccents ${styles.card}`} key={event.id}><div className={styles.image} style={{ backgroundImage: `url(${event.image})` }} /><div className={styles.cardTop}><b>{event.status === "on_sale" ? "ON SALE" : "UPCOMING"}</b><time>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(event.startsAt)).toUpperCase()}</time></div><h2>{event.name}</h2><p>{event.city} · {event.venue}</p><div className={styles.cardBottom}><span><small>Price</small>{event.ticketPrice} {event.currency}</span><span><small>Available</small>{event.availableTickets}/{event.totalTickets}</span></div></Link>)}</div></section>
  </div></AppShell>;
}
