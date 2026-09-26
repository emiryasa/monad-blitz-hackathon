import { defineChain, type Address } from "viem";

export const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "10143");
export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz";
export const eventFactoryAddress = process.env.NEXT_PUBLIC_EVENT_FACTORY_ADDRESS as Address | undefined;
export const marketplaceAddress = process.env.NEXT_PUBLIC_TICKET_MARKETPLACE_ADDRESS as Address | undefined;

export const monadTestnet = defineChain({
  id: chainId,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});

export function hasChainConfiguration() {
  return Boolean(eventFactoryAddress && marketplaceAddress && rpcUrl);
}
