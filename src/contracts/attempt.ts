import type { VersionedRef } from "./lesson.js";

export interface AiExecutionPin {
  provider: string;
  model: string;
  model_version: string;
  prompt_version: string;
  request_id: string;
  fallback_used: boolean;
}
export interface AttemptEnvelope {
  id: string;
  schema_version: string;
  idempotency_key: string;
  user_id: string;
  lesson_ref: VersionedRef;
  activity_ref: VersionedRef;
  objective_refs: VersionedRef[];
  rubric_version: string;
  status: "started" | "submitted" | "scored" | "failed";
  submitted_at: string;
  score?: number;
  ai_execution?: AiExecutionPin;
}
