"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { WalletGate } from "@/components/wallet-gate";
import { useWallet } from "@/components/wallet-provider";
import type { PortalTicket } from "@/lib/portal/types";
import { cancelMarketplaceListing, listTicketForSale } from "@/lib/chain/client";
import { parseEther, type Address } from "viem";
import styles from "./page.module.css";

export default function TicketsPage() {
  const { address } = useWallet();
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  async function loadTickets(owner: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickets?owner=${encodeURIComponent(owner)}`);
      const body = await response.json() as { data?: PortalTicket[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load tickets from Monad.");
      setTickets(body.data || []);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load tickets from Monad."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (!address) return;
    let current = true;
    fetch(`/api/tickets?owner=${encodeURIComponent(address)}`)
      .then(async (response) => ({ response, body: await response.json() as { data?: PortalTicket[]; error?: string } }))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error || "Unable to load tickets from Monad.");
        if (current) setTickets(body.data || []);
      })
      .catch((error: unknown) => { if (current) setNotice(error instanceof Error ? error.message : "Unable to load tickets from Monad."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [address]);
  const active = tickets.filter((ticket) => ticket.status !== "USED");
  const value = tickets.reduce((total, ticket) => total + Number(ticket.price), 0).toFixed(2);
  async function toggleListing(ticket: PortalTicket) {
    if (!address || !ticket.contractAddress || !ticket.tokenIdValue) return;
    setLoading(true); setNotice("");
    try {
      if (ticket.status === "LISTED") {
        await cancelMarketplaceListing(ticket.contractAddress, BigInt(ticket.tokenIdValue), address as Address);
        setNotice("Listing cancelled on Monad.");
      } else {
        const price = window.prompt("Listing price in MON", ticket.price);
        if (!price) return;
        const eventStart = Math.floor(new Date(ticket.startsAt).getTime() / 1000);
        const expiresAt = eventStart - 60;
        await listTicketForSale(ticket.contractAddress, BigInt(ticket.tokenIdValue), parseEther(price), BigInt(expiresAt), address as Address);
        setNotice(`Ticket listed for ${price} MON on Monad.`);
      }
      await loadTickets(address);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to update the listing."); }
    finally { setLoading(false); }
  }
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.header}`}><div className={styles.intro}>{address && <p className={styles.address}>{address.slice(0, 6)}...{address.slice(-4)}</p>}<h1>My Tickets</h1><p>&gt; ON_CHAIN_ERC721 // MONAD_TESTNET</p></div><div className={styles.stats}><div><span>[TOTAL_TICKETS]</span><b>{address ? tickets.length : "—"}</b></div><div><span>[ACTIVE]</span><b>{address ? active.length : "—"}</b></div><div><span>[TOTAL_VALUE]</span><b>{address ? `${value} MON` : "—"}</b></div></div></section>{!address ? <WalletGate resource="NFT tickets" /> : <section className={`cornerAccents ${styles.panel}`}><div className={styles.panelHead}><h2>[ON_CHAIN_TICKETS]</h2><span>{loading ? "SYNCING…" : `${tickets.length} tickets`}</span></div>{notice && <p className={styles.empty}>{notice}</p>}{tickets.length ? <div className={styles.grid}>{tickets.map((ticket) => <article className={styles.card} key={ticket.id}><div className={styles.image} style={{ backgroundImage: `url(${ticket.image})` }}><b className={styles.token}>{ticket.tokenId}</b></div><h3>{ticket.eventName}</h3><p>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(ticket.startsAt))} · {ticket.venue}</p><b className={styles.badge}>{ticket.status}</b>{ticket.listedPrice && <p>Listed for {ticket.listedPrice} MON</p>}<div className={styles.actions}><Link href={`/tickets/${encodeURIComponent(ticket.id)}`}>View</Link>{ticket.status !== "USED" && <button disabled={loading} onClick={() => void toggleListing(ticket)} type="button">{ticket.status === "LISTED" ? "Cancel Listing" : "Sell"}</button>}</div></article>)}</div> : <p className={styles.empty}>{loading ? "[SYNCING_BLOCKCHAIN] Reading EventTicket ownership…" : "[NO_ON_CHAIN_TICKETS] This wallet does not own any Sticket NFTs."}</p>}</section>}</div></AppShell>;
}
