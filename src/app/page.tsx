import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { remainingBudget, DAILY_BUDGET } from "@/lib/scoring";
import { Topbar } from "@/components/Topbar";
import { GroupList } from "@/components/GroupList";
import { InterGroupLadder } from "@/components/InterGroupLadder";
import { AdminBar } from "@/components/AdminBar";
import { Coin } from "@/components/Coin";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, remaining, matchCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { name: true, currentStreak: true },
    }),
    remainingBudget(session.user.id),
    prisma.match.count({
      where: {
        commenceTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        settled: false,
      },
    }),
  ]);

  const firstName = user.name?.split(" ")[0] ?? "ami";

  return (
    <>
      <Topbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
        <section
          className="card p-5 sm:p-8 flex flex-col md:flex-row gap-5 md:gap-6 md:items-center justify-between"
          style={{ background: "var(--primary)", color: "white", border: "none" }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest opacity-80">
              Bonjour {firstName}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black mt-1 leading-tight">
              {matchCount > 0
                ? `${matchCount} match${matchCount > 1 ? "es" : ""} t'attendent.`
                : "Aucun match aujourd'hui."}
              <br />
              <span className="opacity-80">
                {remaining > 0
                  ? `Il te reste ${remaining} pts à miser.`
                  : "Tu as épuisé ton budget du jour."}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:flex gap-2 sm:gap-3 shrink-0">
            <div
              className="px-3 py-3 sm:px-5 sm:py-4 rounded-2xl"
              style={{ background: "var(--primary-dark)" }}
            >
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-80">
                Budget restant
              </div>
              <div className="font-mono font-black text-xl sm:text-2xl flex items-center gap-1.5 mt-0.5">
                <Coin size={18} />
                {remaining}
              </div>
              <div className="text-[9px] sm:text-[10px] opacity-70 mt-0.5">/ {DAILY_BUDGET}</div>
            </div>
            <div
              className="px-3 py-3 sm:px-5 sm:py-4 rounded-2xl"
              style={{ background: "var(--primary-dark)" }}
            >
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-80">
                Streak
              </div>
              <div className="font-mono font-black text-xl sm:text-2xl mt-0.5">
                {user.currentStreak} 🔥
              </div>
              <div className="text-[9px] sm:text-[10px] opacity-70 mt-0.5">jours</div>
            </div>
          </div>
        </section>

        <AdminBar />

        <div className="grid lg:grid-cols-2 gap-6">
          <GroupList />
          <InterGroupLadder />
        </div>

        <footer className="text-center text-xs text-[var(--muted)] py-4">
          Argent fictif · POC interne
        </footer>
      </main>
    </>
  );
}
