export const pilotReviewIntervalsMinutes = [10, 1_440, 4_320, 10_080, 20_160, 43_200] as const;

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface ReviewState {
  stage: number;
  lapses: number;
  dueAt: string;
}
export function createReviewState(now: Date): ReviewState {
  return {
    stage: 0,
    lapses: 0,
    dueAt: addMinutes(now, pilotReviewIntervalsMinutes[0]),
  };
}

export function scheduleReview(
  current: ReviewState,
  grade: ReviewGrade,
  now: Date,
): ReviewState {
  const lastStage = pilotReviewIntervalsMinutes.length - 1;
  let stage = Math.min(Math.max(current.stage, 0), lastStage);
  let lapses = current.lapses;

  if (grade === "again") {
    stage = 0;
    lapses += 1;
  } else if (grade === "hard") {
    stage = Math.max(0, stage - 1);
  } else if (grade === "good") {
    stage = Math.min(lastStage, stage + 1);
  } else {
    stage = Math.min(lastStage, stage + 2);
  }

  return {
    stage,
    lapses,
    dueAt: addMinutes(now, pilotReviewIntervalsMinutes[stage]!),
  };
}

function addMinutes(date: Date, minutes: number): string {
  return new Date(date.getTime() + minutes * 60_000).toISOString();
}
