export type ViewId = "today" | "lesson" | "speak" | "write" | "review" | "progress";

export interface NavigationItem {
  id: ViewId;
  label: string;
  mobileLabel: string;
}

export interface ReviewItem {
  id: string;
  skill: "Listening" | "Speaking" | "Reading" | "Writing";
  title: string;
  context: string;
  stage: number;
  dueLabel: string;
  accent: "green" | "blue" | "amber" | "coral";
}
