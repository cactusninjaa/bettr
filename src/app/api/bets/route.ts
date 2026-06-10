import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { remainingBudget } from "@/lib/scoring";
import { recordBetPlaced, checkAchievements } from "@/lib/gamification";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    groupId?: string;
    matchId?: string;
    choice?: "HOME" | "DRAW" | "AWAY";
    amount?: number;
  };
  const { groupId, matchId, choice, amount } = body;

  if (!groupId || !matchId || !choice || !amount) {
    return Response.json({ error: "missing fields" }, { status: 400 });
  }
  if (!["HOME", "DRAW", "AWAY"].includes(choice)) {
    return Response.json({ error: "invalid choice" }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount < 1) {
    return Response.json({ error: "amount must be positive integer" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!membership) {
    return Response.json({ error: "not a member of this group" }, { status: 403 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return Response.json({ error: "match not found" }, { status: 404 });
  if (match.commenceTime.getTime() <= Date.now()) {
    return Response.json({ error: "match already started" }, { status: 409 });
  }
  if (choice === "DRAW" && match.oddsDraw == null) {
    return Response.json({ error: "no draw odds for this match" }, { status: 400 });
  }

  const dup = await prisma.bet.findUnique({
    where: { userId_matchId_groupId: { userId, matchId, groupId } },
  });
  if (dup) return Response.json({ error: "already bet on this match" }, { status: 409 });

  const remaining = await remainingBudget(userId);
  if (amount > remaining) {
    return Response.json(
      { error: `daily budget exceeded (remaining: ${remaining})` },
      { status: 400 },
    );
  }

  const bet = await prisma.bet.create({
    data: { userId, groupId, matchId, choice, amount },
  });

  const xpDelta = await recordBetPlaced(userId);
  const unlocked = await checkAchievements(userId);

  return Response.json(
    { bet, xpDelta, unlockedAchievements: unlocked },
    { status: 201 },
  );
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json([]);
  const url = new URL(req.url);
  const groupId = url.searchParams.get("groupId");

  const bets = await prisma.bet.findMany({
    where: { userId: session.user.id, ...(groupId ? { groupId } : {}) },
    include: { match: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json(bets);
}
