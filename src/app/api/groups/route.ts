import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { checkAchievements } from "@/lib/gamification";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json([]);

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const result = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    role: m.role,
    memberCount: m.group.members.length,
    totalPoints: m.group.members.reduce((s, x) => s + x.totalPoints, 0),
    myPoints: m.totalPoints,
  }));
  return Response.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim();
  if (!name) return Response.json({ error: "name required" }, { status: 400 });
  if (name.length > 64) {
    return Response.json({ error: "name too long" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
  });

  const unlocked = await checkAchievements(session.user.id);
  return Response.json({ group, unlockedAchievements: unlocked }, { status: 201 });
}
