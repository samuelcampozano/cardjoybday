<div align="center">
  <img src="/public/logo.png" alt="cardjoybday logo" width="150" />

  # cardjoybday
  **Joyful Birthday Wishes, Built Together.**

  [![Website](https://img.shields.io/badge/Website-Live-brightgreen)](https://cardjoybday.com)
  [![Hackathon](https://img.shields.io/badge/Sui_Overflow_2026-Entertainment_%26_Culture-blue)](#)
</div>

---

## Overview

**cardjoybday** is an interactive, collaborative digital birthday card and surprise planner built for the **Sui Overflow 2026 Hackathon — Entertainment & Culture Track**.

Friends can co-create a birthday card together: uploading memories, decorating with animations, and building a surprise plan — all on-chain. Media is stored permanently on Walrus so memories are never lost. Every contribution is tracked on the Sui Network's Object Model, enabling true real-time co-creation.

---

## Features

- **Upload Memories** — Drag and drop photos, videos, and voice notes stored permanently on Walrus.
- **Decorate & Animate** — Hand-drawn themes, interactive candles, and background tunes.
- **Collaborate On-Chain** — The Surprise Planner lets friends suggest gifts and memories, tracked as on-chain events.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, Framer Motion |
| Hosting | Google Cloud Run |
| Decentralized Storage | Walrus HTTP API / TypeScript SDK |
| Smart Contracts | Sui Move |
| Web3 Integration | Mysten Labs TypeScript SDK |

---

## Local Development

**Prerequisites:** Node.js 18+, Sui CLI

```bash
git clone https://github.com/samuelcampozano/cardjoybday.git
cd cardjoybday
npm install
cp .env.example .env.local
npm run dev
```

**Environment variables** (`.env.local`):

```bash
NEXT_PUBLIC_APP_URL=https://cardjoybday.com
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.site
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.site
NEXT_PUBLIC_CARDJOY_PACKAGE_ID=0x...
```

---

## Deployment

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/cardjoybday/cardjoybday

# Deploy to Cloud Run
gcloud run deploy cardjoybday \
  --image gcr.io/cardjoybday/cardjoybday:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --project cardjoybday
```

---

## Builder

**Samuel Campozano López** — Lead Software Engineer & Web3 Architect

Software architect focused on AI and blockchain technologies. Previously architected decentralized platforms on the Sui blockchain using Move. Built cardjoybday to bridge Web3 infrastructure with consumer-friendly social experiences.

- [LinkedIn](https://www.linkedin.com/in/samuel-campozano-lopez/)
- [GitHub](https://github.com/samuelcampozano)
