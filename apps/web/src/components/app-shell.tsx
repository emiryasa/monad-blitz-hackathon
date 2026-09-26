import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./app-shell.module.css";

type IconName = "calendar" | "ticket" | "store" | "plus" | "search" | "wallet";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "calendar") return <svg {...common}><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M8 2v4M16 2v4M3 9h18M8 14h3M8 17h6" /></svg>;
  if (name === "ticket") return <svg {...common}><path d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A2.5 2.5 0 0 0 20 7.5V10a2 2 0 0 0 0 4v2.5a2.5 2.5 0 0 0-2.5 2.5h-11A2.5 2.5 0 0 0 4 16.5V14a2 2 0 0 0 0-4.5Z" /><path d="M13 7v2M13 15v2M13 11v2" /></svg>;
  if (name === "store") return <svg {...common}><path d="M3 10h18M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9M4 10l1.4-6h13.2L20 10" /><path d="M8 21v-6h8v6M3 10a3 3 0 0 0 5.5 1.7A3 3 0 0 0 14 11.7 3 3 0 0 0 19.5 10" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></svg>;
  return <svg {...common}><path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" /><path d="M4 9h16M8 14h3" /></svg>;
}

const links = [{ href: "/events", label: "Etkinlikler", icon: "calendar" as const }, { href: "/tickets", label: "Biletlerim", icon: "ticket" as const }, { href: "/marketplace", label: "Pazar", icon: "store" as const }];

export function AppShell({ children }: { children: ReactNode }) {
  return <div className={styles.shell}><header className={styles.header}><nav className={styles.nav} aria-label="Ana menü"><Link className={styles.brand} href="/" aria-label="Monad Blitz ana sayfa"><span className={styles.mark}>M</span><span>MONAD<span>BLITZ</span></span></Link><div className={styles.links}>{links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}</div><div className={styles.actions}><Link className={styles.createLink} href="/create"><Icon name="plus" size={16} /> Etkinlik oluştur</Link><button className={styles.walletButton} type="button"><Icon name="wallet" size={17} /> Cüzdan bağla</button></div></nav></header><main className={styles.main}>{children}</main><nav className={styles.mobileNav} aria-label="Mobil menü">{links.map((link) => <Link href={link.href} key={link.href}><Icon name={link.icon} /><span>{link.label}</span></Link>)}<Link href="/create"><Icon name="plus" /><span>Oluştur</span></Link></nav></div>;
}

export { Icon };
