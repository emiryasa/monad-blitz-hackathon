import Link from "next/link";
import { AppShell, Mark } from "../components/app-shell";
import styles from "./page.module.css";

const features = [["/lock.png", "Secure & Verifiable", "Every ticket exists on Monad — immutable, transparent, and linked to its rightful owner."], ["/hands.png", "Transfer or Trade Freely", "Users can transfer or resell tickets directly through their wallets — no hidden commissions."], ["/computer.png", "Event Manager Dashboard", "Organizers can create events, set prices, define rules, and track ticket sales in real-time."], ["/watchtower.png", "Seamless Wallet Integration", "Supports MetaMask, WalletConnect, and more — mint, buy, and check in with one click."]];

export default function Home() {
  return <AppShell home><div className={styles.page}>
    <section className={`cornerAccents ${styles.hero}`}><div className={styles.dither} /><div className={styles.heroNav}><span><Mark /> Sticket</span><Link href="/discover">Get Started</Link></div><h1>Own Your Tickets.<br />Trade Them Freely.</h1></section>
    <section className={styles.overview}><div className={styles.core}><div className={styles.mission}><p>● POWERED BY MONAD</p><h2>The first truly transparent<br />ticketing platform.</h2><span>Tickets as NFTs. No middlemen, no hidden fees, full ownership. Every transaction is verifiable on-chain.</span></div><div className={styles.stats}><div><b>12</b><span>Live Events</span></div><div><b>3.4K</b><span>Tickets Sold</span></div><div><b>MON</b><span>Network</span></div></div></div>{features.map(([image,title,description])=><article className={styles.feature} key={title}><div className={styles.featureImage} style={{backgroundImage:`url(${image})`}} /><div><h3><i />{title}</h3><p>{description}</p></div></article>)}</section>
    <section className={`cornerAccents ${styles.events}`}><header><div><h2>Explore Live Events</h2><p>Discover upcoming events on the blockchain</p></div><Link href="/discover">View All ↗</Link></header><div className={styles.empty}>Live events are loaded from the event API.</div></section>
    <section className={`cornerAccents ${styles.launch}`}><div><h2>Launch Your Event in Minutes</h2><p>Create tickets, set prices, define royalties. Watch sales happen live on-chain with zero hassle.</p><div className={styles.launchStats}><span><b>5 min</b>Setup Time</span><span><b>0%</b>Hidden Fees</span><span><b>100%</b>Your Control</span></div><Link href="/create">Create Your Event ↗</Link></div><aside><b>Activity</b><span>● LIVE</span><p>New activity will appear here.</p></aside></section>
  </div></AppShell>;
}
