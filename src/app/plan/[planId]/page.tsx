import Navbar from "@/components/Navbar";
import PlanView from "@/components/PlanView";

export default function PlanPage({
  params,
}: {
  params: { planId: string };
}) {
  return (
    <main>
      <Navbar />
      <PlanView planId={params.planId} />
    </main>
  );
}
