export const LEARNER_PROFILE_SCHEMA_VERSION = 1 as const;
export const LEARNER_PROFILE_USER_ID_MAX_LENGTH = 128;
export const LEARNER_PROFILE_DISPLAY_NAME_MAX_LENGTH = 80;

export const learnerProfileLevels = ["A1", "A2", "B1", "B2", "C1"] as const;

export type LearnerProfileLevel = (typeof learnerProfileLevels)[number];

export interface LearnerProfile {
  schemaVersion: typeof LEARNER_PROFILE_SCHEMA_VERSION;
  userId: string;
  displayName: string;
  currentLevel: LearnerProfileLevel;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLearnerProfileInput {
  userId: string;
  displayName: string;
  currentLevel: LearnerProfileLevel;
}

export interface UpdateLearnerProfileInput {
  displayName?: string;
  currentLevel?: LearnerProfileLevel;
}

const profileKeys = [
  "schemaVersion",
  "userId",
  "displayName",
  "currentLevel",
  "createdAt",
  "updatedAt",
] as const;
const createInputKeys = ["userId", "displayName", "currentLevel"] as const;
const updateInputKeys = ["displayName", "currentLevel"] as const;
const isoUtcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowedKeys.length && keys.every((key) => allowedKeys.includes(key));
}

function hasOnlyOptionalKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => allowedKeys.includes(key));
}

function isBoundedString(value: unknown, maximumLength: number): value is string {
  if (typeof value !== "string") return false;
  return value.length >= 1 && value.length <= maximumLength;
}

export function isLearnerProfileLevel(value: unknown): value is LearnerProfileLevel {
  return learnerProfileLevels.some((level) => level === value);
}

export function isLearnerProfileUserId(value: unknown): value is string {
  return isBoundedString(value, LEARNER_PROFILE_USER_ID_MAX_LENGTH);
}

export function isIsoUtcString(value: unknown): value is string {
  if (typeof value !== "string" || !isoUtcPattern.test(value)) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const normalized = parsed.toISOString();
  return value === normalized || value === normalized.replace(".000Z", "Z");
}

export function isCreateLearnerProfileInput(
  value: unknown,
): value is CreateLearnerProfileInput {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, createInputKeys) &&
    isLearnerProfileUserId(value.userId) &&
    isBoundedString(value.displayName, LEARNER_PROFILE_DISPLAY_NAME_MAX_LENGTH) &&
    isLearnerProfileLevel(value.currentLevel)
  );
}

export function isUpdateLearnerProfileInput(
  value: unknown,
): value is UpdateLearnerProfileInput {
  if (!isRecord(value) || !hasOnlyOptionalKeys(value, updateInputKeys)) return false;

  const hasDisplayName = Object.hasOwn(value, "displayName");
  const hasCurrentLevel = Object.hasOwn(value, "currentLevel");
  return (
    (!hasDisplayName ||
      isBoundedString(value.displayName, LEARNER_PROFILE_DISPLAY_NAME_MAX_LENGTH)) &&
    (!hasCurrentLevel || isLearnerProfileLevel(value.currentLevel))
  );
}

export function isLearnerProfile(value: unknown): value is LearnerProfile {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, profileKeys) &&
    value.schemaVersion === LEARNER_PROFILE_SCHEMA_VERSION &&
    isLearnerProfileUserId(value.userId) &&
    isBoundedString(value.displayName, LEARNER_PROFILE_DISPLAY_NAME_MAX_LENGTH) &&
    isLearnerProfileLevel(value.currentLevel) &&
    isIsoUtcString(value.createdAt) &&
    isIsoUtcString(value.updatedAt)
  );
}
