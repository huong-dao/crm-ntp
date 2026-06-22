/**
 * Build production — ép NODE_ENV=production cho hosting DirectAdmin/cPanel.
 * Panel thường set NODE_ENV=nodejs (non-standard) → lỗi Html trên /404, /500.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(nextBin)) {
  console.error("[build] Không tìm thấy next. Chạy: npm install");
  process.exit(1);
}

const env = { ...process.env, NODE_ENV: "production" };

console.log("[build] NODE_ENV shell:", process.env.NODE_ENV ?? "(unset)");
console.log("[build] NODE_ENV build:", env.NODE_ENV);

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  env,
  stdio: "inherit",
});

process.exit(result.status === null ? 1 : result.status);
