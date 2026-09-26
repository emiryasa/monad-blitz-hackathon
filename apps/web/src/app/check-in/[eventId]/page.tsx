"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { CheckInRecord } from "@/lib/portal/types";
import styles from "../../portal.module.css";

export default function CheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [ticketId, setTicketId] = useState("");
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  useEffect(() => { void fetch(`/api/check-in/${eventId}`).then((response) => response.json()).then(({ data }) => setRecords(data)); }, [eventId]);
  async function checkIn() {
    const response = await fetch(`/api/check-in/${eventId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId }) });
    const { data, error } = await response.json() as { data?: { ok: boolean; message?: string; record?: CheckInRecord }; error?: string };
    setResult({ ok: Boolean(data?.ok), message: data?.message ?? error ?? "Check-in failed." });
    if (data?.ok && data.record) { setRecords((items) => [data.record!, ...items]); setTicketId(""); }
  }
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><Link className={styles.eyebrow} href="/my-events">← MY EVENTS</Link><h1>Check-In Scanner</h1><p>Verify ticket IDs at the door. Camera scanning will connect when the ticket QR format is finalized.</p></div><div className={styles.stats}><div><b>{records.length}</b><span>Checked In</span></div><div><b>MON</b><span>Network</span></div></div></section><section className={`cornerAccents ${styles.panel}`}><div className={styles.sectionHead}><h2>[MANUAL_CHECK_IN]</h2><span>EVENT: {eventId}</span></div><div className={styles.form}><input aria-label="Ticket ID" value={ticketId} placeholder="Ticket ID, e.g. 0001" onChange={(event) => setTicketId(event.target.value)} /><button className={styles.primary} onClick={() => void checkIn()} type="button">Verify Ticket</button></div>{result && <p className={result.ok ? `${styles.result} ${styles.success}` : `${styles.result} ${styles.failure}`}>{result.message}</p>}<div className={styles.sectionHead}><h2>[CHECK_IN_HISTORY]</h2><span>{records.length} RECORDS</span></div><div className={styles.history}>{records.length ? records.map((record) => <div key={record.ticketId}><b>{record.ticketId}</b><span>{new Date(record.checkedInAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span></div>) : <p className={styles.notice}>No tickets have been checked in yet.</p>}</div></section></div></AppShell>;
}
