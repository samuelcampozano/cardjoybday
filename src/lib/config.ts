import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

export type SuiNetwork = "testnet" | "mainnet" | "devnet";

function ensureEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `[config] Missing required env var ${name}. ` +
        `Copy .env.example to .env.local and set a value.`
    );
  }
  return value.trim();
}

function ensureSuiAddress(name: string, value: string | undefined): string {
  const v = ensureEnv(name, value);
  if (!/^0x[a-fA-F0-9]{1,64}$/.test(v)) {
    throw new Error(
      `[config] ${name} must be a 0x-prefixed Sui address (got "${v}").`
    );
  }
  return v.toLowerCase();
}

function ensurePositiveBigInt(name: string, value: string | undefined): bigint {
  const raw = ensureEnv(name, value);
  let n: bigint;
  try {
    n = BigInt(raw);
  } catch {
    throw new Error(`[config] ${name} must be an integer (got "${raw}").`);
  }
  if (n < 0n) {
    throw new Error(`[config] ${name} must be >= 0 (got "${raw}").`);
  }
  return n;
}

function ensureSuiNetwork(name: string, value: string | undefined): SuiNetwork {
  const v = ensureEnv(name, value);
  if (v !== "testnet" && v !== "mainnet" && v !== "devnet") {
    throw new Error(
      `[config] ${name} must be one of testnet|mainnet|devnet (got "${v}").`
    );
  }
  return v;
}

function ensureHttpUrl(name: string, value: string | undefined): string {
  const v = ensureEnv(name, value);
  try {
    const parsed = new URL(v);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("must use http(s)");
    }
  } catch (err) {
    throw new Error(
      `[config] ${name} must be a valid http(s) URL (got "${v}"): ${(err as Error).message}`
    );
  }
  return v.replace(/\/+$/, "");
}

const network = ensureSuiNetwork(
  "NEXT_PUBLIC_SUI_NETWORK",
  process.env.NEXT_PUBLIC_SUI_NETWORK
);

const packageId = ensureSuiAddress(
  "NEXT_PUBLIC_CARDJOY_PACKAGE_ID",
  process.env.NEXT_PUBLIC_CARDJOY_PACKAGE_ID
);

const rpcUrl =
  process.env.NEXT_PUBLIC_SUI_RPC_URL?.trim() || getJsonRpcFullnodeUrl(network);

export const config = Object.freeze({
  appUrl: ensureHttpUrl("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL),
  sui: Object.freeze({
    network,
    rpcUrl,
    packageId,
    treasuryAddress: ensureSuiAddress(
      "NEXT_PUBLIC_CARDJOY_TREASURY",
      process.env.NEXT_PUBLIC_CARDJOY_TREASURY
    ),
    feeMist: ensurePositiveBigInt(
      "NEXT_PUBLIC_CARDJOY_FEE_MIST",
      process.env.NEXT_PUBLIC_CARDJOY_FEE_MIST
    ),
    explorerUrl: `https://suiscan.xyz/${network}`,
    moveTargets: Object.freeze({
      createPlan: `${packageId}::surprise_planner::create_plan` as const,
      addIdea: `${packageId}::surprise_planner::add_idea` as const,
    }),
  }),
  walrus: Object.freeze({
    publisherUrl: ensureHttpUrl(
      "NEXT_PUBLIC_WALRUS_PUBLISHER_URL",
      process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL
    ),
    aggregatorUrl: ensureHttpUrl(
      "NEXT_PUBLIC_WALRUS_AGGREGATOR_URL",
      process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL
    ),
  }),
});

export type AppConfig = typeof config;
