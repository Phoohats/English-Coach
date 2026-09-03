import {
  assertFails,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteObject,
  getBytes,
  getMetadata,
  listAll,
  ref,
  updateMetadata,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { createRulesTestEnvironment } from "./setup";

const SYNTHETIC_BYTES = new TextEncoder().encode("synthetic ECC-002 storage fixture");
const SYNTHETIC_UID = "synthetic-storage-user";

const LOCATIONS = [
  { label: "root", objectPath: "root-object.txt", listPath: "" },
  {
    label: "nested",
    objectPath: "learnerProfiles/synthetic-user/nested-object.txt",
    listPath: "learnerProfiles/synthetic-user",
  },
] as const;

const IDENTITIES = [
  {
    label: "anonymous",
    context: () => testEnv.unauthenticatedContext(),
  },
  {
    label: "authenticated",
    context: () => testEnv.authenticatedContext(SYNTHETIC_UID),
  },
] as const;

let testEnv: RulesTestEnvironment;

async function seedObject(objectPath: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context: RulesTestContext) => {
    await uploadBytes(ref(context.storage(), objectPath), SYNTHETIC_BYTES, {
      contentType: "text/plain",
      customMetadata: { fixture: "synthetic" },
    });
  });
}

function storageFor(contextFactory: () => RulesTestContext): FirebaseStorage {
  return contextFactory().storage();
}

beforeAll(async () => {
  testEnv = await createRulesTestEnvironment();
});

beforeEach(async () => {
  await testEnv.clearStorage();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe.each(IDENTITIES)("Storage default denial for $label users", ({ context }) => {
  it.each(LOCATIONS)("denies create at $label paths", async ({ objectPath }) => {
    const objectRef = ref(storageFor(context), objectPath);
    await assertFails(uploadBytes(objectRef, SYNTHETIC_BYTES));
  });

  it.each(LOCATIONS)("denies overwrite at $label paths", async ({ objectPath }) => {
    await seedObject(objectPath);
    const objectRef = ref(storageFor(context), objectPath);
    await assertFails(uploadBytes(objectRef, SYNTHETIC_BYTES));
  });

  it.each(LOCATIONS)("denies download at $label paths", async ({ objectPath }) => {
    await seedObject(objectPath);
    await assertFails(getBytes(ref(storageFor(context), objectPath)));
  });

  it.each(LOCATIONS)("denies metadata reads at $label paths", async ({ objectPath }) => {
    await seedObject(objectPath);
    await assertFails(getMetadata(ref(storageFor(context), objectPath)));
  });

  it.each(LOCATIONS)("denies list at $label paths", async ({ objectPath, listPath }) => {
    await seedObject(objectPath);
    const storage = storageFor(context);
    await assertFails(listAll(listPath === "" ? ref(storage) : ref(storage, listPath)));
  });

  it.each(LOCATIONS)("denies metadata updates at $label paths", async ({ objectPath }) => {
    await seedObject(objectPath);
    await assertFails(
      updateMetadata(ref(storageFor(context), objectPath), {
        customMetadata: { fixture: "modified-synthetic" },
      }),
    );
  });

  it.each(LOCATIONS)("denies delete at $label paths", async ({ objectPath }) => {
    await seedObject(objectPath);
    await assertFails(deleteObject(ref(storageFor(context), objectPath)));
  });
});
