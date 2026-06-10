import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { checkAchievements } from "@/lib/gamification";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const inv = await prisma.invitation.findUnique({ where: { token } });
  if (!inv) return Response.json({ error: "invalid invitation" }, { status: 404 });

  if (inv.expiresAt && inv.expiresAt.getTime() < Date.now()) {
    return Response.json({ error: "invitation expired" }, { status: 410 });
  }
  if (inv.maxUses != null && inv.uses >= inv.maxUses) {
    return Response.json({ error: "invitation exhausted" }, { status: 410 });
  }

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: inv.groupId } },
  });
  if (existing) {
    return Response.json({ groupId: inv.groupId, alreadyMember: true });
  }

  await prisma.$transaction([
    prisma.groupMember.create({
      data: { userId, groupId: inv.groupId, role: "MEMBER" },
    }),
    prisma.invitation.update({
      where: { id: inv.id },
      data: { uses: { increment: 1 } },
    }),
  ]);

  const unlocked = await checkAchievements(userId);
  return Response.json({ groupId: inv.groupId, unlockedAchievements: unlocked });
}
