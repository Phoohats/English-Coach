import type { NavigationItem, ReviewItem } from "./types.js";

export const navigationItems: NavigationItem[] = [
  { id: "today", label: "Today", mobileLabel: "Today" },
  { id: "lesson", label: "Learn", mobileLabel: "Learn" },
  { id: "speak", label: "Speak", mobileLabel: "Speak" },
  { id: "write", label: "Write", mobileLabel: "Write" },
  { id: "review", label: "Review", mobileLabel: "Review" },
  { id: "progress", label: "Progress", mobileLabel: "Growth" },
];

export const reviewItems: ReviewItem[] = [
  {
    id: "introduce-role",
    skill: "Speaking",
    title: "Introduce your current role",
    context: "New interviewer, no notes",
    stage: 2,
    dueLabel: "Due now",
    accent: "green",
  },
  {
    id: "achievement-detail",
    skill: "Listening",
    title: "Spot the measurable result",
    context: "Different speaker and project",
    stage: 3,
    dueLabel: "Due now",
    accent: "blue",
  },
  {
    id: "career-goal",
    skill: "Writing",
    title: "Connect experience to a goal",
    context: "Message to a hiring manager",
    stage: 1,
    dueLabel: "In 18 min",
    accent: "coral",
  },
];

export const skillProgress = [
  { name: "Listening", value: 72, detail: "B1 developing" },
  { name: "Speaking", value: 64, detail: "B1 developing" },
  { name: "Reading", value: 81, detail: "B1 strong" },
  { name: "Writing", value: 68, detail: "B1 developing" },
];

export const weekActivity = [
  { day: "M", minutes: 18 },
  { day: "T", minutes: 26 },
  { day: "W", minutes: 12 },
  { day: "T", minutes: 34 },
  { day: "F", minutes: 22 },
  { day: "S", minutes: 8 },
  { day: "S", minutes: 0 },
];
