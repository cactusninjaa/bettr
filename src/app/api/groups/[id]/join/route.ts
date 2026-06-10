import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return Response.json({ error: "group not found" }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: id } },
  });
  if (existing) return Response.json(existing);

  const member = await prisma.groupMember.create({
    data: { userId, groupId: id },
  });
  return Response.json(member, { status: 201 });
}
