import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json([]);

  const myMemberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    select: { groupId: true },
  });
  const myGroupIds = new Set(myMemberships.map((m) => m.groupId));

  const groups = await prisma.group.findMany({
    include: { members: true },
  });
  const ranked = groups
    .map((g) => ({
      id: g.id,
      name: g.name,
      memberCount: g.members.length,
      totalPoints: g.members.reduce((s, m) => s + m.totalPoints, 0),
      isMine: myGroupIds.has(g.id),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 20)
    .map((g, idx) => ({ rank: idx + 1, ...g }));

  return Response.json(ranked);
}
