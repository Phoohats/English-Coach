import { describe, expect, it } from "vitest";
import {
  createReviewState,
  pilotReviewIntervalsMinutes,
  scheduleReview,
} from "../src/core/review-scheduler.js";

const now = new Date("2026-08-29T00:00:00.000Z");

describe("adaptive review scheduler", () => {
  it("starts with a short retrieval interval", () => {
    expect(createReviewState(now)).toEqual({
      stage: 0,
      lapses: 0,
      dueAt: "2026-08-29T00:10:00.000Z",
    });
  });

  it("advances one stage after a good retrieval", () => {
    const next = scheduleReview(createReviewState(now), "good", now);

    expect(next.stage).toBe(1);
    expect(next.dueAt).toBe("2026-08-30T00:00:00.000Z");
  });

  it("resets and records a lapse after failed retrieval", () => {
    const next = scheduleReview(
      { stage: 4, lapses: 1, dueAt: now.toISOString() },
      "again",
      now,
    );

    expect(next).toMatchObject({ stage: 0, lapses: 2 });
  });

  it("moves back one stage after a hard retrieval", () => {
    expect(
      scheduleReview({ stage: 3, lapses: 0, dueAt: now.toISOString() }, "hard", now).stage,
    ).toBe(2);
  });

  it("advances two stages after an easy retrieval and caps at the final stage", () => {
    const finalStage = pilotReviewIntervalsMinutes.length - 1;
    const next = scheduleReview(
      { stage: finalStage, lapses: 0, dueAt: now.toISOString() },
      "easy",
      now,
    );

    expect(next.stage).toBe(finalStage);
  });
});
