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
      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
        <header>
          <Link href="/" className="text-xs text-[var(--muted)] hover:underline">
            ← mes groupes
          </Link>
          <div className="flex items-center justify-between gap-4 mt-1">
            <div>
              <div className="card-section-title">Groupe</div>
              <h1 className="text-3xl font-black tracking-tight mt-0.5 flex items-center gap-3">
                {group.name}
                {isOwner && <span className="chip text-xs">Owner</span>}
              </h1>
              <p className="text-sm text-[var(--muted)] mt-0.5 flex items-center gap-1.5">
                <span>{group.members.length} membres ·</span>
                <Coin size={13} />
                <span>{totalPoints.toLocaleString()} cumulés</span>
              </p>
            </div>
          </div>
        </header>

        {isOwner && <InviteButton groupId={id} />}

        <section className="card p-6 flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="card-section-title">Ladder</div>
              <h2 className="text-lg font-bold mt-1">Classement</h2>
            </div>
            <span className="chip">{group.members.length} joueurs</span>
          </div>
          <ul className="flex flex-col gap-2">
            {group.members.map((m, idx) => {
              const w = (m.totalPoints / max) * 100;
              const isMe = m.userId === userId;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors"
                  style={{
                    background: isMe ? "var(--primary-soft)" : "transparent",
                    border: isMe
                      ? "1.5px solid var(--border-strong)"
                      : "1.5px solid transparent",
                  }}
                >
                  <span className="w-7 text-center font-bold text-[var(--muted)]">
                    {medals[idx] ?? idx + 1}
                  </span>
                  {m.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.user.image}
                      alt={m.user.name ?? ""}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full grid place-items-center text-white font-bold text-xs"
                      style={{ background: "var(--primary)" }}
                    >
                      {m.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate flex items-center gap-2">
                      {m.user.name ?? "—"}
                      {isMe && <span className="chip text-[10px]">toi</span>}
                      {m.role === "OWNER" && <span className="chip text-[10px]">Owner</span>}
                    </div>
                    <div className="bar mt-1.5">
                      <span style={{ width: `${w}%` }} />
                    </div>
                  </div>
                  <div className="font-mono font-bold text-[var(--primary)] shrink-0 flex items-center gap-1">
                    <Coin size={13} />
                    {m.totalPoints.toLocaleString()}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="card-section-title">Matches du jour</div>
              <h2 className="text-lg font-bold mt-1">Place tes pronostics</h2>
            </div>
            <div className="chip">
              <Coin size={12} />
              {remaining}/{DAILY_BUDGET} dispo
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="card p-6 text-center text-sm text-[var(--muted)] italic">
              Aucun match. Lance « Récupérer les cotes » depuis l&apos;accueil.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
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
