# Workspace

## Overview

Tax Deliver Letterhead — a personal utility web app for the firm Tax Deliver Pvt. Ltd. The user uploads a CompuTax computation PDF, and the app stamps the firm's branded header (TD logo + wordmark + tagline) and footer (firm address, phone, web, email) on every page, then returns the finished PDF for download.

## Architecture

- `artifacts/letterhead` — React + Vite single-page frontend (drag-and-drop upload, calls API with multipart form data, downloads the resulting PDF).
- `artifacts/api-server` — Express server with `POST /api/letterhead/apply`. Uses `multer` (memory storage, 25 MB cap) and `pdf-lib` to stamp the brand header/footer on each page of the uploaded PDF. Brand logo bytes are inlined as base64 in `src/assets/logo.ts`.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, Tailwind, shadcn/ui, framer-motion, wouter
- **API framework**: Express 5
- **PDF processing**: `pdf-lib` + `multer`
- **Database**: PostgreSQL + Drizzle ORM (not currently used)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
