import { extname } from "node:path";
import {
  decodeRepositoryText,
  filesBelow,
  projectRoot,
  readRepositoryText,
} from "./repository-text.mjs";

const rootArgumentIndex = process.argv.indexOf("--root");
const scanRoot = rootArgumentIndex === -1 ? projectRoot : process.argv[rootArgumentIndex + 1];
if (!scanRoot) throw new Error("Secret scanner --root requires a directory");

const prohibitedCredentialExtensions = new Set([".key", ".p12", ".pem", ".pfx"]);
const privateKeyHeader = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
const patterns = [
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
  { name: "GitHub fine-grained token", pattern: /github_pat_[A-Za-z0-9_]{20,}/g },
  {
    name: "AWS access key ID",
    pattern: /\b(?:AIDA|AIPA|AKIA|ANPA|ANVA|AROA|ASCA|ASIA)[A-Z0-9]{16}\b/g,
  },
  { name: "private key", pattern: new RegExp(privateKeyHeader, "g") },
  { name: "service-account private key", pattern: /["']private_key["']\s*:/g },
  {
    name: "quoted environment credential",
    pattern:
      /\b[A-Z][A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD|ACCESS_KEY|SECRET_KEY|PRIVATE_KEY|CREDENTIALS?)\b\s*[:=]\s*["'][^"'\r\n]{16,}["']/g,
  },
  {
    name: "unquoted environment credential",
    pattern:
      /\b[A-Z][A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD|ACCESS_KEY|SECRET_KEY|PRIVATE_KEY|CREDENTIALS?)\b\s*[:=]\s*(?!["'])[A-Za-z0-9_./+=-]{16,}/g,
  },
  {
    name: "npm registry token",
    pattern: /\/\/[^\s]+:_authToken\s*=\s*[^\s#]{8,}/gi,
  },
  {
    name: "named credential",
    pattern:
      /\b(?:password|passwd|secret|token|apiKey|api_key)\b\s*[:=]\s*["'][^"'\r\n]{16,}["']/gi,
  },
];

const canaries = [
  { name: "Google API key", content: ["AIza", "A".repeat(35)].join("") },
  { name: "GitHub token", content: ["ghp_", "A".repeat(30)].join("") },
  {
    name: "GitHub fine-grained token",
    content: ["github", "_pat_", "A".repeat(30)].join(""),
  },
  { name: "AWS access key ID", content: ["AKIA", "A".repeat(16)].join("") },
  { name: "private key", content: ["-----BEGIN", "PRIVATE KEY-----"].join(" ") },
  {
    name: "service-account private key",
    content: ["\"private", "_key\"", ": \"synthetic\""].join(""),
  },
  {
    name: "quoted environment credential",
    content: ["GEMINI_API_KEY", "=\"", "A".repeat(24), "\""].join(""),
  },
  {
    name: "unquoted environment credential",
    content: ["NODE_AUTH_TOKEN", "=", "npm_", "A".repeat(24)].join(""),
  },
  {
    name: "quoted environment credential",
    content: ["AWS_SECRET_ACCESS_KEY", "=\"", "A".repeat(40), "\""].join(""),
  },
  {
    name: "npm registry token",
    content: ["//registry.npmjs.org/", ":_authToken=", "npm_", "A".repeat(24)].join(""),
  },
  {
    name: "named credential",
    content: ["const password", "=\"", "A".repeat(24), "\""].join(""),
  },
];

const findings = [];
for (const canary of canaries) {
  const detector = patterns.find(({ name }) => name === canary.name);
  if (!detector) throw new Error(`Missing secret detector ${canary.name}`);
  detector.pattern.lastIndex = 0;
  if (!detector.pattern.test(canary.content)) {
    throw new Error(`Secret detector self-test failed: ${canary.name}`);
  }
}

const utf16Canary = Buffer.concat([
  Buffer.from([0xff, 0xfe]),
  Buffer.from(canaries[0].content, "utf16le"),
]);
if (decodeRepositoryText(utf16Canary, ".ps1", "utf16-canary.ps1") !== canaries[0].content) {
  throw new Error("Secret scanner UTF-16 self-test failed");
}

for (const path of filesBelow(scanRoot, scanRoot)) {
  const extension = extname(path).toLowerCase();
  if (prohibitedCredentialExtensions.has(extension)) {
    findings.push(`credential file extension: ${path}`);
    continue;
  }
  const content = readRepositoryText(path);
  if (content === undefined) continue;
  for (const { name, pattern } of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) findings.push(`${name}: ${path}`);
  }
}

if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Secret-pattern scan passed");
}
