"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ensureMonadNetwork, getInjectedProvider } from "@/lib/chain/client";

type WalletState = { address: string | null; connecting: boolean; connect: () => Promise<void>; disconnect: () => void };

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAddress(window.localStorage.getItem("sticket.wallet")));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const provider = getInjectedProvider();
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const account = accounts[0];
      if (!account) throw new Error("No wallet account was selected.");
      await ensureMonadNetwork(provider);
      window.localStorage.setItem("sticket.wallet", account);
      setAddress(account);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    window.localStorage.removeItem("sticket.wallet");
    setAddress(null);
  }, []);

  return <WalletContext.Provider value={{ address, connecting, connect, disconnect }}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider.");
  return value;
}
