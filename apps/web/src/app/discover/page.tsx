import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { eventRepository } from "@/lib/events/repository";
import styles from "./page.module.css";

const categories = ["All", "Music", "Conference", "Sports", "Art", "Theater", "Festival", "Other"];

export default async function DiscoverPage() {
  const events = await eventRepository.list();
  const sold = events.reduce((total, event) => total + event.totalTickets - event.availableTickets, 0);
  return <AppShell><div className={styles.page}>
    <section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.live}>● LIVE ON CHAIN</p><h1>Discover Events</h1><p className={styles.description}>Browse upcoming events, buy tickets as NFTs, and join the future of transparent ticketing.</p><label className={styles.search}><span>⌕</span><input aria-label="Search events" placeholder="Search by name, symbol, or address..." /></label></div><div className={styles.stats}><div><b>{events.length}</b><span>Live Events</span></div><div><b>{sold}</b><span>Tickets Sold</span></div><div><b>MON</b><span>Network</span></div></div></section>
    <section className={`cornerAccents ${styles.categories}`}>{categories.map((category, index) => <button className={index === 0 ? styles.active : ""} type="button" key={category}>{category}</button>)}</section>
    <section className={`cornerAccents ${styles.events}`}><div className={styles.grid}>{events.map((event) => <Link href={`/discover/${event.id}`} className={styles.card} key={event.id}><div className={styles.image} style={{ backgroundImage: `url(${event.image})` }} /><div className={styles.status}><b>{event.status === "on_sale" ? "ON SALE" : "UPCOMING"}</b></div><div className={styles.details}><h2>{event.name}</h2><p>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(event.startsAt)).toUpperCase()}</p><p>Creator: event organizer</p></div><div className={`cornerAccents ${styles.ticketInfo}`}><span><small>Price</small><b>{event.ticketPrice} {event.currency}</b></span><span><small>Available</small><b>{event.availableTickets}/{event.totalTickets}</b></span></div></Link>)}</div></section>
    <footer className={`cornerAccents ${styles.footer}`}><div><b>Sticket</b><p>The first truly transparent ticketing platform powered by Monad. Own your tickets, trade them freely.</p></div><div><b>Platform</b><span>Explore Events</span><span>Create Event</span><span>My Tickets</span></div><div><b>Resources</b><span>Documentation</span><span>Smart Contract</span><span>Support</span></div></footer>
  </div></AppShell>;
}
