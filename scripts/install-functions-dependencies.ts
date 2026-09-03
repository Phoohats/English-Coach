import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { localNode22Path } from "./run-firebase-emulators.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const npmCli = process.env.npm_execpath;
if (!npmCli || !existsSync(npmCli)) {
  throw new Error("npm_execpath is unavailable; run this installer through npm");
}
const npmCliPath: string = npmCli;

const node22 = localNode22Path();
const isolatedHome = mkdtempSync(join(tmpdir(), "ecc-functions-install-"));
const inheritedEnvironmentKeys = [
  "CI",
  "COMSPEC",
  "ComSpec",
  "LANG",
  "LC_ALL",
  "PATHEXT",
  "SYSTEMROOT",
  "SystemRoot",
  "TEMP",
  "TMP",
  "TMPDIR",
  "WINDIR",
  "windir",
] as const;
const secretCanaryNames = [
  "AWS_SECRET_ACCESS_KEY",
  "ECC_SECRET_SENTINEL",
  "FIREBASE_TOKEN",
  "GEMINI_API_KEY",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "NODE_AUTH_TOKEN",
] as const;
const originalSecrets = new Map(secretCanaryNames.map((name) => [name, process.env[name]]));
for (const name of secretCanaryNames) process.env[name] = "synthetic-must-not-leak";

const environment: NodeJS.ProcessEnv = {};
for (const key of inheritedEnvironmentKeys) {
  if (process.env[key] !== undefined) environment[key] = process.env[key];
}
const inheritedPathKey = Object.keys(process.env).find(
  (key) => key.toUpperCase() === "PATH",
);
const inheritedPath = inheritedPathKey ? process.env[inheritedPathKey] : undefined;
environment.NODE = node22;
environment.npm_node_execpath = node22;
environment.PATH = `${dirname(node22)}${delimiter}${inheritedPath ?? ""}`;
environment.APPDATA = isolatedHome;
environment.HOME = isolatedHome;
environment.USERPROFILE = isolatedHome;
environment.NPM_CONFIG_AUDIT = "false";
environment.NPM_CONFIG_CACHE = resolve(projectRoot, "node_modules", ".cache", "npm");
environment.NPM_CONFIG_FUND = "false";
environment.NPM_CONFIG_IGNORE_SCRIPTS = "true";
environment.NPM_CONFIG_USERCONFIG = join(isolatedHome, ".npmrc");

async function run(executable: string, args: string[], label: string): Promise<void> {
  const child = spawn(executable, args, {
    cwd: projectRoot,
    env: environment,
    shell: false,
    stdio: "inherit",
  });
  const exitCode = await new Promise<number>((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Functions npm command terminated by ${signal}`));
      else resolveExit(code ?? 1);
    });
  });
  if (exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${exitCode}`);
  }
}

async function runNpm(args: string[]): Promise<void> {
  await run(node22, [npmCliPath, "--prefix", "functions", ...args], "Functions npm command");
}

try {
  const isolationProbe =
    `const names=${JSON.stringify(secretCanaryNames)};` +
    "process.exit(names.some((name) => process.env[name] !== undefined) ? 23 : 0)";
  await run(node22, ["-e", isolationProbe], "Functions installer environment isolation probe");
  await runNpm(["ci", "--ignore-scripts"]);
  await runNpm(["run", "check:runtime"]);
} finally {
  for (const [name, value] of originalSecrets) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  rmSync(isolatedHome, { recursive: true, force: true });
}
