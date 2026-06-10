import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const inv = await prisma.invitation.findUnique({
    where: { token },
    include: {
      group: {
        include: { members: true },
      },
      createdBy: { select: { name: true, image: true } },
    },
  });
  if (!inv) return Response.json({ error: "invalid" }, { status: 404 });

  const expired = inv.expiresAt && inv.expiresAt.getTime() < Date.now();
  const exhausted = inv.maxUses != null && inv.uses >= inv.maxUses;

  return Response.json({
    valid: !expired && !exhausted,
    expired,
    exhausted,
    group: {
      id: inv.group.id,
      name: inv.group.name,
      memberCount: inv.group.members.length,
    },
    invitedBy: inv.createdBy,
  });
}
