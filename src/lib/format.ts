import { DEMO_TODAY } from "../data/program.ts";
import type { Placement } from "../types.ts";

export function formatManYen(yen: number): string {
  const man = Math.round(yen / 10000);
  return `${man.toLocaleString("ja-JP")}万円`;
}

export function formatYen(yen: number): string {
  return `${yen.toLocaleString("ja-JP")}円`;
}

export function formatSlash(iso: string): string {
  return iso.replaceAll("-", "/");
}

export function formatDate(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${month}月${day}日`;
}

export function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysBetween(start: string, end: string): number {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  const a = Date.UTC(ys, ms - 1, ds);
  const b = Date.UTC(ye, me - 1, de);
  return Math.round((b - a) / 86400000);
}

export function placementDays(placement: Placement): number {
  const end =
    placement.stage === "ended" ? (placement.endedOn ?? DEMO_TODAY) : DEMO_TODAY;
  return Math.max(0, daysBetween(placement.startDate, end));
}

export function clip(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
