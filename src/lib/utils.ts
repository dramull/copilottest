import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateLevel(xp: number): number {
  // Every 100 XP = 1 level, with increasing requirements
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 50;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const currentLevel = calculateLevel(xp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return { current: xp - currentLevelXp, needed: nextLevelXp - currentLevelXp, progress };
}

export function getDayOfWeek(date: Date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 7 : day; // Monday = 1, Sunday = 7
}
