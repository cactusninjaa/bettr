import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { Coin } from "@/components/Coin";
import { UserMenu } from "@/components/UserMenu";
import { StreakFlame } from "@/components/StreakFlame";
import { XpBar } from "@/components/XpBar";
import { levelForXp } from "@/lib/gamification";

export async function Topbar() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      image: true,
      xp: true,
      level: true,
      currentStreak: true,
    },
  });
  if (!user) return null;

  const { level, xpInLevel, xpForNext } = levelForXp(user.xp);

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[color-mix(in_srgb,var(--background)_85%,transparent)] border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Coin size={28} />
          <span className="font-black text-lg tracking-tight">Bettr</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-[var(--surface-muted)]"
          >
            Mes groupes
          </Link>
          <Link
            href="/profile"
            className="px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-[var(--surface-muted)]"
          >
            Profil
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <XpBar
              level={level}
              xpInLevel={xpInLevel}
              xpForNext={xpForNext}
              compact
            />
          </div>
          <StreakFlame count={user.currentStreak} size="sm" />
          <UserMenu name={user.name} image={user.image} signOutAction={doSignOut} />
        </div>
      </div>
    </header>
  );
}
