"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { Reward } from "@/lib/portal/types";
import styles from "../portal.module.css";

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [won, setWon] = useState<Reward | null>(null);
  const [spinning, setSpinning] = useState(false);
  useEffect(() => { void fetch("/api/rewards").then(async (response) => response.ok ? response.json() : { data: [] }).then(({ data }) => setRewards(data)); }, []);
  async function spin() { setSpinning(true); try { const response = await fetch("/api/rewards/spin", { method: "POST" }); const { data } = await response.json() as { data: Reward }; setWon(data); } finally { setSpinning(false); } }
  const defaults: Reward[] = [{ label: "0.01 MON", description: "A small on-chain credit for your next event." }, { label: "BONUS", description: "Double points on your next ticket purchase." }, { label: "FREE TICKET", description: "A ticket credit up to 0.05 MON." }, { label: "STICKET NFT", description: "An exclusive collectible for your wallet." }];
  return <AppShell><div className={styles.page}><section className={`cornerAccents ${styles.hero}`}><div className={styles.heroCopy}><p className={styles.eyebrow}>[REWARDS_SYSTEM]</p><h1>Earn Rewards</h1><p>Spin for ticket credits, collectible rewards, and purchase bonuses.</p></div><div className={styles.stats}><div><b>1</b><span>Daily Spin</span></div><div><b>MON</b><span>Network</span></div></div></section><section className={`cornerAccents ${styles.panel}`}><div className={styles.wheel}>{spinning ? "SPINNING" : "STICKET"}</div><div className={styles.form}><button className={styles.primary} disabled={spinning} onClick={() => void spin()} type="button">{spinning ? "Spinning..." : "Spin the Wheel"}</button></div>{won && <p className={styles.result}><b>You won {won.label}</b>{won.description} Reward claiming will be signed through Monad once contracts are available.</p>}<div className={styles.sectionHead}><h2>[POSSIBLE_REWARDS]</h2><span>ON-CHAIN READY</span></div><div className={styles.rewardGrid}>{(rewards.length ? rewards : defaults).map((reward) => <div key={reward.label}><b>{reward.label}</b><p>{reward.description}</p></div>)}</div></section></div></AppShell>;
}
