import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { execFile, spawn } from "node:child_process";
import { connect } from "node:net";
import { fileURLToPath } from "node:url";

export const firebaseProjectId = "demo-english-career-coach";
export const firebaseServices = "auth,firestore,storage,functions";
export const emulatorPorts = [4400, 4500, 5001, 8080, 9099, 9150, 9199, 9299, 9499] as const;

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const inheritedEnvironmentKeys = [
  "CI",
  "COMSPEC",
  "ComSpec",
  "JAVA_HOME",
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

export function localNode22Path(): string {
  const executable = process.platform === "win32" ? "node.exe" : "node";
  const candidate = resolve(
    projectRoot,
    "tools",
    "node22",
    "node_modules",
    "node",
    "bin",
    executable,
  );
  if (!existsSync(candidate)) {
    throw new Error(`Pinned Node 22 binary is missing: ${candidate}`);
  }
  return candidate;
}

function quoteForShell(value: string): string {
  if (process.platform === "win32") {
    return `"${value.replaceAll('"', '\\"')}"`;
  }
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function portAcceptsConnections(port: number): Promise<boolean> {
  return new Promise((resolveProbe) => {
    const socket = connect({ host: "127.0.0.1", port });
    const finish = (open: boolean) => {
      socket.destroy();
      resolveProbe(open);
    };
    socket.setTimeout(300, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

function loggedWorkerPorts(): number[] {
  const debugLog = resolve(projectRoot, "firebase-debug.log");
  if (!existsSync(debugLog)) return [];
  const ports = [...readFileSync(debugLog, "utf8").matchAll(/Serving at port (\d+)/g)]
    .map((match) => Number(match[1]))
    .filter((port) => Number.isInteger(port) && port > 0 && port <= 65_535);
  return [...new Set(ports)];
}

export async function assertEmulatorPortsClosed(context: string): Promise<void> {
  const ports = [...new Set([...emulatorPorts, ...loggedWorkerPorts()])];
  const deadline = Date.now() + 15_000;
  let openPorts: number[] = [];

  while (Date.now() < deadline) {
    const states = await Promise.all(ports.map(portAcceptsConnections));
    openPorts = ports.filter((_, index) => states[index]);
    if (process.env.ECC_DEBUG_PROCESS_TREE === "1") {
      console.error(
        `[emulator-debug] ${context} open ports: ${openPorts.join(", ") || "none"}`,
      );
    }
    if (openPorts.length === 0) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  throw new Error(`Emulator ports remained open ${context}: ${openPorts.join(", ")}`);
}

function childEnvironment(node22: string, cloudSdkConfig: string): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    CLOUDSDK_CONFIG: cloudSdkConfig,
    FIREBASE_EMULATORS_PATH: resolve(
      projectRoot,
      "node_modules",
      ".cache",
      "firebase",
      "emulators",
    ),
    FIREBASE_CLI_DISABLE_UPDATE_CHECK: "true",
    FUNCTIONS_DISCOVERY_TIMEOUT: "30",
    FIREBASE_PROJECT_ID: firebaseProjectId,
    GCLOUD_PROJECT: firebaseProjectId,
    GOOGLE_CLOUD_PROJECT: firebaseProjectId,
  };

  for (const key of inheritedEnvironmentKeys) {
    if (process.env[key] !== undefined) environment[key] = process.env[key];
  }
  environment.XDG_CONFIG_HOME = cloudSdkConfig;
  if (process.platform === "win32") {
    environment.APPDATA = cloudSdkConfig;
  } else {
    environment.HOME = cloudSdkConfig;
  }
  const inheritedPathKey = Object.keys(process.env).find(
    (key) => key.toUpperCase() === "PATH",
  );
  const inheritedPath = inheritedPathKey ? process.env[inheritedPathKey] : undefined;
  environment.PATH = `${dirname(node22)}${delimiter}${inheritedPath ?? ""}`;
  return environment;
}

async function run(
  executable: string,
  args: string[],
  environment: NodeJS.ProcessEnv,
  trackDescendants = false,
): Promise<number> {
  const child = spawn(executable, args, {
    cwd: projectRoot,
    env: environment,
    shell: false,
    stdio: "inherit",
  });
  const trackedProcesses = new Map<number, ProcessRow>();
  let capturePromise = Promise.resolve();
  let captureError: unknown;
  let captureInFlight = false;
  const capture = () => {
    if (!trackDescendants || child.pid === undefined || captureInFlight) return;
    captureInFlight = true;
    capturePromise = descendantProcesses(child.pid, environment)
      .then((processes) => {
        for (const processRow of processes) {
          trackedProcesses.set(processRow.pid, processRow);
        }
      })
      .catch((error: unknown) => {
        captureError ??= error;
      })
      .finally(() => {
        captureInFlight = false;
      });
  };
  capture();
  const tracker = trackDescendants ? setInterval(capture, 250) : undefined;

  let exitCode: number | undefined;
  let childError: unknown;
  try {
    exitCode = await new Promise<number>((resolveExit, reject) => {
      child.once("error", reject);
      child.once("exit", (code, signal) => {
        if (signal) {
          reject(new Error(`Process terminated by ${signal}`));
          return;
        }
        resolveExit(code ?? 1);
      });
    });
  } catch (error: unknown) {
    childError = error;
  } finally {
    if (tracker) clearInterval(tracker);
    await capturePromise;
    if (process.env.ECC_DEBUG_PROCESS_TREE === "1") {
      console.error(
        `[emulator-debug] tracked descendants: ${[...trackedProcesses.keys()].join(", ") || "none"}`,
      );
    }
    if (trackDescendants) await terminateProcesses(trackedProcesses, environment);
  }
  if (captureError) {
    throw new Error("Failed to sample the Firebase emulator process tree", {
      cause: captureError,
    });
  }
  if (childError) throw childError;
  if (process.env.ECC_DEBUG_PROCESS_TREE === "1") {
    console.error(`[emulator-debug] child ${child.pid ?? "unknown"} exited ${exitCode}`);
  }
  return exitCode ?? 1;
}

interface ProcessRow {
  identity: string;
  pid: number;
  parentPid: number;
}

async function processRows(environment: NodeJS.ProcessEnv): Promise<ProcessRow[]> {
  const [executable, args] =
    process.platform === "win32"
      ? [
          resolve(
            environment.SystemRoot ?? environment.SYSTEMROOT ?? "C:\\Windows",
            "System32/WindowsPowerShell/v1.0/powershell.exe",
          ),
          [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId) $($_.ParentProcessId) $($_.CreationDate.ToUniversalTime().Ticks)" }',
          ],
        ]
      : ["/bin/ps", ["-A", "-o", "pid=,ppid=,lstart="]];
  const output = await new Promise<string>((resolveOutput, reject) => {
    execFile(
      executable,
      args,
      { env: environment, windowsHide: true, maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        if (error) reject(error);
        else resolveOutput(stdout);
      },
    );
  });
  return output.split(/\r?\n/).flatMap((line) => {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
    if (!match) return [];
    const pid = Number(match[1]);
    const parentPid = Number(match[2]);
    const identity = match[3]?.trim();
    return Number.isInteger(pid) && Number.isInteger(parentPid) && identity
      ? [{ identity, pid, parentPid }]
      : [];
  });
}

async function descendantProcesses(
  rootPid: number,
  environment: NodeJS.ProcessEnv,
): Promise<ProcessRow[]> {
  const rows = await processRows(environment);
  const descendants = new Set<number>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (
        (row.parentPid === rootPid || descendants.has(row.parentPid)) &&
        !descendants.has(row.pid)
      ) {
        descendants.add(row.pid);
        changed = true;
      }
    }
  }
  return rows.filter((row) => descendants.has(row.pid));
}

async function matchingProcesses(
  tracked: Map<number, ProcessRow>,
  environment: NodeJS.ProcessEnv,
): Promise<ProcessRow[]> {
  const current = new Map((await processRows(environment)).map((row) => [row.pid, row]));
  return [...tracked.values()].filter(
    (row) => current.get(row.pid)?.identity === row.identity,
  );
}

async function terminateProcesses(
  tracked: Map<number, ProcessRow>,
  environment: NodeJS.ProcessEnv,
): Promise<void> {
  const liveProcesses = (await matchingProcesses(tracked, environment)).reverse();
  for (const processRow of liveProcesses) {
    try {
      process.kill(processRow.pid, "SIGTERM");
    } catch {
      // The same process may have completed between identity validation and termination.
    }
  }
  if (liveProcesses.length === 0) return;
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  const remaining = await matchingProcesses(tracked, environment);
  for (const processRow of remaining) {
    try {
      process.kill(processRow.pid, "SIGKILL");
    } catch {
      // A concurrent clean shutdown is also acceptable.
    }
  }
}

async function assertPinnedRuntime(node22: string, environment: NodeJS.ProcessEnv): Promise<void> {
  const assertion = "if (process.versions.node !== '22.23.2') { console.error(process.versions.node); process.exit(22); }";
  const exitCode = await run(node22, ["-e", assertion], environment);
  if (exitCode !== 0) {
    throw new Error("Firebase emulator runner requires pinned Node 22.23.2");
  }
}

async function buildFunctions(node22: string, environment: NodeJS.ProcessEnv): Promise<void> {
  const compiler = resolve(projectRoot, "functions", "node_modules", "typescript", "bin", "tsc");
  if (!existsSync(compiler)) {
    throw new Error("Functions dependencies are missing; run npm --prefix functions ci");
  }
  const exitCode = await run(node22, [compiler, "--project", "functions/tsconfig.json"], environment);
  if (exitCode !== 0) {
    throw new Error(`Functions build failed with exit code ${exitCode}`);
  }
}

export async function runEmulatorCommand(commandArgs: string[]): Promise<number> {
  const node22 = localNode22Path();
  const cloudSdkConfig = mkdtempSync(join(tmpdir(), "ecc-firebase-"));
  const environment = childEnvironment(node22, cloudSdkConfig);

  try {
    await assertEmulatorPortsClosed("before startup");
    rmSync(resolve(projectRoot, "firebase-debug.log"), { force: true });
    await assertPinnedRuntime(node22, environment);
    await buildFunctions(node22, environment);

    const firebaseCli = resolve(
      projectRoot,
      "node_modules",
      "firebase-tools",
      "lib",
      "bin",
      "firebase.js",
    );
    if (!existsSync(firebaseCli)) {
      throw new Error("Locked Firebase CLI is missing; run npm ci");
    }

    const command = [node22, ...commandArgs].map(quoteForShell).join(" ");
    try {
      return await run(
        node22,
        [
          firebaseCli,
          "emulators:exec",
          "--project",
          firebaseProjectId,
          "--only",
          firebaseServices,
          command,
        ],
        environment,
        true,
      );
    } finally {
      await assertEmulatorPortsClosed("after shutdown");
    }
  } finally {
    rmSync(cloudSdkConfig, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode !== "test") {
    throw new Error(`Unknown emulator runner mode: ${mode ?? "missing"}`);
  }

  const vitest = resolve(projectRoot, "node_modules", "vitest", "vitest.mjs");
  const exitCode = await runEmulatorCommand([
    vitest,
    "run",
    "--config",
    "vitest.firebase.config.ts",
  ]);
  process.exitCode = exitCode;
}

const isEntryPoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntryPoint) {
  await main();
}
