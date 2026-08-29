import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateAttemptEnvelope,
  validateLessonDocument,
} from "../src/validation/contracts.js";

function readExample(name: string): unknown {
  return JSON.parse(readFileSync(resolve("examples", name), "utf8")) as unknown;
}

describe("lesson contract", () => {
  it.each([
    "a1-introduction.lesson.json",
    "b1-career-introduction.lesson.json",
  ])("accepts %s", (name) => {
    expect(validateLessonDocument(readExample(name))).toMatchObject({ ok: true });
  });

  it("rejects skill weights that do not total 100", () => {
    const lesson = readExample("a1-introduction.lesson.json") as Record<string, unknown>;
    const changed = structuredClone(lesson) as {
      skill_weights: { listening: number };
    };
    changed.skill_weights.listening = 99;

    const result = validateLessonDocument(changed);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "weights.total" }),
      );
    }
  });

  it("rejects an activity that references an unknown objective", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      activities: Array<{ objective_ids: string[] }>;
    };
    lesson.activities[0]!.objective_ids = ["obj-missing"];

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "objective.unknown" }),
      );
    }
  });

  it("rejects duplicate objective and activity identifiers", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      objectives: Array<{ id: string }>;
      activities: Array<{ id: string }>;
    };
    lesson.activities[0]!.id = lesson.objectives[0]!.id;

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "id.duplicate" }),
      );
    }
  });

  it("rejects malformed activity-specific content", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      activities: Array<{ type: string; content: Record<string, unknown> }>;
    };
    const listeningActivity = lesson.activities.find(
      (activity) => activity.type === "listen_choose",
    );
    delete listeningActivity!.content.audio_transcript;

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "content.required" }),
      );
    }
  });

  it("rejects mediation without a source, audience, required points, and limit", () => {
    const lesson = structuredClone(readExample("b1-career-introduction.lesson.json")) as {
      activities: Array<{ type: string; content: Record<string, unknown> }>;
    };
    const mediationActivity = lesson.activities.find(
      (activity) => activity.type === "mediate_information",
    );
    mediationActivity!.content = {};

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.issues.filter((validationIssue) => validationIssue.code === "content.required"),
      ).toHaveLength(4);
    }
  });

  it("rejects a listen-choice answer that is not one of the choices", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      activities: Array<{ type: string; content: Record<string, unknown> }>;
    };
    const listeningActivity = lesson.activities.find(
      (activity) => activity.type === "listen_choose",
    );
    listeningActivity!.content.answer = "Unknown";

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "content.answer" }),
      );
    }
  });

  it("rejects recall and exit activities without required content", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      activities: Array<{ type: string; content: Record<string, unknown> }>;
    };
    lesson.activities[0]!.type = "review_recall";
    lesson.activities[0]!.content = {};
    lesson.activities.at(-1)!.content = {};

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.filter((validationIssue) => validationIssue.code === "content.required")).toHaveLength(2);
    }
  });

  it("rejects rubric weights that do not total 100", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      assessment: { criteria: Array<{ weight: number }> };
    };
    lesson.assessment.criteria[0]!.weight = 10;

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "weights.total", path: "/assessment/criteria" }),
      );
    }
  });

  it("rejects lesson duration drift over 15 percent", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      duration_minutes: number;
    };
    lesson.duration_minutes = 60;

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "duration.drift" }),
      );
    }
  });

  it("rejects skill weights that diverge from activity time", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      skill_weights: { listening: number; speaking: number };
    };
    lesson.skill_weights.listening = 40;
    lesson.skill_weights.speaking = 20;

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "skill.drift" }),
      );
    }
  });

  it("rejects an inverted first-pass difficulty window", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      difficulty_policy: {
        lower_first_pass_accuracy: number;
        upper_first_pass_accuracy: number;
      };
    };
    lesson.difficulty_policy.lower_first_pass_accuracy = 0.95;
    lesson.difficulty_policy.upper_first_pass_accuracy = 0.7;

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "difficulty.window" }),
      );
    }
  });

  it("rejects review intervals that do not increase", () => {
    const lesson = structuredClone(readExample("a1-introduction.lesson.json")) as {
      review_policy: { initial_intervals_minutes: number[] };
    };
    lesson.review_policy.initial_intervals_minutes = [10, 1_440, 60];

    const result = validateLessonDocument(lesson);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "review.intervals" }),
      );
    }
  });

  it("rejects values that do not match the base lesson schema", () => {
    const result = validateLessonDocument({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.code).toMatch(/^schema\./);
    }
  });
});

describe("attempt contract", () => {
  it("accepts an attempt with immutable version pins", () => {
    expect(validateAttemptEnvelope(readExample("attempt.example.json"))).toMatchObject({
      ok: true,
    });
  });

  it("rejects a scored attempt without a score", () => {
    const attempt = structuredClone(readExample("attempt.example.json")) as Record<
      string,
      unknown
    >;
    delete attempt.score;

    expect(validateAttemptEnvelope(attempt)).toMatchObject({ ok: false });
  });

  it("rejects an invalid submission timestamp", () => {
    const attempt = structuredClone(readExample("attempt.example.json")) as {
      submitted_at: string;
    };
    attempt.submitted_at = "not-a-date";

    const result = validateAttemptEnvelope(attempt);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "date.invalid" }),
      );
    }
  });
});
