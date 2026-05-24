<div align="center">
  <img src="public/logo.png" alt="cardjoybday" width="120" />

# cardjoybday

**Birthday wishes, forever on-chain.**

[![Live](https://img.shields.io/badge/cardjoybday.com-live-FF4D8D)](https://cardjoybday.com)
[![Sui Overflow 2026](https://img.shields.io/badge/Sui_Overflow_2026-Entertainment_%26_Culture-9B6FFF)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-FF6B5C)](#license)

</div>

---

## What it is

A collaborative birthday-card builder where friends sign their wishes onto the **Sui blockchain** and AI-generated collages are stored permanently on **Walrus**. One person spins up a shared plan, sends a single invite link, and everyone who joins pins a wish to the same on-chain card.

Built for the **Sui Overflow 2026 Hackathon · Entertainment & Culture track**.

## The flow

```
1. Creator   →  signs create_plan         →  gets /plan/<id> invite link
2. Friend    →  opens the link
3. Friend    →  writes a wish
4. Friend    →  signs 0.01 SUI payment    →  unlocks AI generation
5. Server    →  verifies the payment on-chain  →  calls FLUX via Pollinations
6. Friend    →  reviews the collage       →  signs add_idea on Sui
7. Image     →  pinned on Walrus, referenced from the shared object
8. Everyone  →  sees wishes appear live (auto-polled every 12s)
```

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Framer Motion |
| Web3 | `@mysten/sui` 2.x · `@mysten/dapp-kit` 1.x |
| Storage | Walrus testnet (HTTP API) |
| Image gen | Pollinations.ai (FLUX.1-schnell, free, no API key) |
| Smart contract | Move 2024.beta (`surprise_planner`) |
| Hosting | Google Cloud Run · `us-central1` |

## On-chain references

| | |
|---|---|
| Network | Sui Testnet (`chain_id 4c78adac`) |
| Package | [`0x540a…2dfb`](https://suiscan.xyz/testnet/object/0x540aff44e9079f4d94c57cc71e4b133085e2f86f0a5464f36ce11be47baf2dfb) |
| Move source | [`move/surprise_planner/sources/surprise_planner.move`](./move/surprise_planner/sources/surprise_planner.move) |

> Sui testnet is occasionally reset. If the package ID above stops resolving, see [Smart-contract redeploy](#smart-contract-redeploy) below.

## Local development

```bash
git clone https://github.com/samuelcampozano/cardjoybday.git
cd cardjoybday
npm install
cp .env.example .env.local
npm run dev
```

No API keys are required — Pollinations, Walrus, and Sui all work without credentials.

## Configuration

Every chain address, network, fee, and URL flows from a single validated module: [`src/lib/config.ts`](./src/lib/config.ts). It reads the env vars below at module load, validates their shape, and exports a frozen typed config used by both client and server code.

| Variable | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://cardjoybday.com` | Canonical site URL |
| `NEXT_PUBLIC_SUI_NETWORK` | `testnet` | `testnet` / `mainnet` / `devnet` |
| `NEXT_PUBLIC_SUI_RPC_URL` | `https://fullnode.testnet.sui.io:443` | RPC endpoint (falls back to SDK default) |
| `NEXT_PUBLIC_CARDJOY_PACKAGE_ID` | `0x540a…2dfb` | Deployed Move package |
| `NEXT_PUBLIC_CARDJOY_TREASURY` | `0xf64a…f413` | Receives the generation fee |
| `NEXT_PUBLIC_CARDJOY_FEE_MIST` | `10000000` | Fee in MIST (10M = 0.01 SUI) |
| `NEXT_PUBLIC_WALRUS_PUBLISHER_URL` | `https://publisher.walrus-testnet.walrus.space` | Walrus PUT endpoint |
| `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL` | `https://aggregator.walrus-testnet.walrus.space` | Walrus GET endpoint |

Missing or malformed values fail loud at startup with an actionable error.

## Deployment

Production runs on Cloud Run, built and deployed end-to-end by [`cloudbuild.yaml`](./cloudbuild.yaml). The pipeline:

1. Builds the Docker image, injecting `NEXT_PUBLIC_*` values as `--build-arg`s so Next.js can inline them into the client bundle.
2. Pushes to `gcr.io/cardjoybday/cardjoybday`.
3. Deploys to Cloud Run with the same values as runtime env vars.

```bash
gcloud builds submit --config=cloudbuild.yaml --project=cardjoybday
```

Override any value per-build without touching files:

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_PACKAGE_ID=0xNEW_ID,_SUI_NETWORK=mainnet
```

## Smart-contract redeploy

When testnet resets (or when you publish a new version of the Move package):

```bash
cd move/surprise_planner
sui client publish --gas-budget 100000000
```

Copy the new package ID, then redeploy with one command — no source edits:

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_PACKAGE_ID=0xNEW_ID
```

For local development, also update `NEXT_PUBLIC_CARDJOY_PACKAGE_ID` in `.env.local`.

## Project structure

```
src/
  app/
    api/generate-collage/   # POST: verifies Sui payment, calls Pollinations
    plan/[planId]/          # Dynamic plan page
    layout.tsx, page.tsx, providers.tsx, globals.css
  components/
    Navbar, Hero, HowItWorks, TechShowcase, Footer
    CreatePlanModal, JoinPlanModal, PlanView
  lib/
    config.ts               # Validated env → typed frozen config
    walrus.ts               # Walrus upload / blob URL helper
move/
  surprise_planner/         # Sui Move package (sources, Move.toml, Move.lock)
Dockerfile                  # Multi-stage Next.js standalone build
cloudbuild.yaml             # Build → push → deploy pipeline
```

## Security notes

- **Payment-gated generation**: the API route verifies every generation request against an on-chain Sui transaction digest before calling Pollinations. Digests are single-use (in-memory replay protection — fine for a single Cloud Run instance; swap for Redis/Firestore at scale).
- **No secrets in the repo**: there are no API keys. The wallet keystore lives at `~/.sui/sui_config/sui.keystore` (or `C:\SuiCLI\sui.keystore`) and never touches the codebase.
- **All public values via env**: chain addresses and fees are configuration, not code — rotating the deployed package, the treasury wallet, or the fee is a substitution change, not a diff.

## License

MIT © Samuel Campozano López

## Builder

**Samuel Campozano López** — Software architect focused on AI + blockchain. Built cardjoybday to bridge Web3 infrastructure with consumer-friendly social experiences.

- [LinkedIn](https://www.linkedin.com/in/samuel-campozano-lopez/)
- [GitHub](https://github.com/samuelcampozano)
