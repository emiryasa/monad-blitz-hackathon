"use client";

import { useState } from "react";
import { useWallet } from "./wallet-provider";
import styles from "./app-shell.module.css";

export function WalletButton() {
  const { address, connect, connecting, disconnect } = useWallet();
  const [error, setError] = useState("");
  const label = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : connecting ? "Connecting..." : "Connect Wallet";

  async function handleClick() {
    if (address) return disconnect();
    try { setError(""); await connect(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to connect wallet."); }
  }

  return <span className={styles.walletWrap}><button type="button" className={styles.connect} onClick={handleClick}>{label}</button>{error && <span className={styles.walletError}>{error}</span>}</span>;
}
