import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import type { LearnerProfileRepository } from "../../application/ports/learner-profile-repository.js";
import {
  LEARNER_PROFILE_SCHEMA_VERSION,
  isCreateLearnerProfileInput,
  isLearnerProfile,
  isLearnerProfileUserId,
  isUpdateLearnerProfileInput,
  type CreateLearnerProfileInput,
  type LearnerProfile,
  type UpdateLearnerProfileInput,
} from "../../contracts/learner-profile.js";

const collectionName = "learnerProfiles";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertFirebaseUserId(userId: string): void {
  if (!isLearnerProfileUserId(userId)) {
    throw new TypeError("Learner profile userId must contain 1-128 UTF-16 code units");
  }
  if (userId.includes("/")) {
    throw new TypeError("Firebase learner profile userId must not contain a slash");
  }
}

export function mapLearnerProfileDocument(value: unknown): LearnerProfile {
  if (!isRecord(value)) {
    throw new TypeError("Invalid learner profile document");
  }

  const { createdAt, updatedAt } = value;
  if (!(createdAt instanceof Timestamp) || !(updatedAt instanceof Timestamp)) {
    throw new TypeError("Learner profile timestamps must be Firestore Timestamps");
  }

  const profile = {
    ...value,
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString(),
  };

  if (!isLearnerProfile(profile)) {
    throw new TypeError("Invalid learner profile document");
  }
  assertFirebaseUserId(profile.userId);

  return profile;
}

export class FirebaseLearnerProfileRepository implements LearnerProfileRepository {
  constructor(private readonly firestore: Firestore) {}

  async create(input: CreateLearnerProfileInput): Promise<LearnerProfile> {
    if (!isCreateLearnerProfileInput(input)) {
      throw new TypeError("Invalid learner profile create input");
    }
    assertFirebaseUserId(input.userId);

    const profileReference = doc(this.firestore, collectionName, input.userId);
    await setDoc(profileReference, {
      schemaVersion: LEARNER_PROFILE_SCHEMA_VERSION,
      userId: input.userId,
      displayName: input.displayName,
      currentLevel: input.currentLevel,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return this.getRequired(input.userId);
  }

  async getByUserId(userId: string): Promise<LearnerProfile | null> {
    assertFirebaseUserId(userId);
    const snapshot = await getDoc(doc(this.firestore, collectionName, userId));
    return snapshot.exists() ? mapLearnerProfileDocument(snapshot.data()) : null;
  }

  async update(
    userId: string,
    input: UpdateLearnerProfileInput,
  ): Promise<LearnerProfile> {
    assertFirebaseUserId(userId);
    if (!isUpdateLearnerProfileInput(input)) {
      throw new TypeError("Invalid learner profile update input");
    }

    await updateDoc(doc(this.firestore, collectionName, userId), {
      ...input,
      updatedAt: serverTimestamp(),
    });

    return this.getRequired(userId);
  }

  private async getRequired(userId: string): Promise<LearnerProfile> {
    const profile = await this.getByUserId(userId);
    if (profile === null) {
      throw new Error(`Learner profile not found for user ${userId}`);
    }
    return profile;
  }
}
