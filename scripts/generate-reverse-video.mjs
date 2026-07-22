import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const fps = 25;
const frameCount = 1430;
const chunkFrames = 50;
const selected = process.argv.slice(2);
const variants = [
  { name: "mobile", bitrate: "1100k", maxrate: "1250k", buffer: "2200k" },
  { name: "desktop", bitrate: "2200k", maxrate: "2500k", buffer: "4400k" },
].filter(({ name }) => selected.length === 0 || selected.includes(name));

function run(args) {
  const result = spawnSync(ffmpeg, args, {
    encoding: "utf8",
    stdio: ["ignore", "inherit", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `ffmpeg exited with ${result.status}`);
  }
}

for (const variant of variants) {
  const source = join(root, "web", "public", "media", "hawaii", `journey-${variant.name}.mp4`);
  const destination = join(
    root,
    "web",
    "public",
    "media",
    "hawaii",
    `journey-${variant.name}-reverse.mp4`,
  );

  if (!existsSync(source)) {
    throw new Error(`Missing source video: ${source}`);
  }

  const workspace = mkdtempSync(join(tmpdir(), `hawaii-reverse-${variant.name}-`));
  const chunks = [];

  try {
    for (let end = frameCount; end > 0; end -= chunkFrames) {
      const start = Math.max(0, end - chunkFrames);
      const count = end - start;
      const chunk = join(workspace, `chunk-${String(chunks.length).padStart(3, "0")}.mp4`);
      chunks.push(chunk);

      run([
        "-hide_banner",
        "-loglevel",
        "error",
        "-ss",
        (start / fps).toFixed(6),
        "-i",
        source,
        "-map_metadata",
        "-1",
        "-an",
        "-sn",
        "-dn",
        "-vf",
        `trim=start_frame=0:end_frame=${count},setpts=PTS-STARTPTS,reverse,setpts=N/(${fps}*TB)`,
        "-frames:v",
        String(count),
        "-r",
        String(fps),
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-b:v",
        variant.bitrate,
        "-maxrate",
        variant.maxrate,
        "-bufsize",
        variant.buffer,
        "-profile:v",
        "main",
        "-pix_fmt",
        "yuv420p",
        "-g",
        String(fps),
        "-keyint_min",
        String(fps),
        "-sc_threshold",
        "0",
        "-threads",
        "2",
        "-filter_threads",
        "1",
        "-filter_complex_threads",
        "1",
        "-movflags",
        "+faststart",
        "-y",
        chunk,
      ]);
    }

    const manifest = join(workspace, "chunks.txt");
    writeFileSync(
      manifest,
      chunks.map((chunk) => `file '${chunk.replaceAll("'", "'\\''")}'`).join("\n"),
    );
    const staged = join(workspace, basename(destination));

    run([
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      manifest,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      "-y",
      staged,
    ]);

    run([
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      staged,
      "-map",
      "0:v:0",
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      "-y",
      destination,
    ]);
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
}
