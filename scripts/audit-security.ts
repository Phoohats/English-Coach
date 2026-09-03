import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

type AuditFinding = {
  name?: string;
  severity?: string;
  url?: string;
};

type AuditReport = {
  error?: { message?: string };
  vulnerabilities?: Record<
    string,
    {
      severity?: string;
      via?: Array<string | AuditFinding>;
    }
  >;
};

type AuditException = {
  advisory: string;
  expires: string;
  packageName: string;
  rationale: string;
  workspaces: readonly string[];
};

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const severityRank = { low: 1, moderate: 2, high: 3, critical: 4 } as const;
const exceptions: readonly AuditException[] = [
  {
    advisory: "GHSA-8988-4f7v-96qf",
    expires: "2026-12-01",
    packageName: "@opentelemetry/core",
    rationale: "Firebase CLI-only Pub/Sub telemetry path; no product runtime import",
    workspaces: ["root"],
  },
];

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("npm_execpath is unavailable; run the audit through npm");
const npmCliPath: string = npmCli;

function advisoryId(url: string): string {
  return url.split("/").at(-1) ?? url;
}

function runAudit(workspace: string, cwd: string): AuditReport {
  const result = spawnSync(
    process.execPath,
    [npmCliPath, "audit", "--json", "--audit-level=moderate"],
    { cwd, encoding: "utf8", windowsHide: true },
  );
  if (!result.stdout) {
    throw new Error(`${workspace} audit returned no JSON: ${result.stderr || "unknown error"}`);
  }
  const report = JSON.parse(result.stdout) as AuditReport;
  if (report.error) {
    throw new Error(`${workspace} audit failed: ${report.error.message ?? "unknown error"}`);
  }
  return report;
}

const failures: string[] = [];

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type PackageLock = {
  packages?: Record<string, PackageManifest>;
};

function dependencyNames(manifest: PackageManifest | undefined): string[] {
  return Object.keys({
    ...manifest?.dependencies,
    ...manifest?.devDependencies,
    ...manifest?.optionalDependencies,
  });
}

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

function importedModuleSpecifiers(path: string, content: string): string[] {
  const scriptKind = /\.[jt]sx$/.test(path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, scriptKind);
  const specifiers: string[] = [];
  const addStringLiteral = (node: ts.Node | undefined) => {
    if (node && ts.isStringLiteralLike(node)) specifiers.push(node.text);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      addStringLiteral(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      addStringLiteral(node.arguments[0]);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      addStringLiteral(node.moduleReference.expression);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      addStringLiteral(node.argument.literal);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

function isOpenTelemetryCoreSpecifier(specifier: string): boolean {
  return specifier === "@opentelemetry/core" || specifier.startsWith("@opentelemetry/core/");
}

function validateOpenTelemetryExceptionBoundary(): void {
  const manifest = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")) as PackageManifest;
  if (manifest.dependencies?.["firebase-tools"] || !manifest.devDependencies?.["firebase-tools"]) {
    failures.push("firebase-tools must remain a root devDependency while the OpenTelemetry exception exists");
  }
  if (dependencyNames(manifest).includes("@opentelemetry/core")) {
    failures.push("@opentelemetry/core must not be a direct root dependency");
  }

  const lock = JSON.parse(readFileSync(join(projectRoot, "package-lock.json"), "utf8")) as PackageLock;
  const packages = lock.packages ?? {};
  const coreDependents = Object.entries(packages)
    .filter(([, entry]) => dependencyNames(entry).includes("@opentelemetry/core"))
    .map(([path]) => path);
  const pubsubDependents = Object.entries(packages)
    .filter(([, entry]) => dependencyNames(entry).includes("@google-cloud/pubsub"))
    .map(([path]) => path);
  if (coreDependents.length !== 1 || coreDependents[0] !== "node_modules/@google-cloud/pubsub") {
    failures.push(`unexpected @opentelemetry/core dependents: ${coreDependents.join(", ") || "none"}`);
  }
  if (pubsubDependents.length !== 1 || pubsubDependents[0] !== "node_modules/firebase-tools") {
    failures.push(`unexpected @google-cloud/pubsub dependents: ${pubsubDependents.join(", ") || "none"}`);
  }

  for (const canary of [
    'import "@opentelemetry/core";',
    'export { x } from "@opentelemetry/core/subpath";',
    'await import("@opentelemetry/core");',
    'require ( "@opentelemetry/core" );',
    'type T = import("@opentelemetry/core").T;',
  ]) {
    if (!importedModuleSpecifiers("canary.ts", canary).some(isOpenTelemetryCoreSpecifier)) {
      throw new Error(`OpenTelemetry import detector self-test failed: ${canary}`);
    }
  }

  const sourceExtensions = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
  for (const directory of [join(projectRoot, "src"), join(projectRoot, "functions", "src")]) {
    for (const path of filesBelow(directory)) {
      if (!sourceExtensions.has(path.slice(path.lastIndexOf(".")))) continue;
      const content = readFileSync(path, "utf8");
      if (importedModuleSpecifiers(path, content).some(isOpenTelemetryCoreSpecifier)) {
        failures.push(`${relative(projectRoot, path)} imports exception-only @opentelemetry/core`);
      }
    }
  }
}

validateOpenTelemetryExceptionBoundary();
const observedExceptions = new Set<string>();
for (const [workspace, cwd] of [
  ["root", projectRoot],
  ["functions", resolve(projectRoot, "functions")],
] as const) {
  const report = runAudit(workspace, cwd);
  for (const [packageName, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
    for (const finding of vulnerability.via ?? []) {
      if (typeof finding === "string" || !finding.url || !finding.severity) continue;
      const rank = severityRank[finding.severity as keyof typeof severityRank] ?? 0;
      if (rank < severityRank.moderate) continue;

      const advisory = advisoryId(finding.url);
      const affectedPackage = finding.name ?? packageName;
      const exception = exceptions.find(
        (candidate) =>
          candidate.advisory === advisory &&
          candidate.packageName === affectedPackage &&
          candidate.workspaces.includes(workspace),
      );
      if (!exception) {
        failures.push(`${workspace}: unapproved ${finding.severity} ${advisory} in ${affectedPackage}`);
        continue;
      }
      if (finding.severity !== "moderate") {
        failures.push(`${workspace}: ${advisory} escalated to ${finding.severity}`);
        continue;
      }
      if (Date.now() >= Date.parse(`${exception.expires}T00:00:00Z`)) {
        failures.push(`${workspace}: exception expired for ${advisory} on ${exception.expires}`);
        continue;
      }
      observedExceptions.add(exception.advisory);
      console.warn(
        `${workspace}: approved temporary exception ${advisory} (${affectedPackage}) until ${exception.expires}: ${exception.rationale}`,
      );
    }
  }
}

for (const exception of exceptions) {
  if (!observedExceptions.has(exception.advisory)) {
    failures.push(`stale audit exception must be removed: ${exception.advisory}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Moderate-or-higher dependency audit passed with controlled exceptions");
}
