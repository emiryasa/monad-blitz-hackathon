"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { CheckInRecord } from "@/lib/portal/types";
import styles from "../../portal.module.css";

export default function CheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [ticketId, setTicketId] = useState("");
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  useEffect(() => { void fetch(`/api/check-in/${eventId}`).then((response) => response.json()).then(({ data }) => setRecords(data)); }, [eventId]);
  async function checkIn() {
    const response = await fetch(`/api/check-in/${eventId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId }) });
    const { data, error } = await response.json() as { data?: { ok: boolean; message?: string; record?: CheckInRecord }; error?: string };
    setResult({ ok: Boolean(data?.ok), message: data?.message ?? error ?? "Check-in failed." });
    if (data?.ok && data.record) { setRecords((items) => [data.record!, ...items]); setTicketId(""); }
  }
  async function startCamera() {
    try { setCameraError(""); stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); if (video.current) { video.current.srcObject = stream.current; await video.current.play(); } setScanning(true); } catch { setCameraError("Camera access was not available. Use the manual ticket ID field instead."); }
  }
  function stopCamera() { stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; if (video.current) video.current.srcObject = null; setScanning(false); }
  useEffect(() => () => stopCamera(), []);
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><Link className={styles.eyebrow} href="/my-events">← MY EVENTS</Link><h1>Check-In Scanner</h1><p>Verify ticket IDs at the door using a camera preview or manual validation.</p></div><div className={styles.stats}><div><b>{records.length}</b><span>Checked In</span></div><div><b>MON</b><span>Network</span></div></div></section><section className={`cornerAccents ${styles.panel}`}><div className={styles.sectionHead}><h2>[QR_SCANNER]</h2><button className={styles.outline} onClick={scanning ? stopCamera : () => void startCamera()} type="button">{scanning ? "Stop Camera" : "Start Camera"}</button></div><div className={styles.notice}>{scanning ? <video autoPlay muted playsInline ref={video} style={{ width: "min(100%, 320px)", border: "1px solid var(--border)" }} /> : "Camera preview will appear here when enabled."}{cameraError && <p className={styles.failure}>{cameraError}</p>}</div><div className={styles.sectionHead}><h2>[MANUAL_CHECK_IN]</h2><span>EVENT: {eventId}</span></div><div className={styles.form}><input aria-label="Ticket ID" value={ticketId} placeholder="Ticket ID, e.g. 0001" onChange={(event) => setTicketId(event.target.value)} /><button className={styles.primary} onClick={() => void checkIn()} type="button">Verify Ticket</button></div>{result && <p className={result.ok ? `${styles.result} ${styles.success}` : `${styles.result} ${styles.failure}`}>{result.message}</p>}<div className={styles.sectionHead}><h2>[CHECK_IN_HISTORY]</h2><span>{records.length} RECORDS</span></div><div className={styles.history}>{records.length ? records.map((record) => <div key={record.ticketId}><b>{record.ticketId}</b><span>{new Date(record.checkedInAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span></div>) : <p className={styles.notice}>No tickets have been checked in yet.</p>}</div></section></div></AppShell>;
}
