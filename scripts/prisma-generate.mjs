/**
 * prisma generate — dùng đường dẫn schema tuyệt đối (ổn định trên DirectAdmin).
 * postinstall: bỏ qua nếu chưa có schema (không làm fail npm install).
 * build: --required → fail nếu không generate được.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = join(root, "prisma", "schema.prisma");
const required = process.argv.includes("--required");

if (!existsSync(schemaPath)) {
  console.warn("[prisma] Không tìm thấy:", schemaPath);
  console.warn("[prisma] cwd hiện tại:", process.cwd());
  console.warn(
    "[prisma] Cần git pull đầy đủ (có folder prisma/) và chạy lệnh trong app root."
  );
  console.warn(
    "[prisma] DirectAdmin: Application root = .../nodevenv/nodejs/24/lib (thư mục có package.json + prisma/)"
  );
  process.exit(required ? 1 : 0);
}

console.log("[prisma] generate", schemaPath);

const result = spawnSync(
  "npx",
  ["prisma", "generate", `--schema=${schemaPath}`],
  {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: true,
  }
);

if (result.status !== 0) {
  console.error("[prisma] generate thất bại.");
  process.exit(required ? 1 : 0);
}

const clientPath = join(root, "node_modules", ".prisma", "client");
if (!existsSync(clientPath)) {
  console.error("[prisma] Client chưa được tạo sau generate.");
  process.exit(required ? 1 : 0);
}
