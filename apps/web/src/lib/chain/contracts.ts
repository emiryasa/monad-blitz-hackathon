export const eventFactoryAbi = [
  {
    type: "function",
    name: "eventCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getEvent",
    stateMutability: "view",
    inputs: [{ name: "eventId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "ticket", type: "address" },
          { name: "organizer", type: "address" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "eventMetadataURI", type: "string" },
          { name: "salesStartAt", type: "uint64" },
          { name: "eventStartsAt", type: "uint64" },
          { name: "maxSupply", type: "uint256" },
          { name: "primaryPrice", type: "uint256" },
          { name: "creatorFeeBps", type: "uint16" },
          { name: "maxResalePrice", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "createEvent",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "config",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "eventMetadataURI", type: "string" },
          { name: "salesStartAt", type: "uint64" },
          { name: "eventStartsAt", type: "uint64" },
          { name: "maxSupply", type: "uint256" },
          { name: "primaryPrice", type: "uint256" },
          { name: "creatorFeeBps", type: "uint16" },
          { name: "maxResalePrice", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "ticketAddress", type: "address" }],
  },
] as const;

export const eventTicketAbi = [
  {
    type: "function",
    name: "totalMinted",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "isUsed",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "buyTicket",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "ticketsAvailable",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const ticketMarketplaceAbi = [
  {
    type: "event",
    name: "TicketListed",
    inputs: [
      { name: "collection", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "price", type: "uint256", indexed: false },
      { name: "expiresAt", type: "uint64", indexed: false },
    ],
  },
  {
    type: "function",
    name: "listings",
    stateMutability: "view",
    inputs: [{ name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
    ],
  },
  {
    type: "function",
    name: "isListingValid",
    stateMutability: "view",
    inputs: [{ name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "listTicket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "collection", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelListing",
    stateMutability: "nonpayable",
    inputs: [{ name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "buyListing",
    stateMutability: "payable",
    inputs: [{ name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }],
    outputs: [],
  },
] as const;
