import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));

const ignoredGeneratedDirectories = new Set(["coverage", "dist", "functions/lib"]);
const approvedBinaryExtensions = new Set([
  ".gif", ".ico", ".jpeg", ".jpg", ".mp3", ".mp4", ".otf", ".pdf", ".png",
  ".ttf", ".wav", ".webm", ".webp", ".woff", ".woff2",
]);

export function filesBelow(directory, repositoryRoot = projectRoot) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    const projectPath = relative(repositoryRoot, path).replaceAll("\\", "/");
    if (name === ".git" || name === "node_modules" || ignoredGeneratedDirectories.has(projectPath)) {
      return [];
    }
    const stats = lstatSync(path);
    if (stats.isSymbolicLink()) {
      throw new Error(`Repository scanners reject symbolic link: ${projectPath}`);
    }
    return stats.isDirectory() ? filesBelow(path, repositoryRoot) : [path];
  });
}

function decodeUtf16BigEndian(bytes) {
  const body = bytes.subarray(2);
  if (body.length % 2 !== 0) throw new Error("Invalid odd-length UTF-16BE file");
  const swapped = Buffer.allocUnsafe(body.length);
  for (let index = 0; index < body.length; index += 2) {
    swapped[index] = body[index + 1];
    swapped[index + 1] = body[index];
  }
  return swapped.toString("utf16le");
}

export function decodeRepositoryText(bytes, extension, path) {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    if ((bytes.length - 2) % 2 !== 0) throw new Error(`Invalid odd-length UTF-16LE file: ${path}`);
    return bytes.subarray(2).toString("utf16le");
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return decodeUtf16BigEndian(bytes);
  }
  if (bytes.includes(0)) {
    if (approvedBinaryExtensions.has(extension)) return undefined;
    throw new Error(`Repository scanners reject unrecognized NUL-containing file: ${path}`);
  }
  return bytes.toString("utf8");
}

export function readRepositoryText(path) {
  return decodeRepositoryText(readFileSync(path), extname(path).toLowerCase(), path);
}
