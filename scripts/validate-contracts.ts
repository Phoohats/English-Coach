import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  validateAttemptEnvelope,
  validateLessonDocument,
  type ValidationIssue,
} from "../src/validation/contracts.js";

const examplesDirectory = resolve("examples");
const lessonFiles = readdirSync(examplesDirectory).filter((name) => name.endsWith(".lesson.json"));
let failed = false;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function report(name: string, issues: ValidationIssue[]): void {
  failed = true;
  console.error(`${name}: invalid`);
  for (const validationIssue of issues) {
    console.error(`  ${validationIssue.path} [${validationIssue.code}] ${validationIssue.message}`);
  }
}

for (const lessonFile of lessonFiles) {
  const result = validateLessonDocument(readJson(resolve(examplesDirectory, lessonFile)));
  if (result.ok) {
    console.log(`${lessonFile}: valid`);
  } else {
    report(lessonFile, result.issues);
  }
}

const attemptFile = "attempt.example.json";
const attemptResult = validateAttemptEnvelope(readJson(resolve(examplesDirectory, attemptFile)));
if (attemptResult.ok) {
  console.log(`${attemptFile}: valid`);
} else {
  report(attemptFile, attemptResult.issues);
}

if (failed) {
  process.exitCode = 1;
}
