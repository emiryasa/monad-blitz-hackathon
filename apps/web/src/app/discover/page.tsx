import { AppShell } from "@/components/app-shell";
import { eventRepository } from "@/lib/events/repository";
import { DiscoverCatalog } from "./discover-catalog";
import styles from "./page.module.css";

export default async function DiscoverPage() {
  const events = await eventRepository.list();
  const sold = events.reduce((total, event) => total + event.totalTickets - event.availableTickets, 0);
  return <AppShell><div className={styles.page}>
    <section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.live}>● LIVE ON CHAIN</p><h1>Discover Events</h1><p className={styles.description}>Browse upcoming events, buy tickets as NFTs, and join the future of transparent ticketing.</p></div><div className={styles.stats}><div><b>{events.length}</b><span>Live Events</span></div><div><b>{sold}</b><span>Tickets Sold</span></div><div><b>MON</b><span>Network</span></div></div></section>
    <DiscoverCatalog initialEvents={events} />
    <footer className={`cornerAccents ${styles.footer}`}><div><b>Sticket</b><p>The first truly transparent ticketing platform powered by Monad. Own your tickets, trade them freely.</p></div><div><b>Platform</b><span>Explore Events</span><span>Create Event</span><span>My Tickets</span></div><div><b>Resources</b><span>Documentation</span><span>Smart Contract</span><span>Support</span></div></footer>
  </div></AppShell>;
}
