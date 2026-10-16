import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const allSlugs = ["operational-ticket-intelligence", "building-indian-parliamentary-datasets", "full-stack-biometric-marathon"];
const selected = process.argv.find((value) => value.startsWith("--slug="))?.split("=")[1];
if (selected && !allSlugs.includes(selected)) throw new Error(`Unknown film slug: ${selected}`);
const slugs = selected ? [selected] : allSlugs;
const baseURL = process.env.FILM_BASE_URL || "http://localhost:4321";
const dpr = Number(process.env.FILM_DPR || 2);
const fps = 30;
const output = fileURLToPath(new URL("../public/films/", import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), "portfolio-films-"));
await mkdir(output, { recursive: true });
const ffmpeg = (...args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: dpr, reducedMotion: "no-preference" });
  // Parallel site edits must not hot-reload a scene halfway through its capture.
  // Keep the module exports Vite injects, but omit its websocket connection.
  await page.route("**/@vite/client", (route) => route.fulfill({ contentType: "text/javascript", body: `
    export const createHotContext = () => ({ accept() {}, acceptExports() {}, dispose() {}, prune() {}, invalidate() {}, on() {}, off() {}, send() {}, data: {} });
    export const injectQuery = (url) => url;
    export const updateStyle = () => {};
    export const removeStyle = () => {};
  ` }));
  for (const slug of slugs) {
    const frames = join(scratch, slug);
    await mkdir(frames);
    await page.goto(`${baseURL}/dev/films/${slug}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => Boolean(window.__film));
    const duration = await page.evaluate(() => window.__film.duration);
    const count = Math.round(duration / 1000 * fps);
    console.log(`${slug}: capturing ${count} deterministic frames at ${dpr}× DPR`);
    for (let frame = 0; frame < count; frame++) {
      await page.evaluate((time) => window.__film.seek(time), frame * 1000 / fps);
      // Animations are paused; screenshots capture the sought frame, never elapsed wall time.
      await page.screenshot({ path: join(frames, `${String(frame).padStart(4, "0")}.png`), animations: "allow", caret: "hide" });
      if (frame && frame % 90 === 0) console.log(`  ${frame}/${count} frames`);
    }
    const input = join(frames, "%04d.png");
    const common = ["-framerate", String(fps), "-i", input, "-vf", "scale=1280:800", "-an"];
    ffmpeg(...common, "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-row-mt", "1", "-pix_fmt", "yuv420p", join(output, `${slug}.webm`));
    ffmpeg(...common, "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(output, `${slug}.mp4`));
    // A useful, distinct resting state: decision controls / checkpoint / candidate grid.
    const posterFrame = slug === "full-stack-biometric-marathon" ? 270 : 240;
    const posterPng = await readFile(join(frames, `${String(posterFrame).padStart(4, "0")}.png`));
    // The system ffmpeg build has no WebP encoder. Chrome's canvas encoder keeps
    // the recorder self-contained, including when source frames use 2× DPR.
    const posterData = await page.evaluate(async (png) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1280; canvas.height = 800;
      canvas.getContext("2d").drawImage(image, 0, 0, 1280, 800);
      return canvas.toDataURL("image/webp", .82).split(",")[1];
    }, posterPng.toString("base64"));
    await writeFile(join(output, `${slug}-poster.webp`), Buffer.from(posterData, "base64"));
    for (const [suffix, budget] of [[".webm", 900_000], [".mp4", 1_400_000], ["-poster.webp", 120_000]]) {
      const { size } = await stat(join(output, `${slug}${suffix}`));
      console.log(`  ${slug}${suffix}: ${(size / 1000).toFixed(1)} KB`);
      if (size > budget) throw new Error(`${slug}${suffix} exceeds the ${budget / 1000} KB budget`);
    }
    await rm(frames, { recursive: true, force: true });
  }
} finally {
  await browser.close();
  await rm(scratch, { recursive: true, force: true });
}
