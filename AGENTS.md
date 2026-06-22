# NTP — Agent Instructions

Dự án quản lý thành viên HTTL Nguyễn Tri Phương.

## Workflow "Tiếp tục"

User có thể nói **"tiếp tục"** để agent thực hiện bước tiếp theo chưa hoàn thành.

**Đọc trước khi làm:**
- `docs/progress.json` — trạng thái
- `docs/workflow-steps.json` — hành động chi tiết
- `docs/WORKFLOW-EXECUTOR.md` — quy trình đầy đủ

**Rule:** `.cursor/rules/workflow-continue.mdc`

## Tiến độ nhanh

Đã hoàn thành: BA docs (1.1–1.3), Architecture (2.1–2.5), Test plan (4.1).

**Bước tiếp theo:** `0.1` — Setup VPS (manual).

## Stack

Next.js 15 + PostgreSQL + Prisma + NextAuth + Tailwind + shadcn/ui. Server Actions, không backend riêng.

## Docs

| File | Nội dung |
|------|----------|
| `docs/00-WORKFLOW-MASTER.md` | Checklist tổng |
| `docs/01-ba/` | Requirements |
| `docs/02-architecture/` | Schema, sitemap, API, UI |
| `docs/04-server/` | Server setup, deploy |
