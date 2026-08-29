import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020, type AnySchema, type ErrorObject } from "ajv/dist/2020.js";
import type { AttemptEnvelope } from "../contracts/attempt.js";
import {
  skillNames,
  type LessonActivity,
  type LessonDocument,
} from "../contracts/lesson.js";

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T; issues: [] }
  | { ok: false; issues: ValidationIssue[] };

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const lessonSchema = loadJson(`${projectRoot}spec/lesson.schema.json`);
const attemptSchema = loadJson(`${projectRoot}spec/attempt.schema.json`);
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateLessonSchema = ajv.compile(lessonSchema);
const validateAttemptSchema = ajv.compile(attemptSchema);

function loadJson(path: string): AnySchema {
  return JSON.parse(readFileSync(path, "utf8")) as AnySchema;
}

function schemaIssues(errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map((error) => ({
    path: error.instancePath || "/",
    code: `schema.${error.keyword}`,
    message: error.message ?? "Schema validation failed",
  }));
}

function issue(path: string, code: string, message: string): ValidationIssue {
  return { path, code, message };
}

function hasText(content: Record<string, unknown>, key: string): boolean {
  return typeof content[key] === "string" && content[key].trim().length > 0;
}

function hasArray(content: Record<string, unknown>, key: string): boolean {
  return Array.isArray(content[key]) && content[key].length > 0;
}

function hasPositiveNumber(content: Record<string, unknown>, key: string): boolean {
  return typeof content[key] === "number" && content[key] > 0;
}

function validateActivityContent(activity: LessonActivity, index: number): ValidationIssue[] {
  const path = `/activities/${index}/content`;
  const content = activity.content;
  const missing = (key: string) => issue(path, "content.required", `${activity.type} requires ${key}`);
  const issues: ValidationIssue[] = [];

  switch (activity.type) {
    case "scene_observe":
      if (!hasText(content, "image_alt")) issues.push(missing("image_alt"));
      break;
    case "listen_choose":
      if (!hasText(content, "audio_transcript")) issues.push(missing("audio_transcript"));
      if (!hasArray(content, "choices")) issues.push(missing("choices"));
      if (!hasText(content, "answer")) issues.push(missing("answer"));
      if (
        Array.isArray(content.choices) &&
        typeof content.answer === "string" &&
        !content.choices.includes(content.answer)
      ) {
        issues.push(issue(path, "content.answer", "listen_choose answer must be one of choices"));
      }
      break;
    case "listen_order":
      if (!hasText(content, "audio_transcript")) issues.push(missing("audio_transcript"));
      if (!hasArray(content, "answer_order")) issues.push(missing("answer_order"));
      break;
    case "speak_repeat":
      if (!hasText(content, "model")) issues.push(missing("model"));
      if (!hasArray(content, "focus")) issues.push(missing("focus"));
      break;
    case "speak_response":
      if (!hasPositiveNumber(content, "minimum_seconds")) issues.push(missing("minimum_seconds"));
      if (!hasPositiveNumber(content, "maximum_seconds")) issues.push(missing("maximum_seconds"));
      if (!hasArray(content, "required_sections")) issues.push(missing("required_sections"));
      break;
    case "read_match":
      if (!hasArray(content, "pairs")) issues.push(missing("pairs"));
      break;
    case "read_infer":
      if (!hasArray(content, "options")) issues.push(missing("options"));
      if (!hasPositiveNumber(content, "preferred_option")) issues.push(missing("preferred_option"));
      break;
    case "write_fill":
      if (!hasText(content, "answer")) issues.push(missing("answer"));
      if (!hasArray(content, "accepted_answers")) issues.push(missing("accepted_answers"));
      break;
    case "write_response":
      if (!hasPositiveNumber(content, "maximum_words")) issues.push(missing("maximum_words"));
      break;
    case "mediate_information":
      if (!hasText(content, "source")) issues.push(missing("source"));
      if (!hasText(content, "audience")) issues.push(missing("audience"));
      if (!hasArray(content, "required_points")) issues.push(missing("required_points"));
      if (!hasPositiveNumber(content, "maximum_words")) issues.push(missing("maximum_words"));
      break;
    case "roleplay":
      if (!hasText(content, "role")) issues.push(missing("role"));
      if (!hasPositiveNumber(content, "maximum_turns")) issues.push(missing("maximum_turns"));
      break;
    case "review_recall":
      if (!hasText(content, "prompt")) issues.push(missing("prompt"));
      break;
    case "exit_ticket":
      if (!hasArray(content, "required_functions") && !hasArray(content, "required_sections")) {
        issues.push(issue(path, "content.required", "exit_ticket requires required_functions or required_sections"));
      }
      break;
  }

  return issues;
}

function validateLessonRules(lesson: LessonDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const skillTotal = skillNames.reduce((total, skill) => total + lesson.skill_weights[skill], 0);

  if (skillTotal !== 100) {
    issues.push(issue("/skill_weights", "weights.total", `Skill weights total ${skillTotal}, expected 100`));
  }

  const rubricTotal = lesson.assessment.criteria.reduce((total, criterion) => total + criterion.weight, 0);
  if (rubricTotal !== 100) {
    issues.push(issue("/assessment/criteria", "weights.total", `Rubric weights total ${rubricTotal}, expected 100`));
  }

  if (
    lesson.difficulty_policy.lower_first_pass_accuracy >=
    lesson.difficulty_policy.upper_first_pass_accuracy
  ) {
    issues.push(
      issue(
        "/difficulty_policy",
        "difficulty.window",
        "Lower first-pass accuracy must be below upper first-pass accuracy",
      ),
    );
  }

  const intervals = lesson.review_policy.initial_intervals_minutes;
  const intervalsIncrease = intervals.every(
    (interval, index) => index === 0 || interval > intervals[index - 1]!,
  );
  if (!intervalsIncrease) {
    issues.push(
      issue(
        "/review_policy/initial_intervals_minutes",
        "review.intervals",
        "Review intervals must increase strictly",
      ),
    );
  }

  const objectiveIds = new Set(lesson.objectives.map((objective) => objective.id));
  const allIds = [...lesson.objectives.map((objective) => objective.id), ...lesson.activities.map((activity) => activity.id)];
  const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);

  for (const duplicateId of new Set(duplicateIds)) {
    issues.push(issue("/", "id.duplicate", `Duplicate identifier: ${duplicateId}`));
  }

  lesson.activities.forEach((activity, index) => {
    for (const objectiveId of activity.objective_ids) {
      if (!objectiveIds.has(objectiveId)) {
        issues.push(issue(`/activities/${index}/objective_ids`, "objective.unknown", `Unknown objective: ${objectiveId}`));
      }
    }
    issues.push(...validateActivityContent(activity, index));
  });

  const totalSeconds = lesson.activities.reduce((total, activity) => total + activity.duration_seconds, 0);
  const plannedSeconds = lesson.duration_minutes * 60;
  const durationDrift = Math.abs(totalSeconds - plannedSeconds) / plannedSeconds;
  if (durationDrift > 0.15) {
    issues.push(issue("/duration_minutes", "duration.drift", "Activity time differs from lesson duration by more than 15%"));
  }

  for (const skill of skillNames) {
    const skillSeconds = lesson.activities
      .filter((activity) => activity.primary_skill === skill)
      .reduce((total, activity) => total + activity.duration_seconds, 0);
    const actualShare = totalSeconds === 0 ? 0 : (skillSeconds / totalSeconds) * 100;
    if (Math.abs(actualShare - lesson.skill_weights[skill]) > 10) {
      issues.push(issue(`/skill_weights/${skill}`, "skill.drift", `${skill} differs from activity-time share by more than 10 points`));
    }
  }

  return issues;
}

export function validateLessonDocument(value: unknown): ValidationResult<LessonDocument> {
  if (!validateLessonSchema(value)) {
    return { ok: false, issues: schemaIssues(validateLessonSchema.errors) };
  }

  const lesson = value as LessonDocument;
  const issues = validateLessonRules(lesson);
  return issues.length === 0 ? { ok: true, value: lesson, issues: [] } : { ok: false, issues };
}

export function validateAttemptEnvelope(value: unknown): ValidationResult<AttemptEnvelope> {
  if (!validateAttemptSchema(value)) {
    return { ok: false, issues: schemaIssues(validateAttemptSchema.errors) };
  }

  const attempt = value as AttemptEnvelope;
  const timestamp = Date.parse(attempt.submitted_at);
  if (Number.isNaN(timestamp)) {
    return { ok: false, issues: [issue("/submitted_at", "date.invalid", "submitted_at must be an ISO date-time")] };
  }

  return { ok: true, value: attempt, issues: [] };
}
