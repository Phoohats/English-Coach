import { Timestamp, type Firestore } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return { ...actual, ...firestoreMocks };
});

import {
  FirebaseLearnerProfileRepository,
  mapLearnerProfileDocument,
} from "../src/adapters/firebase/learner-profile.js";

const firestore = {} as Firestore;
const profileReference = { path: "learnerProfiles/synthetic-user" };
const timestamp = Timestamp.fromDate(new Date("2026-09-01T03:04:05.006Z"));
const storedProfile = {
  schemaVersion: 1,
  userId: "synthetic-user",
  displayName: "Synthetic Learner",
  currentLevel: "B1",
  createdAt: timestamp,
  updatedAt: timestamp,
};

function existingSnapshot(data = storedProfile) {
  return { exists: () => true, data: () => data };
}

beforeEach(() => {
  vi.clearAllMocks();
  firestoreMocks.doc.mockReturnValue(profileReference);
  firestoreMocks.serverTimestamp.mockReturnValue({ _sentinel: "server-timestamp" });
});

describe("FirebaseLearnerProfileRepository", () => {
  it("creates a profile with server timestamps and returns the mapped record", async () => {
    firestoreMocks.getDoc.mockResolvedValue(existingSnapshot());
    const repository = new FirebaseLearnerProfileRepository(firestore);

    await expect(
      repository.create({
        userId: "synthetic-user",
        displayName: "Synthetic Learner",
        currentLevel: "B1",
      }),
    ).resolves.toMatchObject({
      userId: "synthetic-user",
      createdAt: "2026-09-01T03:04:05.006Z",
    });

    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(profileReference, {
      schemaVersion: 1,
      userId: "synthetic-user",
      displayName: "Synthetic Learner",
      currentLevel: "B1",
      createdAt: { _sentinel: "server-timestamp" },
      updatedAt: { _sentinel: "server-timestamp" },
    });
  });

  it("returns null for a missing profile and rejects invalid user IDs", async () => {
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
    const repository = new FirebaseLearnerProfileRepository(firestore);

    await expect(repository.getByUserId("synthetic-user")).resolves.toBeNull();
    await expect(repository.getByUserId("")).rejects.toThrow("1-128 UTF-16 code units");
    await expect(repository.getByUserId("u".repeat(129))).rejects.toThrow("1-128 UTF-16 code units");
    await expect(repository.getByUserId("segment/child")).rejects.toThrow("must not contain a slash");
    await expect(repository.getByUserId("😀".repeat(64))).resolves.toBeNull();
    await expect(repository.getByUserId("😀".repeat(65))).rejects.toThrow("1-128 UTF-16 code units");
  });

  it("updates mutable fields with a server timestamp and returns the record", async () => {
    firestoreMocks.getDoc.mockResolvedValue(
      existingSnapshot({ ...storedProfile, displayName: "Updated Learner", currentLevel: "C1" }),
    );
    const repository = new FirebaseLearnerProfileRepository(firestore);

    await expect(
      repository.update("synthetic-user", {
        displayName: "Updated Learner",
        currentLevel: "C1",
      }),
    ).resolves.toMatchObject({ displayName: "Updated Learner", currentLevel: "C1" });
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith(profileReference, {
      displayName: "Updated Learner",
      currentLevel: "C1",
      updatedAt: { _sentinel: "server-timestamp" },
    });
  });

  it("fails closed for invalid inputs, missing writes, and malformed documents", async () => {
    const repository = new FirebaseLearnerProfileRepository(firestore);

    await expect(
      repository.create({
        userId: "synthetic-user",
        displayName: "",
        currentLevel: "A1",
      }),
    ).rejects.toThrow("Invalid learner profile create input");
    await expect(repository.update("synthetic-user", {})).rejects.toThrow(
      "Invalid learner profile update input",
    );

    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
    await expect(
      repository.create({
        userId: "synthetic-user",
        displayName: "Synthetic Learner",
        currentLevel: "A1",
      }),
    ).rejects.toThrow("Learner profile not found");

    expect(() => mapLearnerProfileDocument(null)).toThrow("Invalid learner profile document");
    expect(() =>
      mapLearnerProfileDocument({ ...storedProfile, createdAt: "not-a-timestamp" }),
    ).toThrow("must be Firestore Timestamps");
    expect(() =>
      mapLearnerProfileDocument({ ...storedProfile, displayName: "" }),
    ).toThrow("Invalid learner profile document");
  });
});
