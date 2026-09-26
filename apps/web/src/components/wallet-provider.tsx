"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type WalletState = { address: string | null; connecting: boolean; connect: () => Promise<void>; disconnect: () => void };
type EthereumProvider = { request: (args: { method: string }) => Promise<string[]> };

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
      const provider = (window as typeof window & { ethereum?: EthereumProvider }).ethereum;
      if (!provider) throw new Error("Install MetaMask or Rabby to connect a wallet.");
      const [account] = await provider.request({ method: "eth_requestAccounts" });
      if (!account) throw new Error("No wallet account was selected.");
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
