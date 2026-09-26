import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type EIP1193Provider,
} from "viem";
import { eventFactoryAbi, eventTicketAbi, ticketMarketplaceAbi } from "./contracts";
import { eventFactoryAddress, marketplaceAddress, monadTestnet, rpcUrl } from "./config";

export const publicClient = createPublicClient({ chain: monadTestnet, transport: http(rpcUrl) });

export function getInjectedProvider(): EIP1193Provider {
  if (typeof window === "undefined") throw new Error("Wallet access is only available in the browser.");
  const provider = (window as typeof window & { ethereum?: EIP1193Provider }).ethereum;
  if (!provider) throw new Error("Install MetaMask or Rabby to connect a wallet.");
  return provider;
}

export async function ensureMonadNetwork(provider = getInjectedProvider()) {
  const hexadecimalId = `0x${monadTestnet.id.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexadecimalId }] });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: hexadecimalId,
        chainName: monadTestnet.name,
        nativeCurrency: monadTestnet.nativeCurrency,
        rpcUrls: [rpcUrl],
        blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
      }],
    });
  }
}

function walletClient(address: Address) {
  return createWalletClient({ account: address, chain: monadTestnet, transport: custom(getInjectedProvider()) });
}

export async function buyPrimaryTicket(ticketAddress: Address, price: bigint, buyer: Address) {
  await ensureMonadNetwork();
  const hash = await walletClient(buyer).writeContract({
    address: ticketAddress,
    abi: eventTicketAbi,
    functionName: "buyTicket",
    value: price,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export interface CreateEventContractInput {
  name: string;
  symbol: string;
  metadataUri: string;
  eventStartsAt: bigint;
  maxSupply: bigint;
  primaryPrice: bigint;
  creatorFeeBps: number;
  maxResalePrice: bigint;
}

export async function createEventContract(input: CreateEventContractInput, organizer: Address) {
  if (!eventFactoryAddress) throw new Error("EventFactory address is not configured.");
  await ensureMonadNetwork();
  const hash = await walletClient(organizer).writeContract({
    address: eventFactoryAddress,
    abi: eventFactoryAbi,
    functionName: "createEvent",
    args: [{
      name: input.name,
      symbol: input.symbol,
      eventMetadataURI: input.metadataUri,
      salesStartAt: BigInt(Math.floor(Date.now() / 1000)),
      eventStartsAt: input.eventStartsAt,
      maxSupply: input.maxSupply,
      primaryPrice: input.primaryPrice,
      creatorFeeBps: input.creatorFeeBps,
      maxResalePrice: input.maxResalePrice,
    }],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

function requireMarketplaceAddress() {
  if (!marketplaceAddress) throw new Error("TicketMarketplace address is not configured.");
  return marketplaceAddress;
}

export async function listTicketForSale(
  collection: Address,
  tokenId: bigint,
  price: bigint,
  expiresAt: bigint,
  seller: Address,
) {
  const marketplace = requireMarketplaceAddress();
  await ensureMonadNetwork();
  const wallet = walletClient(seller);
  const approvalHash = await wallet.writeContract({ address: collection, abi: eventTicketAbi, functionName: "approve", args: [marketplace, tokenId] });
  await publicClient.waitForTransactionReceipt({ hash: approvalHash });
  const listingHash = await wallet.writeContract({ address: marketplace, abi: ticketMarketplaceAbi, functionName: "listTicket", args: [collection, tokenId, price, expiresAt] });
  await publicClient.waitForTransactionReceipt({ hash: listingHash });
  return listingHash;
}

export async function cancelMarketplaceListing(collection: Address, tokenId: bigint, seller: Address) {
  const marketplace = requireMarketplaceAddress();
  await ensureMonadNetwork();
  const hash = await walletClient(seller).writeContract({ address: marketplace, abi: ticketMarketplaceAbi, functionName: "cancelListing", args: [collection, tokenId] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function buyMarketplaceTicket(collection: Address, tokenId: bigint, price: bigint, buyer: Address) {
  const marketplace = requireMarketplaceAddress();
  await ensureMonadNetwork();
  const hash = await walletClient(buyer).writeContract({ address: marketplace, abi: ticketMarketplaceAbi, functionName: "buyListing", args: [collection, tokenId], value: price });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
