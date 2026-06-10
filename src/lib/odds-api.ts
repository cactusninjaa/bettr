const BASE = "https://api.the-odds-api.com/v4";

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
}

export interface OddsApiScore {
  id: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: Array<{ name: string; score: string }> | null;
}

export interface NormalizedEvent {
  id: string;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: Date;
  oddsHome: number;
  oddsDraw: number | null;
  oddsAway: number;
}

function getKey(): string {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY missing in env");
  return key;
}

function getSport(): string {
  return process.env.ODDS_SPORT_KEY ?? "soccer_fifa_world_cup";
}

function pickH2H(event: OddsApiEvent): NormalizedEvent | null {
  for (const bm of event.bookmakers) {
    const market = bm.markets.find((m) => m.key === "h2h");
    if (!market) continue;
    const home = market.outcomes.find((o) => o.name === event.home_team)?.price;
    const away = market.outcomes.find((o) => o.name === event.away_team)?.price;
    const draw = market.outcomes.find((o) => o.name === "Draw")?.price;
    if (home != null && away != null) {
      return {
        id: event.id,
        sportKey: event.sport_key,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commenceTime: new Date(event.commence_time),
        oddsHome: home,
        oddsAway: away,
        oddsDraw: draw ?? null,
      };
    }
  }
  return null;
}

export interface FetchOddsDiagnostics {
  sport: string;
  rawCount: number;
  normalizedCount: number;
  events: NormalizedEvent[];
}

export async function fetchTodaysOdds(): Promise<FetchOddsDiagnostics> {
  const sport = getSport();
  const url = `${BASE}/sports/${sport}/odds?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${getKey()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`odds-api ${res.status}: ${await res.text()}`);
  const events = (await res.json()) as OddsApiEvent[];
  const normalized = events
    .map(pickH2H)
    .filter((e): e is NormalizedEvent => e !== null)
    .sort((a, b) => a.commenceTime.getTime() - b.commenceTime.getTime());
  return {
    sport,
    rawCount: events.length,
    normalizedCount: normalized.length,
    events: normalized.slice(0, 5),
  };
}

export async function fetchRecentScores(): Promise<OddsApiScore[]> {
  const url = `${BASE}/sports/${getSport()}/scores?daysFrom=3&apiKey=${getKey()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`odds-api ${res.status}: ${await res.text()}`);
  return (await res.json()) as OddsApiScore[];
}

export function deriveResult(
  homeTeam: string,
  awayTeam: string,
  scores: OddsApiScore["scores"],
): "HOME" | "DRAW" | "AWAY" | null {
  if (!scores) return null;
  const h = scores.find((s) => s.name === homeTeam);
  const a = scores.find((s) => s.name === awayTeam);
  if (!h || !a) return null;
  const hs = parseInt(h.score, 10);
  const as = parseInt(a.score, 10);
  if (Number.isNaN(hs) || Number.isNaN(as)) return null;
  if (hs > as) return "HOME";
  if (as > hs) return "AWAY";
  return "DRAW";
}
