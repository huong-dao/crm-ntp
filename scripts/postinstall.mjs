import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = join(root, "prisma", "schema.prisma");

if (!existsSync(schema)) {
  console.warn(
    "[postinstall] Bỏ qua prisma generate — chưa có prisma/schema.prisma.\n" +
      "  → Chạy: git pull origin main (trong thư mục có package.json)"
  );
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "generate"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);
