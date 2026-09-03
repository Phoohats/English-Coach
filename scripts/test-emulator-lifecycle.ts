import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertEmulatorPortsClosed, runEmulatorCommand } from "./run-firebase-emulators.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

const success = await runEmulatorCommand(["-e", "process.exit(0)"]);
if (success !== 0) {
  throw new Error(`Successful emulator child returned ${success}`);
}
await assertEmulatorPortsClosed("after successful lifecycle child");

const lifecycleDirectory = mkdtempSync(join(tmpdir(), "ecc-lifecycle-"));
const markerPath = join(lifecycleDirectory, "failure-child-ran.txt");
const markerPathBase64 = Buffer.from(markerPath).toString("base64");
const secretNames = ["ECC_SECRET_SENTINEL", "GEMINI_API_KEY", "NODE_AUTH_TOKEN"] as const;
const originalSecrets = new Map(secretNames.map((name) => [name, process.env[name]]));

try {
  for (const name of secretNames) process.env[name] = "synthetic-must-not-leak";
  const failureScript = [
    "const fs = require('node:fs')",
    `const marker = Buffer.from('${markerPathBase64}', 'base64').toString()`,
    `const names = ${JSON.stringify(secretNames)}`,
    "const isolated = names.every((name) => process.env[name] === undefined)",
    "fs.writeFileSync(marker, isolated ? 'isolated' : 'leaked')",
    "process.exit(isolated ? 7 : 9)",
  ].join(";");
  const failure = await runEmulatorCommand(["-e", failureScript]);
  if (failure === 0) {
    throw new Error("Firebase CLI did not propagate a failing child exit code");
  }
  if (!existsSync(markerPath) || readFileSync(markerPath, "utf8") !== "isolated") {
    throw new Error("Failing emulator child did not run with isolated credentials");
  }
} finally {
  for (const [name, value] of originalSecrets) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  rmSync(lifecycleDirectory, { recursive: true, force: true });
}
await assertEmulatorPortsClosed("after failing lifecycle child");

console.log(`Emulator lifecycle verified from ${resolve(projectRoot, "firebase.json")}`);
