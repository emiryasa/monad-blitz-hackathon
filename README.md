# Monad Blitz

Monad Blitz is a Monad-native event ticketing application.

## Getting started

Install dependencies and start the web application:

```bash
bun install
bun run dev
```

The web app is available at [http://localhost:3000](http://localhost:3000).

## Workspace layout

```text
apps/web           Next.js frontend
packages/chain     Shared ABI, address and chain configuration
packages/contracts Solidity contracts and Foundry tests
deployments        Network deployment records
```

## Quality checks

```bash
bun run lint
bun run typecheck
bun run build
```
