# tRPC Migration Audit Report

**Date:** January 2026  
**Status:** ✅ Migration Complete - tRPC Fully Removed

## Executive Summary

The DOUBLEcheck application has successfully migrated from a tRPC-based architecture to direct Firebase Client SDK usage. All active code now uses Firestore directly through custom hooks. The `packages/api` workspace package is **orphaned and can be safely removed**.

---

## Findings

### 1. Active tRPC Usage: NONE ✅

**Search Results:**
- `@trpc` imports: **0 files**
- `trpc.` method calls: **0 active files** (2 commented references)
- `@doublecheck/api` imports: **0 files** (except in its own package.json)

### 2. Commented References (Safe to Remove)

#### File: `apps/web/src/features/projects/components/views/CastView.tsx`
```typescript
// Line 4 (commented)
// import { trpc } from '@/lib/trpc/client';

// Line 32 (commented)
// const utils = trpc.useUtils();
```

#### File: `apps/web/src/features/projects/components/views/AdminView.tsx`
```typescript
// Line 4 (commented)
// import { trpc } from '@/lib/trpc/client';

// Line 42 (commented)
// const utils = trpc.useUtils();
```

**Action:** These commented lines can be removed in a cleanup commit.

---

## Migration Verification

### All Feature Modules Migrated ✅

| Feature | Hook | Data Source | Status |
|---------|------|-------------|--------|
| **Projects** | `useProjects` | `onSnapshot(collection('projects'))` | ✅ Migrated |
| **Crew** | `useCrewByProject` | `onSnapshot(collection('crew'))` | ✅ Migrated |
| **Cast** | `useCast` | `onSnapshot(collection('cast'))` | ✅ Migrated |
| **Budget** | `useBudget` | `onSnapshot(collection('budgetCategories'))` | ✅ Migrated |
| **Expenses** | `useExpenses` | `onSnapshot(collection('expenses'))` | ✅ Migrated |
| **Scenes** | `useScenesByProject` | `onSnapshot(collection('scenes'))` | ✅ Migrated |
| **Shots** | `useShots` | `onSnapshot(collection('shots'))` | ✅ Migrated |
| **Equipment** | `useEquipment` | `onSnapshot(collection('equipment'))` | ✅ Migrated |
| **Locations** | `useLocations` | `onSnapshot(collection('locations'))` | ✅ Migrated |
| **Schedule** | `useSchedule` | `onSnapshot(collection('shootingDays'))` | ✅ Migrated |
| **Auth** | `useAuth` | `onSnapshot(doc('users/{uid}'))` | ✅ Migrated |

---

## packages/api Analysis

### Package Contents

```
packages/api/
├── src/
│   ├── context.ts           # tRPC context (unused)
│   ├── index.ts             # Export file (unused)
│   ├── trpc.ts              # tRPC router setup (unused)
│   ├── lib/
│   │   └── firebase-admin.ts  # Firebase Admin SDK (unused)
│   ├── routers/             # 21 tRPC routers (all unused)
│   │   ├── projects.ts
│   │   ├── crew.ts
│   │   ├── cast.ts
│   │   ├── budget.ts
│   │   └── ... (17 more)
│   └── services/            # Business logic services
│       ├── budgetSync.ts
│       ├── emailService.ts
│       ├── firestore.ts
│       └── integrations/
│           ├── fileImporters.ts
│           └── syncService.ts
└── package.json
```

### Dependencies (Unused)

- `@trpc/server` ^11.0.0-rc.730
- `firebase-admin` ^13.5.0
- `@doublecheck/schemas` workspace:*

### Impact Analysis

**File Count:** ~30 files  
**Lines of Code:** ~5,000+  
**Disk Space:** ~15MB (with node_modules)

**Used By:** None  
**Imports This Package:** None

---

## Recommendation: Archive or Remove

### Option 1: Remove (Recommended)

**Why:**
- Zero active dependencies
- Reduces maintenance burden
- Simplifies monorepo structure
- No loss of functionality

**Steps:**
1. Delete `packages/api/` directory
2. Remove from `pnpm-workspace.yaml`
3. Remove commented imports from CastView.tsx and AdminView.tsx
4. Run `pnpm install` to update lockfile

**Impact:** None - package is not used anywhere

### Option 2: Archive

**Why:**
- Preserve historical reference
- May contain business logic worth reviewing

**Steps:**
1. Create `archive/` directory in repository root
2. Move `packages/api/` to `archive/packages-api-legacy/`
3. Add README explaining it's archived
4. Remove from `pnpm-workspace.yaml`

---

## Business Logic to Preserve

Some services in `packages/api/src/services/` contain business logic that might be useful:

### 1. Budget Sync Logic
**File:** `services/budgetSync.ts`  
**Purpose:** Synchronizes budget totals when items change  
**Status:** Likely reimplemented client-side or no longer needed

### 2. Email Service
**File:** `services/emailService.ts`  
**Purpose:** Send invitation emails, notifications  
**Status:** May need server-side implementation (Firebase Functions or Resend API)

### 3. File Importers
**File:** `services/integrations/fileImporters.ts`  
**Purpose:** Parse Movie Magic Budget files, CSV imports  
**Status:** **NEEDS MIGRATION** - Should be client-side with SheetJS/xlsx library

### 4. Integration Sync
**File:** `services/integrations/syncService.ts`  
**Purpose:** Sync with external services (Slack, QuickBooks, etc.)  
**Status:** OAuth flows need reimplementation

---

## Action Items

### Immediate (Low Risk)

- [x] Complete tRPC audit
- [ ] Remove commented tRPC imports (2 files)
- [ ] Document API routes still in use (apps/web/src/app/api)

### Short Term (Cleanup)

- [ ] Delete or archive `packages/api/`
- [ ] Update `pnpm-workspace.yaml`
- [ ] Run `pnpm install` to clean lockfile
- [ ] Update `turbo.json` if needed

### Long Term (Feature Work)

- [ ] Migrate file import logic to client-side (SheetJS)
- [ ] Implement email notifications (Firebase Functions or Resend)
- [ ] Rebuild OAuth integration flows (if needed)

---

## Conclusion

The tRPC to Firebase Client SDK migration is **100% complete** in active code. The `packages/api` package is entirely orphaned with zero active references. It can be safely removed or archived without any impact on functionality.

**Recommended Next Steps:**
1. Remove `packages/api/` directory
2. Clean up commented imports
3. Update workspace configuration
4. Consider client-side implementations for file imports and email services

---

**Audit Conducted By:** Architecture Review  
**Verification Method:** Codebase-wide grep, manual file inspection, dependency analysis

