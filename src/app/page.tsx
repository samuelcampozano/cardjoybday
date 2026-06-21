"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import UserHistory from "@/components/UserHistory";
import HowItWorks from "@/components/HowItWorks";
import TechShowcase from "@/components/TechShowcase";
import Footer from "@/components/Footer";
import CreatePlanModal from "@/components/CreatePlanModal";
import JoinPlanModal from "@/components/JoinPlanModal";

export default function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero
        onCreateClick={() => setShowCreate(true)}
        onJoinClick={() => setShowJoin(true)}
      />
      <UserHistory />
      <HowItWorks />
      <TechShowcase />
      <Footer />

      {showCreate && (
        <CreatePlanModal onClose={() => setShowCreate(false)} />
      )}
      {showJoin && (
        <JoinPlanModal onClose={() => setShowJoin(false)} />
      )}
    </main>
  );
}
