import { prisma } from "@/lib/db";
import { fetchRecentScores, deriveResult } from "@/lib/odds-api";
import { settleMatch, oddsFor } from "@/lib/scoring";
import { recordBetSettled, checkAchievements } from "@/lib/gamification";
import { isCronAuthorized } from "@/lib/cron-auth";

async function settle() {
  const pending = await prisma.match.findMany({
    where: { settled: false, commenceTime: { lte: new Date() } },
    include: { bets: true },
  });

  let totalSettled = 0;
  let totalBetsUpdated = 0;
  const affectedUserIds = new Set<string>();

  async function applyResult(matchId: string, result: "HOME" | "DRAW" | "AWAY") {
    const match = await prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { bets: true },
    });
    await prisma.match.update({ where: { id: matchId }, data: { result } });
    // settleMatch updates bets + GroupMember.totalPoints based on match.result already set
    const n = await settleMatch(matchId);
    totalBetsUpdated += n;
    totalSettled++;
    // Award XP for each bet that won
    for (const bet of match.bets) {
      if (bet.status !== "PENDING") continue;
      const won = bet.choice === result;
      const pointsWon = won ? Math.round(bet.amount * oddsFor(match, bet.choice as "HOME" | "DRAW" | "AWAY")) : 0;
      await recordBetSettled(bet.userId, won, pointsWon);
      affectedUserIds.add(bet.userId);
    }
  }

  if (process.env.ODDS_API_KEY) {
    try {
      const scores = await fetchRecentScores();
      for (const m of pending) {
        const s = scores.find((x) => x.id === m.id);
        if (!s || !s.completed) continue;
        const result = deriveResult(m.homeTeam, m.awayTeam, s.scores);
        if (!result) continue;
        await applyResult(m.id, result);
      }
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  } else {
    for (const m of pending) {
      const choices: Array<"HOME" | "DRAW" | "AWAY"> = ["HOME", "DRAW", "AWAY"];
      await applyResult(m.id, choices[Math.floor(Math.random() * 3)]);
    }
  }

  // Check achievements for every user whose bets were just settled
  for (const userId of affectedUserIds) {
    await checkAchievements(userId);
  }

  return Response.json({
    settledMatches: totalSettled,
    betsUpdated: totalBetsUpdated,
    usersAffected: affectedUserIds.size,
    mode: process.env.ODDS_API_KEY ? "live" : "random-mock",
  });
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return settle();
}

export async function POST(req: Request) {
  if (!isCronAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return settle();
}
