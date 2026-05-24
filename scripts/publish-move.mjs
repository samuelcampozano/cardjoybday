// Publishes the Move package directly via the Sui SDK, bypassing the
// broken Windows sui CLI file-handle behavior. Reads the keystore from
// D:\SuiConfig\sui.keystore and submits a publish transaction signed
// with the active address.
//
// Usage: node scripts/publish-move.mjs

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

const PACKAGE_PATH = "move/surprise_planner";
const KEYSTORE = "D:\\SuiConfig\\sui.keystore";
const GAS_BUDGET = 500_000_000n;

// Sui CLI 1.60 on Windows has a file-handle bug that locks the
// client.yaml during reads, then fails to save and truncates it.
// Workaround: give the build a throwaway config dir we don't care about.
const tmpConfigDir = join(tmpdir(), `sui-publish-${Date.now()}`);
mkdirSync(tmpConfigDir, { recursive: true });
console.log("Loading keystore…");
const keystore = JSON.parse(readFileSync(KEYSTORE, "utf8"));
let keypair = null;
for (const encoded of keystore) {
  const bytes = fromBase64(encoded);
  if (bytes[0] === 0x00) {
    keypair = Ed25519Keypair.fromSecretKey(bytes.slice(1));
    break;
  }
}
if (!keypair) throw new Error(`No Ed25519 key found in ${KEYSTORE}`);
const ADDRESS = keypair.toSuiAddress();
console.log(`  signer: ${ADDRESS}`);

writeFileSync(
  join(tmpConfigDir, "client.yaml"),
  `---
keystore:
  File: ${KEYSTORE.replace(/\\/g, "\\\\")}
envs:
  - alias: testnet
    rpc: "https://fullnode.testnet.sui.io:443"
    ws: ~
    basic_auth: ~
active_env: testnet
active_address: "${ADDRESS}"
`
);

console.log("Building Move package…");
const buildJson = execSync(
  `sui move build --dump-bytecode-as-base64 --path ${PACKAGE_PATH} --silence-warnings --skip-fetch-latest-git-deps`,
  { encoding: "utf8", env: { ...process.env, SUI_CONFIG_DIR: tmpConfigDir } }
);
const { modules, dependencies } = JSON.parse(buildJson);
console.log(`  ${modules.length} module(s), ${dependencies.length} dependency(ies)`);

console.log("Building publish transaction…");
const tx = new Transaction();
const [upgradeCap] = tx.publish({ modules, dependencies });
tx.transferObjects([upgradeCap], ADDRESS);
tx.setGasBudget(GAS_BUDGET);

console.log("Submitting to Sui testnet…");
const client = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl("testnet"),
  network: "testnet",
});

const result = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: tx,
  options: { showEffects: true, showObjectChanges: true },
});

if (result.effects?.status?.status !== "success") {
  console.error("Publish failed:", JSON.stringify(result.effects?.status, null, 2));
  process.exit(1);
}

const published = (result.objectChanges ?? []).find((c) => c.type === "published");
if (!published) {
  console.error("No 'published' object in result:", result.objectChanges);
  process.exit(1);
}

console.log("\n✓ Published successfully!");
console.log("─".repeat(70));
console.log(`PACKAGE_ID:  ${published.packageId}`);
console.log(`TX_DIGEST:   ${result.digest}`);
console.log(`SIGNER:      ${ADDRESS}`);
console.log("─".repeat(70));
console.log("\nNext steps:");
console.log(`  1. Update .env: NEXT_PUBLIC_CARDJOY_PACKAGE_ID=${published.packageId}`);
console.log(`  2. Update cloudbuild.yaml: _PACKAGE_ID: "${published.packageId}"`);
console.log(`  3. Redeploy: gcloud builds submit --config=cloudbuild.yaml`);
