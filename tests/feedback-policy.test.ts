import { describe, expect, it } from "vitest";
import {
  selectFeedback,
  type FeedbackCandidate,
} from "../src/core/feedback-policy.js";

const candidates: FeedbackCandidate[] = [
  { id: "minor", priority: "minor_accuracy", message: "Check the article." },
  { id: "target", priority: "target_language", message: "Use the target phrase." },
  { id: "task", priority: "task", message: "Answer the interview question directly." },
];

describe("selective feedback policy", () => {
  it("waits until the turn ends during fluency practice", () => {
    expect(selectFeedback(candidates, "fluency")).toMatchObject({
      timing: "after_turn",
      retryRequired: true,
    });
  });

  it("returns no more than two high-priority points", () => {
    expect(selectFeedback(candidates, "accuracy").items.map((item) => item.id)).toEqual([
      "task",
      "target",
    ]);
  });

  it("does not require a retry when no correction is needed", () => {
    expect(selectFeedback([], "accuracy")).toEqual({
      timing: "after_attempt",
      items: [],
      retryRequired: false,
    });
  });
});
