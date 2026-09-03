import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { mapLearnerProfileDocument } from "../src/adapters/firebase/learner-profile.js";
import {
  isCreateLearnerProfileInput,
  isLearnerProfile,
  isLearnerProfileLevel,
  isLearnerProfileUserId,
  isUpdateLearnerProfileInput,
  learnerProfileLevels,
  type LearnerProfile,
} from "../src/contracts/learner-profile.js";

const timestamp = "2026-09-01T03:04:05.006Z";

function profile(overrides: Partial<LearnerProfile> = {}): LearnerProfile {
  return {
    schemaVersion: 1,
    userId: "synthetic-user",
    displayName: "Synthetic Learner",
    currentLevel: "A1",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFiles(path);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("learner profile contract", () => {
  it("accepts minimum and maximum string lengths", () => {
    expect(isLearnerProfile(profile({ userId: "u", displayName: "n" }))).toBe(true);
    expect(
      isLearnerProfile(
        profile({
          userId: "u".repeat(128),
          displayName: "n".repeat(80),
        }),
      ),
    ).toBe(true);
  });

  it("rejects each string limit at max plus one", () => {
    expect(isLearnerProfile(profile({ userId: "u".repeat(129) }))).toBe(false);
    expect(isLearnerProfile(profile({ displayName: "n".repeat(81) }))).toBe(false);
  });

  it("uses UTF-16 limits without leaking provider path policy into the contract", () => {
    expect(isLearnerProfileUserId("😀".repeat(64))).toBe(true);
    expect(isLearnerProfileUserId("😀".repeat(65))).toBe(false);
    expect(isLearnerProfileUserId("segment/child")).toBe(true);
    expect(
      isCreateLearnerProfileInput({
        userId: "segment/child",
        displayName: "Synthetic Learner",
        currentLevel: "A1",
      }),
    ).toBe(true);
  });

  it.each(learnerProfileLevels)("accepts the supported %s level", (currentLevel) => {
    expect(isLearnerProfileLevel(currentLevel)).toBe(true);
    expect(isLearnerProfile(profile({ currentLevel }))).toBe(true);
  });

  it("rejects unsupported levels", () => {
    expect(isLearnerProfileLevel("C2")).toBe(false);
    expect(isLearnerProfile({ ...profile(), currentLevel: "C2" })).toBe(false);
  });

  it.each(["not-a-date", "2026-02-30T00:00:00.000Z", "2026-09-01T10:04:05.006+07:00"])(
    "rejects invalid or non-UTC ISO timestamp %s",
    (invalidTimestamp) => {
      expect(isLearnerProfile(profile({ createdAt: invalidTimestamp }))).toBe(false);
      expect(isLearnerProfile(profile({ updatedAt: invalidTimestamp }))).toBe(false);
    },
  );

  it("validates provider-neutral create and update inputs", () => {
    expect(
      isCreateLearnerProfileInput({
        userId: "u",
        displayName: "n",
        currentLevel: "B2",
      }),
    ).toBe(true);
    expect(isUpdateLearnerProfileInput({ displayName: "Updated" })).toBe(true);
    expect(isUpdateLearnerProfileInput({ currentLevel: "C1" })).toBe(true);
    expect(isUpdateLearnerProfileInput({})).toBe(false);
    expect(isUpdateLearnerProfileInput({ displayName: undefined })).toBe(false);
    expect(isUpdateLearnerProfileInput({ userId: "immutable" })).toBe(false);
  });
});

describe("Firebase learner profile adapter", () => {
  it("maps Firestore Timestamps to provider-neutral ISO UTC strings", () => {
    const createdAt = Timestamp.fromDate(new Date("2026-08-30T01:02:03.004Z"));
    const updatedAt = Timestamp.fromDate(new Date("2026-09-01T03:04:05.006Z"));

    expect(
      mapLearnerProfileDocument({
        schemaVersion: 1,
        userId: "synthetic-user",
        displayName: "Synthetic Learner",
        currentLevel: "B1",
        createdAt,
        updatedAt,
      }),
    ).toEqual({
      schemaVersion: 1,
      userId: "synthetic-user",
      displayName: "Synthetic Learner",
      currentLevel: "B1",
      createdAt: "2026-08-30T01:02:03.004Z",
      updatedAt: "2026-09-01T03:04:05.006Z",
    });
  });

  it("keeps Firebase imports and timestamp sentinels inside the adapter", () => {
    const sourceRoot = resolve("src");
    const firebaseImporters = typescriptFiles(sourceRoot)
      .filter((path) => readFileSync(path, "utf8").includes('from "firebase/firestore"'))
      .map((path) => relative(resolve(), path).replaceAll("\\", "/"));
    const adapterPath = resolve("src/adapters/firebase/learner-profile.ts");
    const adapterSource = readFileSync(adapterPath, "utf8");

    expect(firebaseImporters).toEqual(["src/adapters/firebase/learner-profile.ts"]);
    expect(adapterSource).toContain('from "firebase/firestore"');
    expect(adapterSource.match(/serverTimestamp\(\)/g)).toHaveLength(3);
  });
});
