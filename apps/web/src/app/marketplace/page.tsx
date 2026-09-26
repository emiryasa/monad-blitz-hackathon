"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useWallet } from "@/components/wallet-provider";
import { buyMarketplaceTicket } from "@/lib/chain/client";
import type { PortalTicket } from "@/lib/portal/types";
import { parseEther, type Address } from "viem";
import styles from "../portal.module.css";

export default function MarketplacePage() {
  const { address, connect, connecting } = useWallet();
  const [listings, setListings] = useState<PortalTicket[]>([]); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true);
  async function loadListings() { setLoading(true); try { const response = await fetch("/api/marketplace"); const body = await response.json() as { data?: PortalTicket[]; error?: string }; if (!response.ok) throw new Error(body.error || "Unable to load marketplace listings."); setListings(body.data || []); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load marketplace listings."); } finally { setLoading(false); } }
  useEffect(() => {
    let current = true;
    fetch("/api/marketplace")
      .then(async (response) => ({ response, body: await response.json() as { data?: PortalTicket[]; error?: string } }))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error || "Unable to load marketplace listings.");
        if (current) setListings(body.data || []);
      })
      .catch((error: unknown) => { if (current) setMessage(error instanceof Error ? error.message : "Unable to load marketplace listings."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);
  async function buy(ticket: PortalTicket) {
    setMessage("");
    try {
      if (!address) { await connect(); setMessage("Wallet connected. Click Buy Ticket again to confirm the purchase."); return; }
      if (!ticket.contractAddress || !ticket.tokenIdValue || !ticket.listedPrice) throw new Error("Invalid on-chain listing data.");
      setLoading(true);
      const hash = await buyMarketplaceTicket(ticket.contractAddress, BigInt(ticket.tokenIdValue), parseEther(ticket.listedPrice), address as Address);
      setMessage(`Ticket purchased on Monad: ${hash.slice(0, 10)}…${hash.slice(-8)}`);
      await loadListings();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to purchase this listing."); }
    finally { setLoading(false); }
  }
  const floor = listings.length ? Math.min(...listings.map((item) => Number(item.listedPrice))) : 0;
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.eyebrow}>[SECONDARY_MARKET]</p><h1>Marketplace</h1><p>Buy active TicketMarketplace listings read directly from Monad.</p></div><div className={styles.stats}><div><b>{floor || "—"}</b><span>Floor Price · MON</span></div><div><b>{listings.length}</b><span>Live Listings</span></div></div></section><section className={`cornerAccents ${styles.panel}`}><div className={styles.sectionHead}><h2>[ON_CHAIN_LISTINGS]</h2><span>{loading ? "SYNCING MONAD…" : "VERIFIED BY CONTRACT"}</span></div>{message && <p className={styles.result}>{message}</p>}{listings.length ? listings.map((ticket) => <article className={styles.event} key={ticket.id}><div className={styles.eventImage} style={{ backgroundImage: `url(${ticket.image})` }} /><div><h3>{ticket.eventName} · {ticket.tokenId}</h3><p>{ticket.venue} · Original price {ticket.price} MON</p><p>Seller {ticket.seller ? `${ticket.seller.slice(0, 8)}…${ticket.seller.slice(-6)}` : "—"}</p></div><div className={styles.eventStats}><span>Listed price<b>{ticket.listedPrice} MON</b></span><span>Status<b>ON-CHAIN</b></span></div><button className={styles.primary} disabled={loading || connecting} onClick={() => void buy(ticket)} type="button">{!address ? "Connect to Buy" : "Buy Ticket →"}</button></article>) : <p className={styles.notice}>{loading ? "Reading TicketListed logs from Monad…" : "No active on-chain listings are available right now."}</p>}</section></div></AppShell>;
}
