import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { soundEnabled?: boolean; name?: string };
  const data: { soundEnabled?: boolean; name?: string } = {};
  if (typeof body.soundEnabled === "boolean") data.soundEnabled = body.soundEnabled;
  if (typeof body.name === "string" && body.name.trim().length > 0) {
    data.name = body.name.trim().slice(0, 32);
  }
  if (Object.keys(data).length === 0) {
    return Response.json({ error: "nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, soundEnabled: true },
  });
  return Response.json(user);
}
