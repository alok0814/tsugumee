import { DEMO_TODAY, STAGES } from "../data/program.ts";
import type { AppData, Placement, Report, Stage } from "../types.ts";
import { clip, daysBetween, placementDays } from "./format.ts";

export function traineeOf(data: AppData, traineeId: string) {
  return data.trainees.find((trainee) => trainee.id === traineeId);
}

export function placementOf(data: AppData, placementId: string) {
  return data.placements.find((placement) => placement.id === placementId);
}

export function reportsFor(data: AppData, placementId: string): Report[] {
  return data.reports
    .filter((report) => report.placementId === placementId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function latestReportLine(reports: Report[]): string {
  if (reports.length === 0) return "日報はまだない";
  const latest = reports[reports.length - 1];
  return clip(latest.body.replaceAll("\n", ""), 42);
}

export function attentionLabel(placement: Placement): string | null {
  if (placement.stage === "ended") return null;
  const days = daysBetween(placement.startDate, DEMO_TODAY);
  const over = placement.stage === 1 && days > 60;
  const simple = placement.simpleWorkOnly;
  if (over && simple) return "段階1が60日超 · 単純作業だけ";
  if (over) return "段階1が60日超";
  if (simple) return "単純作業だけ";
  return null;
}

export function columnGate(placements: Placement[], stage: Stage): string | null {
  if (stage === "ended") return null;
  const dates = placements
    .filter((placement) => placement.stage === stage && placement.gateDate)
    .map((placement) => placement.gateDate as string)
    .sort();
  return dates[0] ?? null;
}

export function activePlacements(data: AppData): Placement[] {
  return data.placements.filter((placement) => placement.stage !== "ended");
}

export function stageLabel(stage: Stage): string {
  if (stage === "ended") return "終了";
  return STAGES.find((item) => item.id === stage)?.name ?? "";
}

export function dayLabel(placement: Placement): string {
  const days = placementDays(placement);
  if (placement.stage === "ended") {
    return `${days}日で終了`;
  }
  return `修行${days}日`;
}
