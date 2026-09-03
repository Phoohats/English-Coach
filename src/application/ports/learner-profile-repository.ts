import type {
  CreateLearnerProfileInput,
  LearnerProfile,
  UpdateLearnerProfileInput,
} from "../../contracts/learner-profile.js";

export interface LearnerProfileRepository {
  create(input: CreateLearnerProfileInput): Promise<LearnerProfile>;
  getByUserId(userId: string): Promise<LearnerProfile | null>;
  update(userId: string, input: UpdateLearnerProfileInput): Promise<LearnerProfile>;
}
