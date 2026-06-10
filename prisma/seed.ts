import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";

const dbUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "file:./prisma/dev.db";

const prisma = dbUrl.startsWith("postgres")
  ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: dbUrl }) })
  : new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: dbUrl.replace(/^file:/, "") }),
    });

interface AchievementSeed {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "milestone" | "streak" | "scoring" | "social";
  threshold:
    | { type: "first_bet" }
    | { type: "first_win" }
    | { type: "wins"; value: number }
    | { type: "streak"; value: number }
    | { type: "level"; value: number }
    | { type: "big_win"; value: number }
    | { type: "groups_owned"; value: number }
    | { type: "groups_joined"; value: number };
}

const ACHIEVEMENTS: AchievementSeed[] = [
  { id: "first_bet", name: "Premier pari", description: "Place ton premier pari", icon: "🎯", category: "milestone", threshold: { type: "first_bet" } },
  { id: "first_win", name: "Première victoire", description: "Gagne ton premier pari", icon: "✨", category: "milestone", threshold: { type: "first_win" } },
  { id: "wins_10", name: "Pronostiqueur", description: "10 paris gagnés", icon: "🎖️", category: "scoring", threshold: { type: "wins", value: 10 } },
  { id: "wins_50", name: "Tacticien", description: "50 paris gagnés", icon: "🏅", category: "scoring", threshold: { type: "wins", value: 50 } },
  { id: "wins_100", name: "Stratège", description: "100 paris gagnés", icon: "👑", category: "scoring", threshold: { type: "wins", value: 100 } },
  { id: "big_win_100", name: "Coup de maître", description: "Un seul pari rapportant 100+ pts", icon: "💎", category: "scoring", threshold: { type: "big_win", value: 100 } },
  { id: "streak_3", name: "En forme", description: "3 jours d'affilée", icon: "🔥", category: "streak", threshold: { type: "streak", value: 3 } },
  { id: "streak_7", name: "Une semaine !", description: "7 jours d'affilée", icon: "⚡", category: "streak", threshold: { type: "streak", value: 7 } },
  { id: "streak_30", name: "Inarrêtable", description: "30 jours d'affilée", icon: "🌟", category: "streak", threshold: { type: "streak", value: 30 } },
  { id: "level_5", name: "Niveau 5", description: "Atteins le niveau 5", icon: "📈", category: "milestone", threshold: { type: "level", value: 5 } },
  { id: "level_10", name: "Niveau 10", description: "Atteins le niveau 10", icon: "🚀", category: "milestone", threshold: { type: "level", value: 10 } },
  { id: "group_creator", name: "Capitaine", description: "Crée ton premier groupe", icon: "🛡️", category: "social", threshold: { type: "groups_owned", value: 1 } },
  { id: "social_butterfly", name: "Mister Network", description: "Sois membre de 3 groupes", icon: "🤝", category: "social", threshold: { type: "groups_joined", value: 3 } },
];

async function main() {
  console.log("Seeding achievements...");
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        thresholdJSON: JSON.stringify(a.threshold),
      },
      update: {
        name: a.name,
        description: a.description,
        icon: a.icon,
        category: a.category,
        thresholdJSON: JSON.stringify(a.threshold),
      },
    });
  }
  console.log(`✓ ${ACHIEVEMENTS.length} achievements ready.`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
