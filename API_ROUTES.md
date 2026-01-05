# API Routes Documentation

> **Status:** No Active Routes (January 2026)  
> **Architecture:** Client-side Direct Firebase Access

---

## Summary

The `apps/web/src/app/api/` directory contains **empty placeholder directories** with no active Next.js API routes. All data access is handled client-side through Firebase SDK.

---

## Directory Structure

```
apps/web/src/app/api/
├── geocode/                  # Empty - No route files
├── integrations/             
│   ├── import/              # Empty - No route files
│   └── oauth/
│       └── [provider]/
│           └── callback/    # Empty - No route files
└── maps/
    ├── dark/                # Empty - No route files
    └── embed/               # Empty - No route files
```

**File Count:** 0 active route handlers  
**Status:** All directories are placeholders

---

## Historical Context

### Why These Directories Exist

These directories were created during the original tRPC architecture when the following server-side routes were planned:

1. **Geocoding API** (`/api/geocode`)
   - **Purpose:** Convert addresses to coordinates for location management
   - **Status:** Never implemented or migrated to client-side Google Maps API

2. **Integration Imports** (`/api/integrations/import`)
   - **Purpose:** Server-side parsing of Movie Magic Budget files, CSV imports
   - **Status:** Placeholder only - functionality not implemented

3. **OAuth Callbacks** (`/api/integrations/oauth/[provider]/callback`)
   - **Purpose:** Handle OAuth redirect callbacks for Slack, QuickBooks, etc.
   - **Status:** Placeholder only - OAuth not implemented

4. **Map Tiles** (`/api/maps/dark`, `/api/maps/embed`)
   - **Purpose:** Custom map style endpoints or proxies
   - **Status:** Placeholder only - using Google Maps directly

---

## Current Implementation

### Geocoding

**Current Approach:** Client-side Google Maps Geocoding API

```typescript
// Client-side implementation (if used)
const geocodeAddress = async (address: string) => {
  const geocoder = new google.maps.Geocoder();
  const result = await geocoder.geocode({ address });
  return result.results[0].geometry.location;
};
```

**Location:** Likely in `features/locations/` components

### File Imports

**Current Status:** Not implemented

**Recommended Approach:** Client-side file parsing

```typescript
// Example: Client-side CSV/Excel parsing
import * as XLSX from 'xlsx';

const handleFileUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const workbook = XLSX.read(e.target?.result, { type: 'binary' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    // Process data
  };
  reader.readAsBinaryString(file);
};
```

### OAuth Integrations

**Current Status:** Not implemented

**Recommended Approach:** Firebase Cloud Functions

For secure OAuth flows, implement as separate Cloud Functions:

```typescript
// functions/src/integrations/slack-oauth.ts
export const slackOAuthCallback = functions.https.onRequest(async (req, res) => {
  const { code } = req.query;
  // Exchange code for token
  // Store in Firestore
  res.redirect('/dashboard/integrations');
});
```

### Maps

**Current Approach:** Direct Google Maps JavaScript API integration

No custom tile server needed - using Google Maps directly in components.

---

## Recommendations

### 1. Clean Up Empty Directories ✅

Since these directories contain no code, they can be safely removed:

```bash
# From apps/web/src/app/
rm -rf api/geocode
rm -rf api/integrations
rm -rf api/maps
```

**Impact:** None - no code references these paths

### 2. Document Intended Features 📝

If these features are planned for future:

#### Geocoding
- **Use:** Google Maps Geocoding API client-side
- **No server route needed**

#### File Imports
- **Use:** SheetJS (xlsx) for client-side parsing
- **No server route needed** (unless files > 10MB)

#### OAuth
- **Use:** Firebase Cloud Functions in separate `functions/` directory
- **Deploy:** `firebase deploy --only functions`
- **Structure:**
  ```
  functions/
  ├── src/
  │   └── integrations/
  │       ├── slack-oauth.ts
  │       ├── quickbooks-oauth.ts
  │       └── wrapbook-oauth.ts
  └── package.json
  ```

#### Maps
- **Use:** Google Maps JavaScript API directly
- **No custom tile server needed**

### 3. Alternative: Document as Placeholders

If keeping directories for future use, add README files:

```markdown
# API Route Placeholder

This directory is reserved for future API routes.

**Planned Feature:** [Description]
**Status:** Not Implemented
**See:** [Link to tracking issue]
```

---

## Server-Side Features Checklist

If you need server-side functionality in the future:

### When to Use Next.js API Routes

✅ **Use API Routes for:**
- Webhook receivers (e.g., Stripe, Slack events)
- Server-side API key protection
- Heavy file processing (> 10MB files)
- Rate-limited operations
- Server-to-server communication

❌ **Don't Use API Routes for:**
- Simple CRUD operations (use Firestore directly)
- Real-time data (use Firestore `onSnapshot`)
- Client-side file processing (use Web APIs)
- OAuth callbacks (use Cloud Functions)

### When to Use Firebase Cloud Functions

✅ **Use Cloud Functions for:**
- Scheduled tasks (cron jobs)
- Database triggers (onCreate, onUpdate)
- Background processing
- Email sending (SendGrid, Resend)
- OAuth flows
- Webhooks

---

## Migration Path (If Needed)

### If You Need to Add Server Routes

1. **Create route handler:**
   ```typescript
   // apps/web/src/app/api/my-route/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   
   export async function GET(request: NextRequest) {
     // Handle request
     return NextResponse.json({ data: 'response' });
   }
   ```

2. **Call from client:**
   ```typescript
   const response = await fetch('/api/my-route');
   const data = await response.json();
   ```

3. **Add to documentation** (this file)

---

## Current State Summary

| Directory | Files | Status | Action |
|-----------|-------|--------|--------|
| `api/geocode/` | 0 | Empty | ✅ Can be removed |
| `api/integrations/import/` | 0 | Empty | ✅ Can be removed |
| `api/integrations/oauth/` | 0 | Empty | ✅ Can be removed |
| `api/maps/dark/` | 0 | Empty | ✅ Can be removed |
| `api/maps/embed/` | 0 | Empty | ✅ Can be removed |

**Total API Routes:** 0  
**Recommendation:** Remove all empty API directories or document as placeholders

---

## Conclusion

The DOUBLEcheck application currently has **no server-side API routes** and operates entirely on client-side Firebase SDK calls. The empty API directories are artifacts from the original architecture planning and can be safely removed.

If server-side functionality is needed in the future, consider:
1. **Next.js API Routes** - For simple server operations
2. **Firebase Cloud Functions** - For background tasks, triggers, OAuth
3. **Edge Functions** - For globally distributed logic

---

## Related Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Overall architecture
- **[TRPC_AUDIT.md](TRPC_AUDIT.md)** - tRPC removal audit
- **[CODEBASE_MAP.md](CODEBASE_MAP.md)** - Code structure

---

**Last Updated:** January 2026  
**Audit Status:** ✅ Complete - No active routes found

