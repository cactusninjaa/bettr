import { prisma } from "@/lib/db";

export const DAILY_BUDGET = 100;

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function spentToday(userId: string): Promise<number> {
  const agg = await prisma.bet.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfDay(), lte: endOfDay() },
    },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

export async function remainingBudget(userId: string): Promise<number> {
  return DAILY_BUDGET - (await spentToday(userId));
}

export function oddsFor(
  match: { oddsHome: number; oddsDraw: number | null; oddsAway: number },
  choice: "HOME" | "DRAW" | "AWAY",
): number {
  if (choice === "HOME") return match.oddsHome;
  if (choice === "AWAY") return match.oddsAway;
  return match.oddsDraw ?? 0;
}

export async function settleMatch(matchId: string): Promise<number> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { bets: true },
  });
  if (!match || !match.result || match.settled) return 0;

  let updated = 0;
  for (const bet of match.bets) {
    if (bet.status !== "PENDING") continue;
    const won = bet.choice === match.result;
    const odds = oddsFor(match, bet.choice as "HOME" | "DRAW" | "AWAY");
    const pointsWon = won ? Math.round(bet.amount * odds) : 0;
    await prisma.bet.update({
      where: { id: bet.id },
      data: {
        status: won ? "WON" : "LOST",
        pointsWon,
      },
    });
    if (pointsWon > 0) {
      await prisma.groupMember.update({
        where: { userId_groupId: { userId: bet.userId, groupId: bet.groupId } },
        data: { totalPoints: { increment: pointsWon } },
      });
    }
    updated++;
  }
  await prisma.match.update({
    where: { id: match.id },
    data: { settled: true },
  });
  return updated;
}
