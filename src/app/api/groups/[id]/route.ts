import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
        orderBy: { totalPoints: "desc" },
      },
    },
  });
  if (!group) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({
    id: group.id,
    name: group.name,
    members: group.members.map((m, idx) => ({
      rank: idx + 1,
      userId: m.userId,
      name: m.user.name,
      totalPoints: m.totalPoints,
    })),
    totalPoints: group.members.reduce((s, m) => s + m.totalPoints, 0),
  });
}
