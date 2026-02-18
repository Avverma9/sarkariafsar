import ReminderCard from "./component/home/ReminderCard";
import SectionGrid from "./component/home/SectionGrid";
import ToolsCard from "./component/home/ToolsCard";
import TrendingCard from "./component/home/TrendingCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <TrendingCard />
        <ReminderCard />
        <ToolsCard />
        <SectionGrid />
      </main>
    </div>
  );
}
