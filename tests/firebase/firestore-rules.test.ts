import {
  assertFails,
  assertSucceeds,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createRulesTestEnvironment } from "./setup";

const PROFILE_FIELDS = [
  "schemaVersion",
  "userId",
  "displayName",
  "currentLevel",
  "createdAt",
  "updatedAt",
] as const;

const WRONG_TYPE_CASES: ReadonlyArray<{ field: string; value: unknown }> = [
  { field: "schemaVersion", value: "1" },
  { field: "userId", value: 1 },
  { field: "displayName", value: 1 },
  { field: "currentLevel", value: 1 },
  { field: "createdAt", value: "2026-01-01T00:00:00.000Z" },
  { field: "updatedAt", value: "2026-01-01T00:00:00.000Z" },
];

const CREATE_REJECTION_CASES: ReadonlyArray<{
  label: string;
  override: Record<string, unknown>;
  uid: string;
}> = [
  { label: "empty displayName", uid: "synthetic-owner", override: { displayName: "" } },
  {
    label: "displayName at max + 1",
    uid: "synthetic-owner",
    override: { displayName: "n".repeat(81) },
  },
  { label: "empty userId", uid: "synthetic-owner", override: { userId: "" } },
  {
    label: "userId at max + 1",
    uid: "u".repeat(129),
    override: { userId: "u".repeat(129) },
  },
  { label: "unsupported level", uid: "synthetic-owner", override: { currentLevel: "C2" } },
  {
    label: "unsupported schema version",
    uid: "synthetic-owner",
    override: { schemaVersion: 2 },
  },
  { label: "unknown field", uid: "synthetic-owner", override: { unexpected: true } },
];

const IMMUTABLE_CHANGE_CASES: ReadonlyArray<{
  change: Record<string, unknown>;
  field: string;
}> = [
  { field: "schemaVersion", change: { schemaVersion: 2 } },
  { field: "userId", change: { userId: "different-user" } },
  { field: "createdAt", change: { createdAt: serverTimestamp() } },
];

const INVALID_UPDATE_CASES: ReadonlyArray<{
  change: Record<string, unknown>;
  label: string;
}> = [
  { label: "empty displayName", change: { displayName: "" } },
  { label: "displayName at max + 1", change: { displayName: "n".repeat(81) } },
  { label: "unsupported level", change: { currentLevel: "C2" } },
  { label: "unknown field", change: { unexpected: true } },
  {
    label: "stale updatedAt",
    change: { updatedAt: Timestamp.fromMillis(1_700_000_000_000) },
  },
];

let testEnv: RulesTestEnvironment;

function createProfile(userId: string, displayName = "Synthetic Learner") {
  return {
    schemaVersion: 1,
    userId,
    displayName,
    currentLevel: "A1",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function seedProfile(userId: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context: RulesTestContext) => {
    await setDoc(doc(context.firestore(), "learnerProfiles", userId), {
      schemaVersion: 1,
      userId,
      displayName: "Synthetic Learner",
      currentLevel: "A1",
      createdAt: Timestamp.fromMillis(1_700_000_000_000),
      updatedAt: Timestamp.fromMillis(1_700_000_000_000),
    });
  });
}

beforeAll(async () => {
  testEnv = await createRulesTestEnvironment();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("learnerProfiles owner access", () => {
  it("allows owner create and get at minimum field lengths", async () => {
    const uid = "u";
    const db = testEnv.authenticatedContext(uid).firestore();
    const profileRef = doc(db, "learnerProfiles", uid);

    await assertSucceeds(setDoc(profileRef, createProfile(uid, "x")));
    const snapshot = await assertSucceeds(getDoc(profileRef));

    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()?.userId).toBe(uid);
    expect(snapshot.data()?.displayName).toBe("x");
  });

  it("allows owner create and update at maximum field lengths", async () => {
    const uid = "u".repeat(128);
    const db = testEnv.authenticatedContext(uid).firestore();
    const profileRef = doc(db, "learnerProfiles", uid);

    await assertSucceeds(setDoc(profileRef, createProfile(uid, "n".repeat(80))));
    const createdAt = (await getDoc(profileRef)).data()?.createdAt as Timestamp;

    await assertSucceeds(
      updateDoc(profileRef, {
        displayName: "z".repeat(80),
        currentLevel: "C1",
        updatedAt: serverTimestamp(),
      }),
    );

    const updated = await getDoc(profileRef);
    expect(updated.data()?.displayName).toBe("z".repeat(80));
    expect(updated.data()?.currentLevel).toBe("C1");
    expect((updated.data()?.createdAt as Timestamp).isEqual(createdAt)).toBe(true);
  });

  it("uses the same UTF-16 boundaries as the application contract", async () => {
    const maximumUid = "😀".repeat(64);
    const maximumDb = testEnv.authenticatedContext(maximumUid).firestore();
    await assertSucceeds(
      setDoc(
        doc(maximumDb, "learnerProfiles", maximumUid),
        createProfile(maximumUid, "😀".repeat(40)),
      ),
    );

    const oversizedUid = "😀".repeat(65);
    const oversizedUidDb = testEnv.authenticatedContext(oversizedUid).firestore();
    await assertFails(
      setDoc(
        doc(oversizedUidDb, "learnerProfiles", oversizedUid),
        createProfile(oversizedUid),
      ),
    );

    const displayOwner = "emoji-display-owner";
    const displayDb = testEnv.authenticatedContext(displayOwner).firestore();
    await assertFails(
      setDoc(
        doc(displayDb, "learnerProfiles", displayOwner),
        createProfile(displayOwner, "😀".repeat(41)),
      ),
    );
  });

  it.each(["A1", "A2", "B1", "B2", "C1"])("allows the supported %s level", async (level) => {
    const uid = `level-${level}`;
    const db = testEnv.authenticatedContext(uid).firestore();

    await assertSucceeds(
      setDoc(doc(db, "learnerProfiles", uid), {
        ...createProfile(uid),
        currentLevel: level,
      }),
    );
  });

  it("denies anonymous create, get, update, and delete", async () => {
    const uid = "synthetic-owner";
    await seedProfile(uid);
    const db = testEnv.unauthenticatedContext().firestore();
    const profileRef = doc(db, "learnerProfiles", uid);

    await assertFails(setDoc(doc(db, "learnerProfiles", "anonymous"), createProfile("anonymous")));
    await assertFails(getDoc(profileRef));
    await assertFails(updateDoc(profileRef, { displayName: "Anonymous", updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(profileRef));
  });

  it("denies cross-user create, get, update, and delete", async () => {
    const ownerUid = "synthetic-owner";
    const otherDb = testEnv.authenticatedContext("synthetic-other").firestore();
    await seedProfile(ownerUid);
    const profileRef = doc(otherDb, "learnerProfiles", ownerUid);

    await assertFails(setDoc(doc(otherDb, "learnerProfiles", "target-user"), createProfile("target-user")));
    await assertFails(getDoc(profileRef));
    await assertFails(updateDoc(profileRef, { displayName: "Other", updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(profileRef));
  });

  it("denies an owner targeting another UID and a spoofed userId", async () => {
    const uid = "synthetic-owner";
    const db = testEnv.authenticatedContext(uid).firestore();

    await assertFails(
      setDoc(doc(db, "learnerProfiles", "different-user"), createProfile("different-user")),
    );
    await assertFails(
      setDoc(doc(db, "learnerProfiles", uid), createProfile("spoofed-user")),
    );
  });
});

describe("learnerProfiles create validation", () => {
  it.each(PROFILE_FIELDS)("denies a document missing %s", async (missingField) => {
    const uid = `missing-${missingField}`;
    const db = testEnv.authenticatedContext(uid).firestore();
    const profile = createProfile(uid) as Record<string, unknown>;
    delete profile[missingField];

    await assertFails(setDoc(doc(db, "learnerProfiles", uid), profile));
  });

  it.each(WRONG_TYPE_CASES)("denies the wrong type for $field", async ({ field, value }) => {
    const uid = `wrong-type-${field}`;
    const db = testEnv.authenticatedContext(uid).firestore();
    const profile = createProfile(uid) as Record<string, unknown>;
    profile[field] = value;

    await assertFails(setDoc(doc(db, "learnerProfiles", uid), profile));
  });

  it.each(CREATE_REJECTION_CASES)("denies $label", async ({ uid, override }) => {
    const db = testEnv.authenticatedContext(uid).firestore();
    const profile = { ...createProfile(uid), ...override };

    await assertFails(setDoc(doc(db, "learnerProfiles", uid), profile));
  });

  it("denies client timestamps that do not equal request.time", async () => {
    const uid = "synthetic-owner";
    const db = testEnv.authenticatedContext(uid).firestore();

    await assertFails(
      setDoc(doc(db, "learnerProfiles", uid), {
        ...createProfile(uid),
        createdAt: Timestamp.fromMillis(1_700_000_000_000),
        updatedAt: Timestamp.fromMillis(1_700_000_000_000),
      }),
    );
  });
});

describe("learnerProfiles update validation", () => {
  it.each(IMMUTABLE_CHANGE_CASES)("denies changes to immutable $field", async ({ field, change }) => {
    const uid = `immutable-${field}`;
    await seedProfile(uid);
    const db = testEnv.authenticatedContext(uid).firestore();

    await assertFails(
      updateDoc(doc(db, "learnerProfiles", uid), {
        ...change,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it.each(INVALID_UPDATE_CASES)("denies $label", async ({ label, change }) => {
    const uid = `invalid-update-${label.replaceAll(" ", "-")}`;
    await seedProfile(uid);
    const db = testEnv.authenticatedContext(uid).firestore();

    await assertFails(
      updateDoc(doc(db, "learnerProfiles", uid), {
        ...change,
        ...("updatedAt" in change ? {} : { updatedAt: serverTimestamp() }),
      }),
    );
  });
});

describe("Firestore default denial", () => {
  it("denies owner and anonymous collection queries", async () => {
    await seedProfile("synthetic-owner");
    const ownerDb = testEnv.authenticatedContext("synthetic-owner").firestore();
    const anonymousDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDocs(collection(ownerDb, "learnerProfiles")));
    await assertFails(getDocs(collection(anonymousDb, "learnerProfiles")));
  });

  it("denies owner delete", async () => {
    const uid = "synthetic-owner";
    await seedProfile(uid);
    const db = testEnv.authenticatedContext(uid).firestore();

    await assertFails(deleteDoc(doc(db, "learnerProfiles", uid)));
  });

  it("denies unmatched document paths", async () => {
    const db = testEnv.authenticatedContext("synthetic-owner").firestore();
    const unknownRef = doc(db, "unknownCollection", "unknownDocument");

    await assertFails(setDoc(unknownRef, { synthetic: true }));
    await assertFails(getDoc(unknownRef));
  });
});
