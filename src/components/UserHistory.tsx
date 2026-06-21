"use client";

import { useEffect, useState, useMemo } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { config } from "@/lib/config";
import { walrusBlobUrl } from "@/lib/walrus";
import {
  Gift,
  Crown,
  MessageCircle,
  ArrowRight,
  Loader2,
  History,
  Inbox,
  Send,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface PlanSummary {
  id: string;
  title: string;
  creator: string;
  recipient: string | null;
  wishesCount: number;
  finalCardBlobId: string | null;
  isFinalized: boolean;
}

type TabType = "created" | "received" | "signed";

export default function UserHistory() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [activeTab, setActiveTab] = useState<TabType>("created");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [error, setError] = useState("");

  const userAddress = account?.address;

  // Track plan IDs categorized by how the user relates to them
  const [relations, setRelations] = useState<{
    created: Set<string>;
    received: Set<string>;
    signed: Set<string>;
  }>({
    created: new Set(),
    received: new Set(),
    signed: new Set(),
  });

  useEffect(() => {
    if (!userAddress) {
      setPlans([]);
      setRelations({ created: new Set(), received: new Set(), signed: new Set() });
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const pkg = config.sui.packageId;
        const addrLower = userAddress!.toLowerCase();

        // 1. Query PlanCreated events
        const createdEvents = await suiClient.queryEvents({
          query: { MoveEventType: `${pkg}::surprise_planner::PlanCreated` },
          limit: 100,
        });

        // 2. Query WishAdded events
        const wishEvents = await suiClient.queryEvents({
          query: { MoveEventType: `${pkg}::surprise_planner::WishAdded` },
          limit: 100,
        });

        // 3. Query CardFinalized events
        const finalizedEvents = await suiClient.queryEvents({
          query: { MoveEventType: `${pkg}::surprise_planner::CardFinalized` },
          limit: 100,
        });

        const createdSet = new Set<string>();
        const signedSet = new Set<string>();
        const receivedSet = new Set<string>();

        // Filter PlanCreated
        for (const ev of createdEvents.data) {
          const fields = ev.parsedJson as any;
          if (fields && fields.creator?.toLowerCase() === addrLower) {
            createdSet.add(fields.plan_id);
          }
        }

        // Filter WishAdded
        for (const ev of wishEvents.data) {
          const fields = ev.parsedJson as any;
          if (fields && fields.contributor?.toLowerCase() === addrLower) {
            signedSet.add(fields.plan_id);
          }
        }

        // Filter CardFinalized
        for (const ev of finalizedEvents.data) {
          const fields = ev.parsedJson as any;
          if (fields && fields.recipient?.toLowerCase() === addrLower) {
            receivedSet.add(fields.plan_id);
          }
        }

        const allIds = Array.from(new Set([...createdSet, ...signedSet, ...receivedSet]));

        if (allIds.length === 0) {
          setPlans([]);
          setRelations({ created: createdSet, received: receivedSet, signed: signedSet });
          setLoading(false);
          return;
        }

        // 4. Batch query all plan objects to extract details (title, wishes count, is_finalized, final_card_blob_id)
        const objectData = await suiClient.multiGetObjects({
          ids: allIds,
          options: { showContent: true },
        });

        const summaries: PlanSummary[] = [];

        for (const obj of objectData) {
          if (obj.error || obj.data?.content?.dataType !== "moveObject") continue;
          const fields = obj.data.content.fields as any;
          const planId = obj.data.objectId;

          // Helper to extract option
          const extractOpt = <T,>(opt: any): T | null => {
            if (!opt) return null;
            if (Array.isArray(opt)) return opt.length > 0 ? opt[0] : null;
            const vec = opt.vec ?? opt.fields?.vec;
            if (Array.isArray(vec)) return vec.length > 0 ? vec[0] : null;
            return null;
          };

          summaries.push({
            id: planId,
            title: fields.title || "Surprise Plan",
            creator: fields.creator,
            recipient: extractOpt<string>(fields.recipient),
            wishesCount: fields.wishes?.length || 0,
            finalCardBlobId: extractOpt<string>(fields.final_card_blob_id),
            isFinalized: !!fields.is_finalized,
          });
        }

        setPlans(summaries);
        setRelations({ created: createdSet, received: receivedSet, signed: signedSet });
      } catch (err: any) {
        console.error("Failed to load history:", err);
        setError("Could not retrieve plan history from the Sui network.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [userAddress, suiClient]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (activeTab === "created") return relations.created.has(p.id);
      if (activeTab === "received") return relations.received.has(p.id);
      if (activeTab === "signed") return relations.signed.has(p.id);
      return false;
    });
  }, [plans, activeTab, relations]);

  if (!userAddress) {
    return null;
  }

  return (
    <section className="relative py-16 sm:py-24 border-t border-white/[0.06] bg-ink-950/20">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-gradient" />
              <span className="eyebrow">On-chain dashboard</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink-50 leading-tight">
              My Celebration <span className="italic text-gradient">History</span>
            </h2>
            <p className="text-ink-400 text-sm mt-1.5 max-w-lg">
              Check out birthday surprise plans you have created, wishes you have written, or cards sent directly to you.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex p-1 bg-white/[0.03] border border-white/10 rounded-2xl self-start sm:self-center">
            {(
              [
                { id: "created", label: "Created", icon: Crown },
                { id: "signed", label: "Signed", icon: MessageCircle },
                { id: "received", label: "Received", icon: Gift },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count =
                tab.id === "created"
                  ? relations.created.size
                  : tab.id === "signed"
                  ? relations.signed.size
                  : relations.received.size;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-white/[0.08] text-ink-50 shadow-soft-card border border-white/10"
                      : "text-ink-300 hover:text-ink-100 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[0.6rem] ${
                    isActive ? "bg-gradient-celebration text-white" : "bg-white/5 text-ink-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loader */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-ember animate-spin" />
            <p className="text-xs font-mono text-ink-400">Syncing history from Sui…</p>
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div className="rounded-2xl border border-rosegold/30 bg-rosegold/[0.05] p-5 text-center text-sm text-rosegold max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Results grid */}
        {!loading && !error && (
          <>
            {filteredPlans.length === 0 ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.01] py-16 text-center">
                {activeTab === "created" ? (
                  <Send className="w-8 h-8 text-ink-500 mx-auto mb-4" />
                ) : activeTab === "received" ? (
                  <Gift className="w-8 h-8 text-ink-500 mx-auto mb-4" />
                ) : (
                  <Inbox className="w-8 h-8 text-ink-500 mx-auto mb-4" />
                )}
                <p className="font-display text-xl text-ink-100 mb-1.5">
                  No plans found
                </p>
                <p className="text-ink-400 text-xs max-w-sm mx-auto leading-relaxed">
                  {activeTab === "created"
                    ? "You haven't created any surprise birthday plans yet. Spin one up above!"
                    : activeTab === "received"
                    ? "No finalized birthday cards have been sealed for your address yet."
                    : "You haven't contributed any birthday wishes to friends' plans yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((plan) => {
                  return (
                    <article
                      key={plan.id}
                      className="group relative rounded-3xl glass-card border border-white/10 hover:border-white/20 p-6 flex flex-col h-full transition-all duration-300 hover:-translate-y-0.5"
                    >
                      {/* Image header if finalized */}
                      {plan.isFinalized && plan.finalCardBlobId ? (
                        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/5 mb-5 bg-ink-950">
                          <img
                            src={walrusBlobUrl(plan.finalCardBlobId)}
                            alt={plan.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3 bg-emerald-500/90 text-white font-mono text-[0.62rem] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                            Sealed
                          </div>
                        </div>
                      ) : (
                        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/5 mb-5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex flex-col items-center justify-center text-center px-4">
                          <div className="relative flex h-2.5 w-2.5 mb-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ember" />
                          </div>
                          <p className="text-[0.65rem] uppercase tracking-widest text-ink-300 font-semibold mb-1">
                            Gathering Wishes
                          </p>
                          <p className="text-[0.65rem] font-mono text-ink-400">
                            {plan.wishesCount} wishes contributed
                          </p>
                        </div>
                      )}

                      <h3 className="font-display text-xl text-ink-50 mb-2 truncate">
                        {plan.title.replace(/^Birthday Surprise for /i, "")}
                      </h3>

                      <div className="flex flex-col gap-1.5 text-[0.7rem] font-mono text-ink-400 mb-6">
                        <span className="truncate">
                          ID: {plan.id.slice(0, 8)}…{plan.id.slice(-6)}
                        </span>
                        {plan.recipient && (
                          <span className="truncate">
                            For: {plan.recipient.slice(0, 8)}…{plan.recipient.slice(-6)}
                          </span>
                        )}
                        <span>
                          By: {plan.creator.slice(0, 8)}…{plan.creator.slice(-6)}
                        </span>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
                        {plan.isFinalized && plan.finalCardBlobId ? (
                          <a
                            href={walrusBlobUrl(plan.finalCardBlobId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[0.72rem] text-ink-400 hover:text-ink-200 transition-colors"
                          >
                            Walrus Blob <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[0.72rem] text-ink-500 italic">
                            Unsealed
                          </span>
                        )}

                        <Link
                          href={`/plan/${plan.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gradient group-hover:translate-x-0.5 transition-transform"
                        >
                          View plan
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
