# Refactor Plan: Migration to Static Firebase Hosting

> **⚠️ STATUS: COMPLETED (January 2026)**  
> This document is kept for historical reference. The migration described here has been successfully completed.
> 
> **Current Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md)  
> **Migration Audit:** See [TRPC_AUDIT.md](TRPC_AUDIT.md)

---

## ✅ Migration Completed

The application has been successfully migrated from a tRPC + Firebase Admin SDK architecture to a direct Firebase Client SDK architecture. All phases outlined in this plan have been completed.

### What Was Accomplished

✅ **Phase 1: Preparation & Configuration** - COMPLETE
- Removed Firebase Admin SDK usage
- Removed tRPC server-side logic
- Updated to client-side only architecture

✅ **Phase 2: Migrate Core Features** - COMPLETE
- Projects feature: Migrated to `useProjects` with `onSnapshot`
- Crew & Cast: Migrated to direct Firestore calls
- Budget & Items: Migrated to client-side hooks
- All features now use Firebase Client SDK directly

✅ **Phase 3: Security & Rules** - PARTIAL
- Firestore rules deployed (currently permissive)
- ⚠️ **TODO:** Tighten security rules for production

✅ **Phase 4: Cleanup** - MOSTLY COMPLETE
- Deleted API routes for tRPC
- ⚠️ **Remaining:** `packages/api` can be removed (see TRPC_AUDIT.md)

---

## Original Plan (Historical Reference)

This section preserves the original migration plan for reference.

### Original Goal

Deploy `apps/web` as purely static files (HTML/JS/CSS) to Firebase Hosting. No Cloud Functions for rendering.

### Original Problem Statement

The application relied on:
- **TRPC** for server-side API routing
- **Firebase Admin SDK** for privileged database access
- **Node.js server** for SSR and API endpoints

This prevented:
- Static HTML export
- Edge deployment
- Simple Firebase Hosting deployment

---

## Migration History

### Phase 1: Preparation & Configuration ✅

**Completed Actions:**
- ✅ Disabled Firebase Admin SDK initialization
- ✅ Removed webpack externals configuration
- ✅ Updated client-side helpers in `src/lib/firebase/`

### Phase 2: Migrate Core Features (Data Layer) ✅

**Migrated Features:**

#### A. Projects Feature ✅
- ✅ `useProjects` - Query projects by orgId with real-time updates
- ✅ `useProject` - Single project subscription
- ✅ `useCreateProject` - Create with Firestore `addDoc`
- ✅ `useUpdateProject` - Update with `updateDoc`
- ✅ `useDeleteProject` - Delete with `deleteDoc`

**Implementation:** `src/features/projects/hooks/useProjects.ts`

#### B. Crew & Cast ✅
- ✅ `useCrewByProject` - Real-time crew list
- ✅ `useCast` - Real-time cast list
- ✅ CRUD operations for both

**Implementation:** 
- `src/features/crew/hooks/useCrew.ts`
- `src/features/cast/hooks/useCast.ts`

#### C. Budget & Items ✅
- ✅ `useBudget` - Budget categories
- ✅ `useExpenses` - Expense tracking
- ✅ Budget templates (film, commercial, documentary, etc.)

**Note:** Import functionality moved client-side (if implemented with SheetJS)

#### D. All Other Features ✅
- ✅ Equipment tracking
- ✅ Locations management
- ✅ Scenes & shots
- ✅ Schedule management
- ✅ Integrations (placeholder)

### Phase 3: Security & Rules ⚠️ PARTIAL

**Completed:**
- ✅ Basic authentication rules deployed
- ✅ Read/write allowed for authenticated users

**Remaining Work:**
- ⚠️ Implement organization-level access control
- ⚠️ Add role-based permissions (admin, member, viewer)
- ⚠️ Validate resource ownership in rules

**Recommended Rules Pattern:**

```javascript
match /projects/{projectId} {
  allow read: if isOrgMember(resource.data.orgId);
  allow create: if isAuthenticated() && request.resource.data.orgId == getUserOrg();
  allow update, delete: if isProjectMember(projectId);
}
```

### Phase 4: Cleanup ⚠️ MOSTLY COMPLETE

**Completed:**
- ✅ Deleted `src/app/api/trpc` directory
- ✅ Removed tRPC dependencies from active code
- ✅ Migrated all data access to client SDK

**Remaining:**
- ⚠️ Delete or archive `packages/api` directory (see TRPC_AUDIT.md)
- ⚠️ Remove commented tRPC imports (2 files)
- ⚠️ Uninstall unused server dependencies

---

## Current Architecture (Post-Migration)

### Data Flow

```
User Browser
  → React Component
    → Custom Hook (useX)
      → Firebase Client SDK
        → Firestore (Real-time)
          → Security Rules (Validation)
```

### Key Changes

| Aspect | Before (tRPC) | After (Firebase Client) |
|--------|--------------|-------------------------|
| **Data Fetching** | `trpc.projects.list.useQuery()` | `onSnapshot(collection('projects'))` |
| **Mutations** | `trpc.projects.create.mutate()` | `addDoc(collection('projects'))` |
| **Database Access** | Firebase Admin SDK (server) | Firebase Client SDK (browser) |
| **Security** | tRPC middleware | Firestore Security Rules |
| **Deployment** | Cloud Functions (SSR) | Static hosting or any CDN |
| **Real-time** | Requires setup | Built-in with `onSnapshot` |

---

## Lessons Learned

### What Worked Well ✅

1. **Real-time by Default:** `onSnapshot` provides better UX than polling
2. **Simpler Deployment:** No server infrastructure needed
3. **Type Safety Maintained:** Zod schemas still provide validation
4. **Performance:** Direct Firestore access is fast
5. **Scalability:** No server bottleneck

### Challenges Encountered ⚠️

1. **Security Rules Complexity:** Moving logic from server to rules requires careful planning
2. **OAuth Flows:** Some integrations need server-side components (Firebase Functions)
3. **File Processing:** Large file parsing better on server (but can use Web Workers)
4. **Email Sending:** Requires server-side implementation (Firebase Functions + SendGrid/Resend)

### Future Considerations 🚀

1. **Cloud Functions:** For email, webhooks, scheduled tasks
2. **Client-Side Optimization:** Web Workers for heavy processing
3. **Offline Support:** Firestore offline persistence
4. **Performance Monitoring:** Firebase Performance SDK

---

## Related Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Current architecture documentation
- **[TRPC_AUDIT.md](TRPC_AUDIT.md)** - tRPC removal audit report
- **[CODEBASE_MAP.md](CODEBASE_MAP.md)** - Codebase structure reference
- **[README.md](README.md)** - Getting started guide

---

## Conclusion

The migration from tRPC + Firebase Admin to Firebase Client SDK was successful and resulted in:

- ✅ Simpler architecture
- ✅ Better real-time capabilities
- ✅ Easier deployment
- ✅ Reduced infrastructure costs
- ✅ Improved developer experience

**Next Steps for Production:**

1. Tighten Firestore security rules
2. Remove legacy `packages/api` code
3. Implement server-side functions for email/webhooks if needed
4. Add comprehensive error handling and monitoring

---

**Migration Completed:** January 2026  
**Original Plan Created:** 2025  
**Status:** ✅ Archived - Kept for historical reference
