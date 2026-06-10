import { prisma } from "@/lib/db";

export async function GET() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const matches = await prisma.match.findMany({
    where: {
      commenceTime: { gte: startOfDay },
      settled: false,
    },
    orderBy: { commenceTime: "asc" },
    take: 5,
  });
  return Response.json(matches);
}
