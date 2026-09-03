import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  decodeRepositoryText,
  filesBelow,
  projectRoot,
  readRepositoryText,
} from "./repository-text.mjs";

const rootArgumentIndex = process.argv.indexOf("--root");
const scanRoot = rootArgumentIndex === -1 ? projectRoot : process.argv[rootArgumentIndex + 1];
if (!scanRoot) throw new Error("Repository policy scanner --root requires a directory");

const allowedProjectId = "demo-english-career-coach";
const allowedProjectReferences = new Set(["PROJECT_ID", "allowedProjectId", "firebaseProjectId"]);
const projectNames =
  "projectId|firebaseProjectId|project_id|PROJECT_ID|GCLOUD_PROJECT|GOOGLE_CLOUD_PROJECT|FIREBASE_PROJECT_ID";
const projectAssignmentPattern = new RegExp(
  `\\b(?:${projectNames})\\b["']?\\s*[:=]\\s*([^\\r\\n,;}]+)`,
  "g",
);
const arrayProjectArgumentPattern = /["'](?:--project|-P)["']\s*,\s*([^\r\n,\]]+)/g;
const shellProjectArgumentPattern = /(?:--project|-P)(?:=|\s+)([^\s;&|]+)/g;
const gcloudProjectPattern = /gcloud\s+config\s+set\s+project\s+([^\s;&|]+)/g;

function unwrapSimpleTarget(expression) {
  const value = expression.trim();
  const quoted = value.match(/^["'`]([A-Za-z0-9_-]+)["'`]$/);
  if (quoted?.[1]) return quoted[1];
  return /^[A-Za-z0-9_-]+$/.test(value) ? value : undefined;
}

function detectedProjectTargets(content) {
  const targets = [];
  for (const pattern of [projectAssignmentPattern, gcloudProjectPattern]) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      if (!match[1]) continue;
      targets.push(unwrapSimpleTarget(match[1]) ?? `<dynamic:${match[1].trim()}>`);
    }
  }
  for (const pattern of [arrayProjectArgumentPattern, shellProjectArgumentPattern]) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      if (!match[1] || match.index === undefined) continue;
      const commandContext = content.slice(Math.max(0, match.index - 240), match.index);
      if (!/firebase(?:-tools|Cli)?/i.test(commandContext)) continue;
      targets.push(unwrapSimpleTarget(match[1]) ?? `<dynamic:${match[1].trim()}>`);
    }
  }
  return targets;
}

function containsForbiddenCommand(content) {
  const commands = [
    {
      name: "firebase deploy",
      pattern: /\bfirebase(?:-tools|Cli)?\b[\s\S]{0,160}\bdeploy\b/i,
    },
    { name: "login:ci", pattern: /\blogin\b[\s"'`+,;:[\]().-]{0,40}\bci\b/i },
    { name: "--token", pattern: /--\s*["'`+\s]*token\b/i },
  ];
  return commands.filter(({ pattern }) => pattern.test(content)).map(({ name }) => name);
}

function unsupportedJobEnvironmentContexts(content, projectPath) {
  if (!/^\.github\/workflows\/[^/]+\.ya?ml$/i.test(projectPath)) return [];

  let workflow;
  try {
    workflow = parseYaml(content);
  } catch (error) {
    return [`invalid workflow YAML: ${error instanceof Error ? error.message : String(error)}`];
  }

  const findings = [];
  for (const [jobName, job] of Object.entries(workflow?.jobs ?? {})) {
    for (const [environmentName, value] of Object.entries(job?.env ?? {})) {
      if (/\$\{\{\s*runner\./i.test(String(value))) {
        findings.push(`${jobName}.env.${environmentName} uses runner context before a runner exists`);
      }
    }
  }
  return findings;
}

for (const canary of [
  "GOOGLE_CLOUD_PROJECT: real-production",
  "FIREBASE_PROJECT_ID=real-production",
  'projectId: "real-production"',
  'firebaseProjectId = "real-production"',
  'PROJECT_ID = "real-production"',
  "firebase emulators:start --project real-production",
  'firebaseCli args: ["--project", "real-production"]',
  "firebase --debug deploy -P real-production",
  "gcloud config set project real-production",
  'PROJECT_ID = ["real", "production"].join("-")',
]) {
  const targets = detectedProjectTargets(canary);
  if (!targets.some((target) => target === "real-production" || target.startsWith("<dynamic:"))) {
    throw new Error(`Project policy detector self-test failed: ${canary}`);
  }
}

if (
  unsupportedJobEnvironmentContexts(
    "jobs:\n  quality:\n    env:\n      CLOUDSDK_CONFIG: ${{ runner.temp }}/ecc-cloudsdk\n",
    ".github/workflows/canary.yml",
  ).length === 0
) {
  throw new Error("Workflow-context detector self-test failed");
}

for (const canary of [
  "firebase   deploy",
  "firebase --debug deploy -P real-production",
  '["firebase", "deploy"].join(" ")',
  'const command = "firebase" + " deploy"',
  "firebase-tools --debug deploy",
  "firebase login:ci --token synthetic",
]) {
  if (containsForbiddenCommand(canary).length === 0) {
    throw new Error(`Forbidden-command detector self-test failed: ${canary}`);
  }
}

const utf16PolicyCanary = Buffer.concat([
  Buffer.from([0xff, 0xfe]),
  Buffer.from("firebase --debug deploy -P real-production", "utf16le"),
]);
const decodedPolicyCanary = decodeRepositoryText(utf16PolicyCanary, ".ps1", "utf16-canary.ps1");
if (
  !decodedPolicyCanary ||
  containsForbiddenCommand(decodedPolicyCanary).length === 0 ||
  !detectedProjectTargets(decodedPolicyCanary).includes("real-production")
) {
  throw new Error("Project policy UTF-16 self-test failed");
}

const findings = [];
for (const path of filesBelow(scanRoot, scanRoot)) {
  const projectPath = relative(scanRoot, path).replaceAll("\\", "/");
  if (projectPath === "scripts/check-repository-policy.mjs") continue;
  const content = readRepositoryText(path);
  if (content === undefined) continue;

  for (const projectId of detectedProjectTargets(content)) {
    if (projectId !== allowedProjectId && !allowedProjectReferences.has(projectId)) {
      findings.push(`${projectPath}: non-demo or dynamic Firebase project target ${projectId}`);
    }
  }
  for (const command of containsForbiddenCommand(content)) {
    findings.push(`${projectPath}: forbidden command ${command}`);
  }
  for (const workflowFinding of unsupportedJobEnvironmentContexts(content, projectPath)) {
    findings.push(
      `${projectPath}: ${workflowFinding}; use a runner-local absolute path in job-level env`,
    );
  }
}

const firebaseRcPath = join(scanRoot, ".firebaserc");
if (existsSync(firebaseRcPath)) {
  const firebaseRc = JSON.parse(readFileSync(firebaseRcPath, "utf8"));
  for (const [alias, projectId] of Object.entries(firebaseRc.projects ?? {})) {
    if (projectId !== allowedProjectId) {
      findings.push(`.firebaserc: alias ${alias} targets non-demo project ${projectId}`);
    }
  }
}

for (const boundary of ["src/core", "src/contracts", "src/application/ports"]) {
  const absolute = join(scanRoot, boundary);
  if (!existsSync(absolute)) continue;
  for (const path of filesBelow(absolute)) {
    const content = readRepositoryText(path);
    if (content === undefined) continue;
    if (/from\s+["'](?:firebase(?:\/|["'])|react(?:\/|["']))/.test(content)) {
      findings.push(`${relative(scanRoot, path)}: provider import crosses ${boundary}`);
    }
  }
}

if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Repository policy check passed");
}
