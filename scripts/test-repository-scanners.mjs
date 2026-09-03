import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { projectRoot } from "./repository-text.mjs";

const canaryDirectory = mkdtempSync(join(tmpdir(), "ecc-scanner-canary-"));
const deployCommand = ["fire", "base --debug de", "ploy -P real-production"].join("");
const awsCredential = ["AWS_SECRET_ACCESS_KEY", "=", "A".repeat(40)].join("");
const utf16DeployPath = join(canaryDirectory, "deploy.ps1");
const extensionlessDeployPath = join(canaryDirectory, "deploy-script");
const pythonDeployPath = join(canaryDirectory, "deploy.py");
const utf16CredentialPath = join(canaryDirectory, "credential.ps1");

function utf16LeWithBom(content) {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(content, "utf16le")]);
}

function runScanner(relativeScript) {
  return spawnSync(process.execPath, [resolve(projectRoot, relativeScript), "--root", canaryDirectory], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
  });
}

function assertRejected(result, expectedPaths, scannerName) {
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.status === 0) throw new Error(`${scannerName} accepted repository canaries`);
  for (const path of expectedPaths) {
    const projectPath = relative(canaryDirectory, path);
    const normalizedProjectPath = projectPath.replaceAll("\\", "/");
    if (
      !output.includes(projectPath) &&
      !output.includes(normalizedProjectPath) &&
      !output.includes(path)
    ) {
      throw new Error(`${scannerName} did not report canary ${projectPath}`);
    }
  }
}

try {
  writeFileSync(utf16DeployPath, utf16LeWithBom(deployCommand));
  writeFileSync(extensionlessDeployPath, deployCommand, "utf8");
  writeFileSync(pythonDeployPath, deployCommand, "utf8");
  writeFileSync(utf16CredentialPath, utf16LeWithBom(awsCredential));

  assertRejected(
    runScanner("scripts/check-repository-policy.mjs"),
    [utf16DeployPath, extensionlessDeployPath, pythonDeployPath],
    "Repository policy scanner",
  );
  assertRejected(
    runScanner("scripts/scan-secrets.mjs"),
    [utf16CredentialPath],
    "Secret scanner",
  );
} finally {
  rmSync(canaryDirectory, { recursive: true, force: true });
}

console.log("Repository scanner subprocess canaries passed");
