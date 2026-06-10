import { prisma } from "@/lib/db";

export const XP_PER_BET = 5;
export const XP_PER_WIN = 20;
export const XP_BONUS_PER_POINT = 0.1;

/**
 * Cumulative XP needed to reach level n: 50 * n * (n - 1)
 * Level 1 starts at 0 XP. Level 2 at 100. Level 3 at 300. Level 4 at 600. etc.
 */
function xpToReach(level: number): number {
  return 50 * level * (level - 1);
}

export function levelForXp(xp: number): {
  level: number;
  xpInLevel: number;
  xpForNext: number;
} {
  let level = 1;
  while (xpToReach(level + 1) <= xp) level++;
  const floor = xpToReach(level);
  const ceil = xpToReach(level + 1);
  return { level, xpInLevel: xp - floor, xpForNext: ceil - floor };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(prev: Date, today: Date): boolean {
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return isSameDay(prev, y);
}

export interface XpDelta {
  xpGained: number;
  newXp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newStreak: number;
}

export async function recordBetPlaced(userId: string): Promise<XpDelta> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const today = new Date();

  let newStreak = user.currentStreak;
  if (!user.lastBetDate) {
    newStreak = 1;
  } else if (isSameDay(user.lastBetDate, today)) {
    // already counted today
  } else if (isYesterday(user.lastBetDate, today)) {
    newStreak = user.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const xpGained = XP_PER_BET;
  const newXp = user.xp + xpGained;
  const oldLevel = user.level;
  const { level: newLevel } = levelForXp(newXp);

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
      currentStreak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      lastBetDate: today,
    },
  });

  return {
    xpGained,
    newXp,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    newStreak,
  };
}

export async function recordBetSettled(
  userId: string,
  won: boolean,
  pointsWon: number,
): Promise<XpDelta> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const xpGained = won ? XP_PER_WIN + Math.floor(pointsWon * XP_BONUS_PER_POINT) : 0;
  const newXp = user.xp + xpGained;
  const oldLevel = user.level;
  const { level: newLevel } = levelForXp(newXp);

  if (xpGained > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    });
  }

  return {
    xpGained,
    newXp,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    newStreak: user.currentStreak,
  };
}

interface UserStats {
  totalBets: number;
  totalWins: number;
  biggestWin: number;
  currentStreak: number;
  level: number;
  groupsOwned: number;
  groupsJoined: number;
}

async function computeStats(userId: string): Promise<UserStats> {
  const [user, totalBets, totalWins, biggest, groupsOwned, groupsJoined] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.bet.count({ where: { userId } }),
    prisma.bet.count({ where: { userId, status: "WON" } }),
    prisma.bet.aggregate({ where: { userId }, _max: { pointsWon: true } }),
    prisma.groupMember.count({ where: { userId, role: "OWNER" } }),
    prisma.groupMember.count({ where: { userId } }),
  ]);
  return {
    totalBets,
    totalWins,
    biggestWin: biggest._max.pointsWon ?? 0,
    currentStreak: user.currentStreak,
    level: user.level,
    groupsOwned,
    groupsJoined,
  };
}

type Threshold =
  | { type: "first_bet" }
  | { type: "first_win" }
  | { type: "wins"; value: number }
  | { type: "streak"; value: number }
  | { type: "level"; value: number }
  | { type: "big_win"; value: number }
  | { type: "groups_owned"; value: number }
  | { type: "groups_joined"; value: number };

function meets(t: Threshold, s: UserStats): boolean {
  switch (t.type) {
    case "first_bet":
      return s.totalBets >= 1;
    case "first_win":
      return s.totalWins >= 1;
    case "wins":
      return s.totalWins >= t.value;
    case "streak":
      return s.currentStreak >= t.value;
    case "level":
      return s.level >= t.value;
    case "big_win":
      return s.biggestWin >= t.value;
    case "groups_owned":
      return s.groupsOwned >= t.value;
    case "groups_joined":
      return s.groupsJoined >= t.value;
  }
}

export interface UnlockedAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export async function checkAchievements(userId: string): Promise<UnlockedAchievement[]> {
  const [all, alreadyOwned, stats] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
    computeStats(userId),
  ]);
  const ownedIds = new Set(alreadyOwned.map((a) => a.achievementId));

  const unlocked: UnlockedAchievement[] = [];
  for (const a of all) {
    if (ownedIds.has(a.id)) continue;
    let threshold: Threshold;
    try {
      threshold = JSON.parse(a.thresholdJSON) as Threshold;
    } catch {
      continue;
    }
    if (meets(threshold, stats)) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: a.id },
      });
      unlocked.push({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
      });
    }
  }
  return unlocked;
}
