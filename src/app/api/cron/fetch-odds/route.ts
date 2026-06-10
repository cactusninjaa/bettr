import { prisma } from "@/lib/db";
import { fetchTodaysOdds } from "@/lib/odds-api";
import { isCronAuthorized } from "@/lib/cron-auth";

async function ingest() {
  if (!process.env.ODDS_API_KEY) {
    return Response.json(
      { error: "ODDS_API_KEY not configured", hint: "mock matches déjà présents via seed" },
      { status: 400 },
    );
  }
  try {
    const diag = await fetchTodaysOdds();
    for (const e of diag.events) {
      await prisma.match.upsert({
        where: { id: e.id },
        create: {
          id: e.id,
          sportKey: e.sportKey,
          homeTeam: e.homeTeam,
          awayTeam: e.awayTeam,
          commenceTime: e.commenceTime,
          oddsHome: e.oddsHome,
          oddsDraw: e.oddsDraw,
          oddsAway: e.oddsAway,
        },
        update: {
          oddsHome: e.oddsHome,
          oddsDraw: e.oddsDraw,
          oddsAway: e.oddsAway,
          commenceTime: e.commenceTime,
        },
      });
    }
    return Response.json({
      sport: diag.sport,
      rawEvents: diag.rawCount,
      ingested: diag.events.length,
      hint:
        diag.rawCount === 0
          ? "Aucun match disponible. Change ODDS_SPORT_KEY (voir ?listSports=1)."
          : undefined,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("listSports") === "1") {
    if (!process.env.ODDS_API_KEY) {
      return Response.json({ error: "ODDS_API_KEY not configured" }, { status: 400 });
    }
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${process.env.ODDS_API_KEY}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return Response.json({ error: await res.text() }, { status: res.status });
    }
    const data = (await res.json()) as Array<{
      key: string;
      title: string;
      group: string;
      active: boolean;
      has_outrights: boolean;
    }>;
    return Response.json(
      data
        .filter((s) => s.active && !s.has_outrights)
        .map((s) => ({ key: s.key, title: s.title, group: s.group })),
    );
  }
  if (!isCronAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return ingest();
}

export async function POST(req: Request) {
  if (!isCronAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return ingest();
}
