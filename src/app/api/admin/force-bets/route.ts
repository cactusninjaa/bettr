import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { oddsFor } from "@/lib/scoring";
import { recordBetSettled, checkAchievements } from "@/lib/gamification";

export interface ForceBetResult {
  betId: string;
  matchLabel: string;
  groupName: string;
  choice: string;
  amount: number;
  outcome: "WIN" | "LOSE";
  pointsWon: number;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { outcome?: "WIN" | "LOSE" };
  const outcome = body.outcome;
  if (outcome !== "WIN" && outcome !== "LOSE") {
    return Response.json({ error: "outcome must be WIN or LOSE" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const bets = await prisma.bet.findMany({
    where: { userId, status: "PENDING" },
    include: { match: true, group: true },
    orderBy: { createdAt: "asc" },
  });

  if (bets.length === 0) {
    return Response.json({ results: [], message: "Aucun pari en attente" });
  }

  const results: ForceBetResult[] = [];
  let leveledUpTo: number | null = null;

  for (const bet of bets) {
    const odds = oddsFor(bet.match, bet.choice as "HOME" | "DRAW" | "AWAY");
    const won = outcome === "WIN";
    const pointsWon = won ? Math.round(bet.amount * odds) : 0;

    await prisma.bet.update({
      where: { id: bet.id },
      data: {
        status: won ? "WON" : "LOST",
        pointsWon,
      },
    });

    if (won) {
      await prisma.groupMember.update({
        where: {
          userId_groupId: { userId: bet.userId, groupId: bet.groupId },
        },
        data: { totalPoints: { increment: pointsWon } },
      });
    }

    const delta = await recordBetSettled(userId, won, pointsWon);
    if (delta.leveledUp) leveledUpTo = delta.newLevel;

    results.push({
      betId: bet.id,
      matchLabel: `${bet.match.homeTeam} vs ${bet.match.awayTeam}`,
      groupName: bet.group.name,
      choice: bet.choice,
      amount: bet.amount,
      outcome,
      pointsWon,
    });
  }

  const unlocked = await checkAchievements(userId);

  return Response.json({
    results,
    unlockedAchievements: unlocked,
    leveledUpTo,
  });
}
