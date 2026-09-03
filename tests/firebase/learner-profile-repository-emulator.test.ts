import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { Firestore } from "firebase/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FirebaseLearnerProfileRepository } from "../../src/adapters/firebase/learner-profile.js";
import { createRulesTestEnvironment } from "./setup.js";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await createRulesTestEnvironment();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("FirebaseLearnerProfileRepository with Firestore emulator", () => {
  it("creates, reads, and updates a profile through enforced security rules", async () => {
    const userId = "repository-integration-owner";
    const firestore = testEnv.authenticatedContext(userId).firestore() as unknown as Firestore;
    const repository = new FirebaseLearnerProfileRepository(firestore);

    const created = await repository.create({
      userId,
      displayName: "Integration Learner",
      currentLevel: "B1",
    });
    expect(created).toMatchObject({
      schemaVersion: 1,
      userId,
      displayName: "Integration Learner",
      currentLevel: "B1",
    });
    expect(Date.parse(created.createdAt)).not.toBeNaN();

    await expect(repository.getByUserId(userId)).resolves.toEqual(created);
    await expect(
      repository.update(userId, { displayName: "Career Learner", currentLevel: "B2" }),
    ).resolves.toMatchObject({
      userId,
      displayName: "Career Learner",
      currentLevel: "B2",
      createdAt: created.createdAt,
    });
  });

  it("rejects Firebase-unsafe IDs before constructing a document path", async () => {
    const firestore = testEnv
      .authenticatedContext("safe-owner")
      .firestore() as unknown as Firestore;
    const repository = new FirebaseLearnerProfileRepository(firestore);

    await expect(
      repository.create({
        userId: "segment/child",
        displayName: "Unsafe Path",
        currentLevel: "A1",
      }),
    ).rejects.toThrow("must not contain a slash");
  });
});
