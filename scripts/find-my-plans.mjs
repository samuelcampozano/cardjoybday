// Lists every SurprisePlan you've created with the given address, in
// case you ever close the create modal before copying the invite link.
// Reads only public on-chain data; no keys touched.
//
// Usage: node scripts/find-my-plans.mjs [address] [--package=0x...]

import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

const args = process.argv.slice(2);
const ADDR =
  args.find((a) => !a.startsWith("--")) ??
  "0xf64afb55d7f67645d7542ab066a43b17f309c53c4d083dab1af7629b5007f413";
const PKG =
  args.find((a) => a.startsWith("--package="))?.split("=")[1] ??
  "0x01d4cb537283a740ddc9d9fa7c82a30baad22442dd41e109d8da0f2e0501a3d9";
const BASE = "https://cardjoybday-187936032519.us-central1.run.app/plan/";

const sui = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl("testnet"),
  network: "testnet",
});

console.log(`Searching plans created by ${ADDR}…`);
console.log(`(package ${PKG.slice(0, 10)}…${PKG.slice(-4)})\n`);

const result = await sui.queryTransactionBlocks({
  filter: { FromAddress: ADDR },
  options: { showObjectChanges: true, showEffects: true, showInput: false },
  limit: 50,
  order: "descending",
});

const plans = [];
for (const tx of result.data) {
  if (tx.effects?.status?.status !== "success") continue;
  for (const ch of tx.objectChanges ?? []) {
    if (ch.type !== "created") continue;
    if (!ch.objectType?.includes(`${PKG}::surprise_planner::SurprisePlan`)) continue;
    const isShared =
      typeof ch.owner === "object" && ch.owner !== null && "Shared" in ch.owner;
    if (!isShared) continue;
    plans.push({
      planId: ch.objectId,
      txDigest: tx.digest,
      timestampMs: tx.timestampMs,
    });
  }
}

if (plans.length === 0) {
  console.log("No plans found on this address for that package.");
  process.exit(0);
}

console.log(`Found ${plans.length} plan(s) — newest first:\n`);
for (const p of plans) {
  const when = p.timestampMs
    ? new Date(parseInt(p.timestampMs)).toISOString().replace("T", " ").slice(0, 19) + " UTC"
    : "(no timestamp)";
  console.log("  " + "─".repeat(70));
  console.log(`  Created:   ${when}`);
  console.log(`  Plan ID:   ${p.planId}`);
  console.log(`  Open:      ${BASE}${p.planId}`);
  console.log(`  Tx:        https://suiscan.xyz/testnet/tx/${p.txDigest}`);
}
console.log();
