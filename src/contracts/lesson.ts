export const skillNames = [
  "listening",
  "speaking",
  "reading",
  "writing",
  "review",
] as const;

export type SkillName = (typeof skillNames)[number];
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";
export type ContentStatus = "draft" | "reviewed" | "published" | "retired";

export interface VersionedRef {
  id: string;
  version: string;
}

export interface LessonObjective extends VersionedRef {
  can_do: string;
  competency: string;
  mastery_threshold: number;
}

export interface LessonActivity extends VersionedRef {
  type: string;
  primary_skill: SkillName;
  duration_seconds: number;
  objective_ids: string[];
  instruction_en: string;
  instruction_th?: string;
  content: Record<string, unknown>;
  feedback_mode: "deterministic" | "rubric" | "coaching" | "none";
  max_attempts: number;
}

export interface LessonDocument extends VersionedRef {
  status: ContentStatus;
  level: CefrLevel;
  unit_id: string;
  title: string;
  duration_minutes: number;
  skill_weights: Record<SkillName, number>;
  objectives: LessonObjective[];
  language_scope: {
    functions: string[];
    vocabulary: string[];
    chunks: string[];
    grammar: string[];
    thai_support: "default" | "optional" | "on_request" | "none";
  };
  difficulty_policy: {
    calibration_status: "pilot_default" | "calibrated";
    lower_first_pass_accuracy: number;
    upper_first_pass_accuracy: number;
    successes_before_fade: number;
    support_steps: string[];
  };
  feedback_policy: {
    fluency_timing: "after_turn";
    accuracy_timing: "after_attempt";
    max_focus_points: number;
    priority: Array<"task" | "intelligibility" | "target_language" | "minor_accuracy">;
    retry_required: boolean;
  };
  review_policy: {
    scheduler_version: string;
    calibration_status: "pilot_default" | "calibrated";
    initial_intervals_minutes: number[];
    adaptive: true;
    retrieval_required: true;
    transfer_variant_required: true;
  };
  learner_agency: {
    choice_points: Array<{ id: string; prompt: string; options: string[] }>;
    competence_signal: string;
    reflection_prompt: string;
    relatedness_options: Array<
      "ai_roleplay" | "trusted_person_practice" | "peer_practice" | "mentor_feedback"
    >;
  };
  activities: LessonActivity[];
  assessment: {
    rubric_version: string;
    pass_threshold: number;
    calibration_status: "provisional" | "piloted" | "calibrated";
    minimum_independent_samples: number;
    delayed_check_required: true;
    criteria: Array<{ id: string; description: string; weight: number }>;
    retry_policy: "immediate_guided" | "after_feedback" | "scheduled_review";
  };
  ai_policy: {
    prompt_version: string;
    allowed: string[];
    forbidden: string[];
    fallback: string;
  };
  accessibility: {
    transcripts_required: boolean;
    alt_text_required: boolean;
    non_audio_alternative: string;
  };
}
