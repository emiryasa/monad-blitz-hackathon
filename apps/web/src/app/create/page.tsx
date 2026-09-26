"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseEther, type Address } from "viem";
import { AppShell } from "@/components/app-shell";
import { useWallet } from "@/components/wallet-provider";
import { createEventContract } from "@/lib/chain/client";
import styles from "../portal.module.css";

const initial = {
  name: "", symbol: "STKT", description: "", startsAt: "", venue: "", category: "Music",
  supply: "100", price: "0.05", maxResalePrice: "0.10", royaltyPercent: "5", image: "/lock.png",
};

export default function CreateEventPage() {
  const router = useRouter();
  const { address, connect } = useWallet();
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (key: keyof typeof initial, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage("");
    try {
      if (!address) {
        await connect();
        setMessage("Wallet connected. Review the details and submit once more to deploy the event.");
        return;
      }
      const eventStartsAt = Math.floor(new Date(form.startsAt).getTime() / 1000);
      if (!Number.isFinite(eventStartsAt) || eventStartsAt <= Math.floor(Date.now() / 1000) + 60) throw new Error("Event start time must be at least one minute in the future.");

      setMessage("Pinning event metadata to IPFS…");
      const metadataResponse = await fetch("/api/ipfs/metadata", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, image: form.image, attributes: [
          { trait_type: "Category", value: form.category.toLowerCase() }, { trait_type: "Venue", value: form.venue }, { trait_type: "Event Date", value: form.startsAt },
        ] }),
      });
      const metadata = await metadataResponse.json() as { data?: { uri: string }; error?: string };
      if (!metadataResponse.ok || !metadata.data) throw new Error(metadata.error || "Unable to pin event metadata.");

      setMessage("Confirm the EventFactory transaction in your wallet…");
      const hash = await createEventContract({
        name: form.name, symbol: form.symbol, metadataUri: metadata.data.uri,
        eventStartsAt: BigInt(eventStartsAt), maxSupply: BigInt(form.supply), primaryPrice: parseEther(form.price),
        creatorFeeBps: Math.round(Number(form.royaltyPercent) * 100), maxResalePrice: parseEther(form.maxResalePrice),
      }, address as Address);
      setMessage(`Event deployed successfully: ${hash.slice(0, 10)}…${hash.slice(-8)}`);
      setForm(initial); router.push("/discover"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to deploy the event."); }
    finally { setSubmitting(false); }
  }

  async function uploadImage(file: File) {
    setUploading(true); setMessage("");
    try {
      const payload = new FormData(); payload.set("file", file);
      const response = await fetch("/api/ipfs/upload", { method: "POST", body: payload });
      const body = await response.json() as { data?: { uri: string }; error?: string };
      if (!response.ok || !body.data) throw new Error(body.error || "Unable to upload image.");
      set("image", body.data.uri); setMessage("Image pinned to IPFS.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to upload image."); }
    finally { setUploading(false); }
  }

  return <AppShell><div className={styles.page}>
    <section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.eyebrow}>[EVENT_CREATOR]</p><h1>Create Event</h1><p>Deploy a real ERC-721 ticket collection through the Monad EventFactory.</p></div><div className={styles.stats}><div><b>0%</b><span>Platform Fee</span></div><div><b>MON</b><span>Payment Token</span></div></div></section>
    <form className={`cornerAccents ${styles.panel}`} onSubmit={submit}>
      <div className={styles.sectionHead}><h2>[EVENT_DETAILS]</h2><span>REQUIRED FIELDS *</span></div>
      <div className={styles.formGrid}>
        <label>Event name<input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Enter event name" /></label>
        <label>Ticket symbol<input required minLength={2} maxLength={8} value={form.symbol} onChange={(e) => set("symbol", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="STKT" /></label>
        <label>Category<select value={form.category} onChange={(e) => set("category", e.target.value)}><option>Music</option><option>Conference</option><option>Sports</option><option>Art</option><option>Theater</option><option>Festival</option></select></label>
        <label>Start date and time<input required type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></label>
        <label className={styles.full}>Description<textarea required minLength={20} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your event" /></label>
        <label className={styles.full}>Event image<input accept="image/*" onChange={(event) => event.target.files?.[0] && void uploadImage(event.target.files[0])} type="file" />{uploading ? "Pinning image…" : form.image.startsWith("ipfs://") ? "Pinned to IPFS" : "PNG, JPG, WebP up to 5 MB"}</label>
        <label>Venue<input required value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Venue, city" /></label>
        <label>Ticket supply<input required type="number" min="1" value={form.supply} onChange={(e) => set("supply", e.target.value)} /></label>
        <label>Ticket price (MON)<input required type="number" step="0.001" min="0.001" value={form.price} onChange={(e) => set("price", e.target.value)} /></label>
        <label>Maximum resale price (MON)<input required type="number" step="0.001" min={form.price || "0.001"} value={form.maxResalePrice} onChange={(e) => set("maxResalePrice", e.target.value)} /></label>
        <label>Creator royalty (%)<input required type="number" step="0.1" min="0" max="10" value={form.royaltyPercent} onChange={(e) => set("royaltyPercent", e.target.value)} /></label>
      </div>
      <div className={styles.form}><button className={styles.primary} disabled={submitting || uploading} type="submit">{submitting ? "Waiting for Wallet…" : address ? "Deploy Event on Monad" : "Connect Wallet to Deploy"}</button></div>
      {message && <p className={styles.result} role="status">{message}</p>}
    </form>
  </div></AppShell>;
}
