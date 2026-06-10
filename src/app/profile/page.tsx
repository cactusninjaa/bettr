import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { levelForXp } from "@/lib/gamification";
import { Coin } from "@/components/Coin";
import { XpBar } from "@/components/XpBar";
import { StreakFlame } from "@/components/StreakFlame";
import { BadgeWall } from "@/components/BadgeWall";
import { Topbar } from "@/components/Topbar";
import { SoundToggle } from "@/components/SoundToggle";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, allAchievements, owned, totalBets, totalWins, biggest] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.achievement.findMany({ orderBy: { category: "asc" } }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    }),
    prisma.bet.count({ where: { userId } }),
    prisma.bet.count({ where: { userId, status: "WON" } }),
    prisma.bet.aggregate({ where: { userId }, _max: { pointsWon: true } }),
  ]);

  const ownedMap = new Map(owned.map((u) => [u.achievementId, u.unlockedAt]));
  const badges = allAchievements.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    unlocked: ownedMap.has(a.id),
    unlockedAt: ownedMap.get(a.id)?.toISOString() ?? null,
  }));

  const { level, xpInLevel, xpForNext } = levelForXp(user.xp);
  const winRate = totalBets > 0 ? Math.round((totalWins / totalBets) * 100) : 0;

  return (
    <>
      <Topbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
        <header className="flex items-center gap-3 sm:gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? ""}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full grid place-items-center text-white text-xl sm:text-2xl font-black shrink-0"
              style={{ background: "var(--primary)" }}
            >
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="card-section-title">Profil</div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
              {user.name ?? "—"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] truncate">{user.email}</p>
          </div>
        </header>

        <section className="card p-4 sm:p-6 flex flex-col gap-4">
          <XpBar level={level} xpInLevel={xpInLevel} xpForNext={xpForNext} />
          <div className="divider" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Stat label="Total XP" value={user.xp.toLocaleString()} icon={<Coin size={18} />} />
            <Stat
              label="Streak"
              value={`${user.currentStreak} 🔥`}
              sub={`Record : ${user.longestStreak}`}
            />
            <Stat label="Paris" value={totalBets.toString()} sub={`${totalWins} gagnés`} />
            <Stat
              label="Win rate"
              value={`${winRate}%`}
              sub={`Top : ${biggest._max.pointsWon ?? 0}`}
            />
          </div>
        </section>

        <BadgeWall badges={badges} />

        <section className="card p-4 sm:p-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="card-section-title">Préférences</div>
            <h2 className="text-base sm:text-lg font-bold mt-1">Sons & animations</h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
              Active ou coupe les effets sonores.
            </p>
          </div>
          <SoundToggle initial={user.soundEnabled} />
        </section>
      </main>
    </>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[var(--surface-muted)] min-w-0">
      <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold truncate">
        {label}
      </span>
      <span className="font-mono font-black text-lg sm:text-xl flex items-center gap-1.5 truncate">
        {icon}
        {value}
      </span>
      {sub && <span className="text-[10px] text-[var(--muted)] truncate">{sub}</span>}
    </div>
  );
}
