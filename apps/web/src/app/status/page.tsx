"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import styles from "../portal.module.css";

type Status = { state: string; network: string; requiredArtifacts: string[]; supportedIntents: string[] };

export default function StatusPage() {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => { void fetch("/api/operations").then((response) => response.json()).then(({ data }) => setStatus(data)); }, []);
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.eyebrow}>[SYSTEM_STATUS]</p><h1>Operation Status</h1><p>Deployment readiness and transaction capabilities for Sticket on Monad.</p></div><div className={styles.stats}><div><b>{status?.network === "monad-testnet" ? "MON" : "…"}</b><span>{status?.network ?? "Loading network"}</span></div><div><b>{status?.state === "awaiting_contracts" ? "WAIT" : "READY"}</b><span>Integration State</span></div></div></section><section className={`cornerAccents ${styles.panel}`}><div className={styles.sectionHead}><h2>[CONTRACT_HANDOFF]</h2><span>{status?.state ?? "LOADING"}</span></div>{status ? <><div className={styles.rewardGrid}>{status.requiredArtifacts.map((artifact) => <div key={artifact}><b>REQUIRED</b><p>{artifact}</p></div>)}</div><div className={styles.sectionHead}><h2>[SUPPORTED_INTENTS]</h2><span>ABI PENDING</span></div><div className={styles.rewardGrid}>{status.supportedIntents.map((intent) => <div key={intent}><b>{intent}</b><p>UI and backend intent are ready for contract signing.</p></div>)}</div></> : <p className={styles.notice}>Loading integration status…</p>}</section></div></AppShell>;
}
