import { readFileSync } from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";

export const PROJECT_ID = "demo-english-career-coach";
export const EMULATOR_HOST = "127.0.0.1";

export const EMULATORS = {
  hub: { host: EMULATOR_HOST, port: 4400 },
  logging: { host: EMULATOR_HOST, port: 4500 },
  functions: { host: EMULATOR_HOST, port: 5001 },
  firestore: { host: EMULATOR_HOST, port: 8080 },
  auth: { host: EMULATOR_HOST, port: 9099 },
  storage: { host: EMULATOR_HOST, port: 9199 },
} as const;

type EmulatorAddress = {
  host?: string;
  port?: number;
};

type FirebaseConfig = {
  firestore?: { indexes?: string; rules?: string };
  functions?: Array<{ codebase?: string; source?: string }>;
  storage?: { rules?: string };
  emulators?: {
    auth?: EmulatorAddress;
    firestore?: EmulatorAddress;
    functions?: EmulatorAddress;
    hub?: EmulatorAddress;
    logging?: EmulatorAddress;
    singleProjectMode?: boolean;
    storage?: EmulatorAddress;
    ui?: { enabled?: boolean };
  };
};

type FirebaseRc = {
  projects?: { default?: string };
};

function fail(message: string): never {
  throw new Error(`[firebase-test-safety] ${message}`);
}

function readJson<T>(relativeUrl: string): T {
  return JSON.parse(readFileSync(new URL(relativeUrl, import.meta.url), "utf8")) as T;
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    fail(`${label} must be ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertConfiguredAddress(
  actual: EmulatorAddress | undefined,
  expected: EmulatorAddress,
  label: string,
): void {
  assertEqual(actual?.host, expected.host, `${label}.host`);
  assertEqual(actual?.port, expected.port, `${label}.port`);
}

function assertRuntimeHost(name: string, expected: EmulatorAddress): void {
  assertEqual(process.env[name], `${expected.host}:${expected.port}`, name);
}

export function assertFirebaseEmulatorEnvironment(): void {
  const firebaseConfig = readJson<FirebaseConfig>("../../firebase.json");
  const firebaseRc = readJson<FirebaseRc>("../../.firebaserc");

  assertEqual(firebaseRc.projects?.default, PROJECT_ID, ".firebaserc projects.default");
  assertEqual(firebaseConfig.firestore?.rules, "firestore.rules", "firestore.rules path");
  assertEqual(
    firebaseConfig.firestore?.indexes,
    "firestore.indexes.json",
    "firestore.indexes path",
  );
  assertEqual(firebaseConfig.storage?.rules, "storage.rules", "storage.rules path");
  assertEqual(firebaseConfig.functions?.length, 1, "functions codebase count");
  assertEqual(firebaseConfig.functions?.[0]?.source, "functions", "functions source");
  assertEqual(firebaseConfig.functions?.[0]?.codebase, "default", "functions codebase");

  assertConfiguredAddress(firebaseConfig.emulators?.hub, EMULATORS.hub, "emulators.hub");
  assertConfiguredAddress(firebaseConfig.emulators?.logging, EMULATORS.logging, "emulators.logging");
  assertConfiguredAddress(firebaseConfig.emulators?.functions, EMULATORS.functions, "emulators.functions");
  assertConfiguredAddress(firebaseConfig.emulators?.firestore, EMULATORS.firestore, "emulators.firestore");
  assertConfiguredAddress(firebaseConfig.emulators?.auth, EMULATORS.auth, "emulators.auth");
  assertConfiguredAddress(firebaseConfig.emulators?.storage, EMULATORS.storage, "emulators.storage");
  assertEqual(firebaseConfig.emulators?.ui?.enabled, false, "emulators.ui.enabled");
  assertEqual(firebaseConfig.emulators?.singleProjectMode, true, "emulators.singleProjectMode");

  const runtimeProjectIds = [process.env.GCLOUD_PROJECT, process.env.GOOGLE_CLOUD_PROJECT].filter(
    (value): value is string => value !== undefined,
  );
  if (runtimeProjectIds.length === 0) {
    fail("GCLOUD_PROJECT or GOOGLE_CLOUD_PROJECT must be set by emulators:exec");
  }
  for (const runtimeProjectId of runtimeProjectIds) {
    assertEqual(runtimeProjectId, PROJECT_ID, "runtime project ID");
  }

  assertRuntimeHost("FIREBASE_AUTH_EMULATOR_HOST", EMULATORS.auth);
  assertRuntimeHost("FIREBASE_EMULATOR_HUB", EMULATORS.hub);
  assertRuntimeHost("FIRESTORE_EMULATOR_HOST", EMULATORS.firestore);
  assertRuntimeHost("FIREBASE_STORAGE_EMULATOR_HOST", EMULATORS.storage);
}

assertFirebaseEmulatorEnvironment();

export async function createRulesTestEnvironment() {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: EMULATORS.firestore.host,
      port: EMULATORS.firestore.port,
      rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8"),
    },
    storage: {
      host: EMULATORS.storage.host,
      port: EMULATORS.storage.port,
      rules: readFileSync(new URL("../../storage.rules", import.meta.url), "utf8"),
    },
  });
}
