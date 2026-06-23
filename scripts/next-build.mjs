/**
 * Build production — ép NODE_ENV=production cho hosting DirectAdmin/cPanel.
 * Panel thường set NODE_ENV=nodejs (non-standard) → lỗi Html trên /404, /500.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function runNpm(args) {
  return spawnSync("npm", args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: true,
  });
}

function ensurePrismaClient() {
  console.log("[build] prisma generate ...");
  const gen = spawnSync(process.execPath, [
    join(root, "scripts", "prisma-generate.mjs"),
    "--required",
  ], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });

  if (gen.status !== 0) {
    process.exit(1);
  }
}

function ensureBuildDeps() {
  const tailwindPostcss = join(root, "node_modules", "@tailwindcss", "postcss");
  if (existsSync(tailwindPostcss)) return;

  console.warn(
    "[build] Thiếu @tailwindcss/postcss — thường do chưa npm install sau git pull.",
  );
  console.warn("[build] Đang cài @tailwindcss/postcss tailwindcss ...");

  const install = runNpm([
    "install",
    "@tailwindcss/postcss@^4",
    "tailwindcss@^4",
    "--no-save",
  ]);

  if (install.status !== 0 || !existsSync(tailwindPostcss)) {
    console.error(
      "[build] Không cài được @tailwindcss/postcss. Chạy thủ công:",
    );
    console.error("  npm install");
    console.error("  npm install @tailwindcss/postcss tailwindcss --save");
    process.exit(1);
  }
}

const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(nextBin)) {
  console.error("[build] Không tìm thấy next. Chạy: npm install");
  process.exit(1);
}

ensurePrismaClient();
ensureBuildDeps();

const env = { ...process.env, NODE_ENV: "production" };

console.log("[build] NODE_ENV shell:", process.env.NODE_ENV ?? "(unset)");
console.log("[build] NODE_ENV build:", env.NODE_ENV);

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  env,
  stdio: "inherit",
});

process.exit(result.status === null ? 1 : result.status);
