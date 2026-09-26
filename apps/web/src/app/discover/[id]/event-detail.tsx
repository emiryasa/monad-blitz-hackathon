"use client";

import Link from "next/link";
import { useState } from "react";
import type { EventSummary } from "@/lib/events/types";
import styles from "./page.module.css";

function eventDate(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

function eventTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
}

export function EventDetail({ event }: { event: EventSummary }) {
  const [liked, setLiked] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const sold = event.totalTickets - event.availableTickets;
  const availability = `${Math.max(0, Math.min(100, event.availableTickets / event.totalTickets * 100))}%`;
  const status = event.availableTickets === 0 ? "SOLD OUT" : event.availableTickets < event.totalTickets * .2 ? "LOW STOCK" : event.status === "upcoming" ? "UPCOMING" : "ON SALE";

  async function beginCheckout() {
    setState("loading");
    try {
      const response = await fetch(`/api/events/${event.id}/checkout`, { method: "POST" });
      if (!response.ok) throw new Error("Unable to prepare checkout.");
      setState("ready");
    } catch {
      setState("error");
    }
  }

  return <div className={styles.page}>
    <Link href="/discover" className={styles.back}>← Back to Events</Link>
    <div className={styles.layout}>
      <section className={styles.content}>
        <div className={`cornerAccents ${styles.image}`} style={{ backgroundImage: `url(${event.image})` }}>
          <b className={styles.status}>{status}</b>
          <div className={styles.imageActions}><button aria-label="Save event" className={liked ? styles.liked : ""} onClick={() => setLiked((value) => !value)} type="button">♥</button><button aria-label="Share event" onClick={() => navigator.share?.({ title: event.name, url: window.location.href })} type="button">↗</button></div>
        </div>
        <h1>{event.name}</h1>
        <div className={`cornerAccents ${styles.quickInfo}`}><div><small>Date</small><b>{eventDate(event.startsAt)}</b></div><div><small>Time</small><b>{eventTime(event.startsAt)}</b></div><div><small>Location</small><b>{event.venue}, {event.city}</b></div></div>
        <section className={styles.section}><h2>About This Event</h2><p>{event.description}</p></section>
        <section className={styles.section}><h2>Organized By</h2><div className={styles.infoRow}><span>Event Creator</span><button onClick={() => navigator.clipboard?.writeText(`sticket:${event.id}`)} type="button">sticket:{event.id}</button></div></section>
        <section className={styles.section}><h2>Contract Details</h2><div className={styles.contract}><div><span>Event contract</span><b>Available after Monad deployment</b></div><div><span>Creator Fee</span><b>5%</b></div><div><span>Payment Token</span><b>MON</b></div></div></section>
      </section>
      <aside className={styles.aside}><div className={`cornerAccents ${styles.purchase}`}><div className={styles.price}><small>Ticket Price</small><b>{event.ticketPrice}<em>{event.currency}</em></b></div><div className={styles.availability}><div><span>Availability</span><b>{event.availableTickets} <i>/ {event.totalTickets}</i></b></div><div className={styles.progress}><i style={{ width: availability }} /></div><small>{sold} tickets sold</small></div><div className={styles.purchaseAction}><button disabled={!event.availableTickets} onClick={() => { setCheckoutOpen(true); setState("idle"); }} type="button">{event.availableTickets ? "⌑ Get Tickets" : "Sold Out"}</button></div></div><p className={styles.trust}>⌾ Verified Event <span>⌑ NFT Tickets</span></p></aside>
    </div>
    {checkoutOpen && <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Complete your purchase"><div className={`cornerAccents ${styles.modal}`}><button className={styles.close} aria-label="Close checkout" onClick={() => setCheckoutOpen(false)} type="button">×</button><p className={styles.modalEyebrow}>COMPLETE YOUR PURCHASE</p><h2>{event.name}</h2><div className={styles.summary}><span>Ticket price</span><b>{event.ticketPrice} {event.currency}</b><span>Network fee</span><b>Estimated at wallet</b></div>{state === "ready" ? <p className={styles.pending}>Checkout is ready. Connect your wallet once the Monad contract address and ABI are available.</p> : <button className={styles.checkout} disabled={state === "loading"} onClick={beginCheckout} type="button">{state === "loading" ? "Preparing..." : state === "error" ? "Try Again" : "Continue to Wallet"}</button>}</div></div>}
  </div>;
}
