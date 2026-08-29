export type FeedbackPriority =
  | "task"
  | "intelligibility"
  | "target_language"
  | "minor_accuracy";

export interface FeedbackCandidate {
  id: string;
  priority: FeedbackPriority;
  message: string;
}
export interface SelectedFeedback {
  timing: "after_turn" | "after_attempt";
  items: FeedbackCandidate[];
  retryRequired: boolean;
}

const priorityOrder: FeedbackPriority[] = [
  "task",
  "intelligibility",
  "target_language",
  "minor_accuracy",
];

export function selectFeedback(
  candidates: FeedbackCandidate[],
  mode: "fluency" | "accuracy",
): SelectedFeedback {
  const items = [...candidates]
    .sort((left, right) => priorityOrder.indexOf(left.priority) - priorityOrder.indexOf(right.priority))
    .slice(0, 2);

  return {
    timing: mode === "fluency" ? "after_turn" : "after_attempt",
    items,
    retryRequired: items.length > 0,
  };
}
