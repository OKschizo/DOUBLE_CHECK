# DoubleCheck - Film Production Management Platform

A modern, type-safe film production management system built with Next.js, tRPC, and Firebase.

## 🏗️ Architecture

This is a Turborepo monorepo with the following structure:

```
doublecheck/
├── apps/
│   └── web/                  # Next.js 14 app (App Router)
├── packages/
│   ├── api/                  # tRPC API layer
│   ├── schemas/              # Zod validation schemas
│   ├── ui/                   # Shared UI components
│   └── config/               # Shared configurations
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PNPM >= 8.0.0

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

## 📦 Package Overview

### `apps/web`
Next.js 14 application with:
- Feature-based folder structure
- Server & Client components
- tRPC integration
- Firebase authentication

### `packages/schemas`
Shared Zod schemas for:
- Type safety
- Runtime validation
- API contracts

### `packages/api`
tRPC API layer providing:
- Type-safe API routes
- Authentication middleware
- Business logic

### `packages/ui`
Shared UI components built with:
- Tailwind CSS
- Shadcn/ui
- Radix UI primitives

## 🧞 Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | Type-check all packages |
| `pnpm clean` | Clean all build artifacts and node_modules |

## 🏛️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **API Layer**: tRPC
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Validation**: Zod
- **Monorepo**: Turborepo + PNPM

## 📝 License

MIT

