import {
  deleteApp as deleteAdminApp,
  initializeApp as initializeAdminApp,
  type App as AdminApp,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import {
  deleteApp,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EMULATORS, PROJECT_ID } from "./setup";

const AUTH_EMULATOR_URL = `http://${EMULATORS.auth.host}:${EMULATORS.auth.port}`;
const USER_A = {
  email: "ecc-002-user-a@example.test",
  password: ["Synthetic", "Only", "Password", "A1!"].join("-"),
};
const USER_B = {
  email: "ecc-002-user-b@example.test",
  password: ["Synthetic", "Only", "Password", "B1!"].join("-"),
};

const clientApps: FirebaseApp[] = [];
let adminApp: AdminApp;
let clientAppSequence = 0;

async function clearAuthEmulator(): Promise<void> {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/emulator/v1/projects/${encodeURIComponent(PROJECT_ID)}/accounts`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw new Error(`Auth Emulator cleanup failed with HTTP ${response.status}`);
  }
}

function createClientAuth(label: string) {
  clientAppSequence += 1;
  const app = initializeApp(
    {
      apiKey: ["synthetic", "emulator", "api", "key"].join("-"),
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      projectId: PROJECT_ID,
    },
    `ecc-002-${label}-${clientAppSequence}`,
  );
  clientApps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  return auth;
}

beforeAll(async () => {
  await clearAuthEmulator();
  adminApp = initializeAdminApp({ projectId: PROJECT_ID }, "ecc-002-auth-test-admin");
});

afterAll(async () => {
  await clearAuthEmulator();
  await Promise.all(clientApps.map((app) => deleteApp(app)));
  await deleteAdminApp(adminApp);
});

describe("Auth Emulator", () => {
  it("creates, signs in, and signs out two distinct synthetic users", async () => {
    const authA = createClientAuth("user-a");
    const authB = createClientAuth("user-b");

    const createdA = await createUserWithEmailAndPassword(authA, USER_A.email, USER_A.password);
    const createdB = await createUserWithEmailAndPassword(authB, USER_B.email, USER_B.password);

    expect(createdA.user.uid).not.toBe(createdB.user.uid);

    await signOut(authA);
    await signOut(authB);
    expect(authA.currentUser).toBeNull();
    expect(authB.currentUser).toBeNull();

    const signedInA = await signInWithEmailAndPassword(authA, USER_A.email, USER_A.password);
    const signedInB = await signInWithEmailAndPassword(authB, USER_B.email, USER_B.password);
    const tokenA = await signedInA.user.getIdToken();
    const tokenB = await signedInB.user.getIdToken();

    expect(signedInA.user.uid).toBe(createdA.user.uid);
    expect(signedInB.user.uid).toBe(createdB.user.uid);
    expect(tokenA).not.toBe(tokenB);

    const decodedA = await getAdminAuth(adminApp).verifyIdToken(tokenA);
    const decodedB = await getAdminAuth(adminApp).verifyIdToken(tokenB);
    expect(decodedA.uid).toBe(createdA.user.uid);
    expect(decodedB.uid).toBe(createdB.user.uid);

    await signOut(authA);
    await signOut(authB);

    await expect(
      signInWithEmailAndPassword(authA, USER_A.email, "invalid-synthetic-password"),
    ).rejects.toMatchObject({ code: "auth/wrong-password" });

    await getAdminAuth(adminApp).updateUser(createdA.user.uid, { disabled: true });
    await expect(
      signInWithEmailAndPassword(authA, USER_A.email, USER_A.password),
    ).rejects.toMatchObject({ code: "auth/user-disabled" });
  });
});
