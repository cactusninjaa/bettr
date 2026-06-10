import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { remainingBudget, DAILY_BUDGET } from "@/lib/scoring";
import { MatchCard } from "@/components/MatchCard";
import { Topbar } from "@/components/Topbar";
import { Coin } from "@/components/Coin";
import { InviteButton } from "@/components/InviteButton";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
        orderBy: { totalPoints: "desc" },
      },
    },
  });
  if (!group) notFound();

  const myMembership = group.members.find((m) => m.userId === userId);
  if (!myMembership) {
    // Pas membre → propose acceptation via une invitation (sinon 404 logique)
    return (
      <>
        <Topbar />
        <main className="max-w-3xl mx-auto px-6 py-16 grid place-items-center">
          <div className="card p-8 text-center flex flex-col gap-4 items-center max-w-md">
            <div className="text-5xl">🔒</div>
            <h1 className="text-xl font-bold">Tu n&apos;es pas membre</h1>
            <p className="text-sm text-[var(--muted)]">
              Ce groupe est privé. Demande un lien d&apos;invitation à un membre.
            </p>
            <Link href="/" className="btn-primary">Retour à mes groupes</Link>
          </div>
        </main>
      </>
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const matches = await prisma.match.findMany({
    where: { commenceTime: { gte: startOfDay }, settled: false },
    orderBy: { commenceTime: "asc" },
    take: 5,
  });

  const myBets = await prisma.bet.findMany({
    where: { userId, groupId: id, matchId: { in: matches.map((m) => m.id) } },
  });
  const betsByMatch = new Map(myBets.map((b) => [b.matchId, b]));

  const remaining = await remainingBudget(userId);
  const totalPoints = group.members.reduce((s, m) => s + m.totalPoints, 0);
  const max = Math.max(1, ...group.members.map((m) => m.totalPoints));
  const medals = ["🥇", "🥈", "🥉"];
  const isOwner = myMembership.role === "OWNER";

  return (
    <>
      <Topbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
        <header>
          <Link href="/" className="text-xs text-[var(--muted)] hover:underline">
            ← mes groupes
          </Link>
          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="min-w-0">
              <div className="card-section-title">Groupe</div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5 flex items-center gap-2 sm:gap-3 truncate">
                <span className="truncate">{group.name}</span>
                {isOwner && <span className="chip text-[10px] sm:text-xs shrink-0">Owner</span>}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{group.members.length} membres ·</span>
                <Coin size={13} />
                <span>{totalPoints.toLocaleString()} cumulés</span>
              </p>
            </div>
          </div>
        </header>

        {isOwner && <InviteButton groupId={id} />}

        <section className="card p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <div className="card-section-title">Ladder</div>
              <h2 className="text-base sm:text-lg font-bold mt-1">Classement</h2>
            </div>
            <span className="chip shrink-0">{group.members.length} joueurs</span>
          </div>
          <ul className="flex flex-col gap-1">
            {group.members.map((m, idx) => {
              const w = (m.totalPoints / max) * 100;
              const isMe = m.userId === userId;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-colors"
                  style={{
                    background: isMe ? "var(--primary-soft)" : "transparent",
                    border: isMe
                      ? "1.5px solid var(--border-strong)"
                      : "1.5px solid transparent",
                  }}
                >
                  <span className="w-6 sm:w-7 text-center font-bold text-[var(--muted)] text-sm shrink-0">
                    {medals[idx] ?? idx + 1}
                  </span>
                  {m.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.user.image}
                      alt={m.user.name ?? ""}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full grid place-items-center text-white font-bold text-xs shrink-0"
                      style={{ background: "var(--primary)" }}
                    >
                      {m.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate flex items-center gap-1.5 text-sm sm:text-base">
                      <span className="truncate">{m.user.name ?? "—"}</span>
                      {isMe && <span className="chip text-[9px] sm:text-[10px] shrink-0">toi</span>}
                      {m.role === "OWNER" && (
                        <span className="chip text-[9px] sm:text-[10px] shrink-0">Owner</span>
                      )}
                    </div>
                    <div className="bar mt-1.5">
                      <span style={{ width: `${w}%` }} />
                    </div>
                  </div>
                  <div className="font-mono font-bold text-[var(--primary)] text-sm shrink-0 flex items-center gap-1">
                    <Coin size={13} />
                    {m.totalPoints.toLocaleString()}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="card-section-title">Matches du jour</div>
              <h2 className="text-base sm:text-lg font-bold mt-1">Place tes pronostics</h2>
            </div>
            <div className="chip shrink-0">
              <Coin size={12} />
              {remaining}/{DAILY_BUDGET}
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="card p-4 sm:p-6 text-center text-sm text-[var(--muted)] italic">
              Aucun match. Lance « Récupérer les cotes » depuis l&apos;accueil.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              {matches.map((m) => (
                <MatchCard
                  key={m.id}
                  groupId={id}
                  remainingBudget={remaining}
                  existingBet={betsByMatch.get(m.id) ?? null}
                  match={{
                    id: m.id,
                    homeTeam: m.homeTeam,
                    awayTeam: m.awayTeam,
                    commenceTime: m.commenceTime.toISOString(),
                    oddsHome: m.oddsHome,
                    oddsDraw: m.oddsDraw,
                    oddsAway: m.oddsAway,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
