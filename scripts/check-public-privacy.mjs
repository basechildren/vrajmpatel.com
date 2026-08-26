import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(process.argv[2] ?? "dist");
const pdfToText = process.env.PDFTOTEXT ?? "pdftotext";
const pdfInfo = process.env.PDFINFO ?? "pdfinfo";
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}/g;
const textExtensions = new Set([".css", ".html", ".js", ".json", ".txt", ".xml"]);

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
};

const findings = [];
const report = (file, kind) =>
  findings.push(path.relative(root, file) + ": " + kind);

for (const file of await walk(root)) {
  const extension = path.extname(file).toLowerCase();

  if (textExtensions.has(extension)) {
    const content = await readFile(file, "utf8");
    if (content.match(emailPattern)) report(file, "email address");
    if (content.toLowerCase().includes("mailto:")) report(file, "mailto link");
  }

  if (extension === ".pdf") {
    const raw = await readFile(file);
    const rawText = raw.toString("latin1");
    const normalizedPdfStrings = rawText
      .replace(/\\072/g, ":")
      .replace(/\\100/g, "@")
      .replace(/\\056/g, ".");

    if (normalizedPdfStrings.toLowerCase().includes("mailto:")) {
      report(file, "mailto link");
    }
    if (normalizedPdfStrings.match(emailPattern)) {
      report(file, "embedded email address");
    }
    if (
      rawText.includes("<xmpMM:DocumentID>") ||
      rawText.includes("<xmpMM:InstanceID>")
    ) {
      report(file, "embedded document UUID");
    }

    try {
      const { stdout } = await execFileAsync(pdfToText, [file, "-"]);
      if (stdout.match(emailPattern)) report(file, "extractable email address");

      if (path.basename(file).toLowerCase() === "resume.pdf") {
        if (stdout.match(phonePattern)) report(file, "extractable phone number");

        const firstReadableLine = stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .find(Boolean);
        if (firstReadableLine !== "Vraj Patel") {
          report(file, "unexpected reading order");
        }

        const { stdout: metadata } = await execFileAsync(pdfInfo, [file]);
        const author = metadata.match(/^Author:\s*(.+)$/m)?.[1]?.trim();
        if (author !== "Vraj Patel") report(file, "unexpected author metadata");
        if (!/^Tagged:\s+yes$/m.test(metadata)) {
          report(file, "missing tagged PDF structure");
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        "Unable to inspect " +
          path.relative(root, file) +
          " with Poppler: " +
          reason,
      );
    }
  }
}

if (findings.length > 0) {
  console.error(
    "Public privacy check failed:\n" +
      findings.map((finding) => "- " + finding).join("\n"),
  );
  process.exit(1);
}

console.log("Public privacy check passed.");
