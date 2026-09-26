"use client";

import { useState } from "react";
import styles from "@/app/portal.module.css";
import { useWallet } from "./wallet-provider";

export function WalletGate({ resource }: { resource: "NFT tickets" | "created events" }) {
  const { connect, connecting } = useWallet();
  const [error, setError] = useState("");
  async function handleConnect() { try { setError(""); await connect(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to connect wallet."); } }
  return <section className={`cornerAccents ${styles.panel}`}><div className={styles.notice}><p className={styles.eyebrow}>[CONNECT_WALLET]</p><h2 style={{ margin: "12px 0", color: "var(--foreground)", fontSize: "1.25rem" }}>Wallet Required</h2><p>Connect MetaMask or Rabby to view your {resource}.</p><button className={styles.primary} disabled={connecting} onClick={() => void handleConnect()} style={{ marginTop: 18 }} type="button">{connecting ? "Connecting..." : "Connect Wallet"}</button>{error && <p className={styles.failure} style={{ marginTop: 12 }}>{error}</p>}</div></section>;
}
