import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { remainingBudget, DAILY_BUDGET } from "@/lib/scoring";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      xp: true,
      level: true,
      currentStreak: true,
      longestStreak: true,
      soundEnabled: true,
    },
  });
  const remaining = await remainingBudget(session.user.id);
  return Response.json({
    user,
    dailyBudget: DAILY_BUDGET,
    remaining,
  });
}
