import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./app-shell.module.css";
import { WalletButton } from "./wallet-button";

export function Mark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path opacity=".28" d="M6.7 2.8a1 1 0 0 0-2 0c-.2 1.2-.7 1.7-1.9 1.9a1 1 0 0 0 0 2c1.2.2 1.7.7 1.9 1.9a1 1 0 0 0 2 0c.2-1.2.7-1.7 1.9-1.9a1 1 0 0 0 0-2c-1.2-.2-1.7-.7-1.9-1.9ZM6 17.7a1 1 0 0 0-2 0v.3h-.4a1 1 0 0 0 0 2H4v.4a1 1 0 0 0 2 0V20h.4a1 1 0 0 0 0-2H6Z" fill="currentColor"/><path d="M13.9 2.9a1 1 0 0 0-2 0c-.6 4.7-2 6.4-7.3 7.2a1 1 0 0 0 0 2c5.3.8 6.7 2.5 7.3 7.2a1 1 0 0 0 2 0c.6-4.7 2-6.4 7.3-7.2a1 1 0 0 0 0-2c-5.3-.8-6.7-2.5-7.3-7.2Z" fill="currentColor"/></svg>;
}

export function AppShell({ children, home = false }: { children: ReactNode; home?: boolean }) {
  return <div className={styles.shell}>{!home && <header className={styles.header}><div className={styles.headerInner}><Link className={styles.brand} href="/"><span className={styles.mark}><Mark /></span>Sticket</Link><nav className={styles.navigation} aria-label="Main navigation"><Link href="/discover">Discover</Link><Link href="/tickets">My Tickets</Link><Link href="/my-events">My Events</Link><Link href="/rewards">Rewards</Link></nav><div className={styles.headerActions}><Link className={styles.create} href="/create">＋ Create Event</Link><WalletButton /></div></div></header>}<main>{children}</main></div>;
}
