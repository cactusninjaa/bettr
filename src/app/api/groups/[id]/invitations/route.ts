import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { inviteToken } from "@/lib/tokens";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: id } },
  });
  if (!membership) {
    return Response.json({ error: "not a member" }, { status: 403 });
  }
  if (membership.role !== "OWNER") {
    return Response.json({ error: "only OWNER can invite" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as {
    expiresInDays?: number;
    maxUses?: number | null;
  };

  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86_400_000)
    : null;

  const invitation = await prisma.invitation.create({
    data: {
      token: inviteToken(),
      groupId: id,
      createdById: session.user.id,
      expiresAt,
      maxUses: body.maxUses ?? null,
    },
  });

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "localhost:3000";
  const url = `${proto}://${host}/invite/${invitation.token}`;

  return Response.json({ token: invitation.token, url, expiresAt }, { status: 201 });
}
