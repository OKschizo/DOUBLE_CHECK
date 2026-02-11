# Firebase Deployment Guide

> **Project:** DOUBLEcheck  
> **Firebase Project ID:** doublecheck-9f8c1  
> **Hosting Site:** doublecheck22

---

## 🚀 Quick Deploy (Recommended Method)

### Option 1: Deploy to Vercel (Easiest)

Since your app uses Next.js with dynamic routes, **Vercel is the simplest option**:

```bash
cd apps/web
vercel
```

**Advantages:**
- ✅ Zero configuration needed
- ✅ Automatic SSL
- ✅ Preview deployments for every PR
- ✅ Fast global CDN
- ✅ Still uses Firebase for database/auth/storage

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in `apps/web` directory
3. Follow prompts to link/create project
4. Done! Your app is deployed

---

## Option 2: Firebase Hosting + Cloud Functions (Complex)

Your current `firebase.json` is configured for Firebase hosting with SSR via Cloud Functions. This requires additional setup.

### Prerequisites

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify project
firebase projects:list
```

### Step 1: Build the Application

```bash
# From project root
cd doublecheck

# Install dependencies
pnpm install

# Build the app
cd apps/web
pnpm build
```

### Step 2: Initialize Firebase Hosting (if not done)

```bash
# From project root (doublecheck/)
firebase init hosting

# Select:
# - Use existing project: doublecheck-9f8c1
# - Public directory: .firebase/doublecheck22/hosting
# - Configure as single-page app: No
# - Set up automatic builds with GitHub: No (optional)
```

### Step 3: Deploy to Firebase

**Deploy Everything:**
```bash
firebase deploy
```

**Deploy Only Hosting:**
```bash
firebase deploy --only hosting
```

**Deploy Only Rules:**
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## Option 3: Google Cloud Run (Containerized)

Use Docker for full control over the deployment environment.

### Step 1: Build Docker Image

```bash
# From project root
docker build -t doublecheck .
```

### Step 2: Deploy to Cloud Run

```bash
# Tag for Google Container Registry
docker tag doublecheck gcr.io/doublecheck-9f8c1/doublecheck

# Push to registry
docker push gcr.io/doublecheck-9f8c1/doublecheck

# Deploy to Cloud Run
gcloud run deploy doublecheck \
  --image gcr.io/doublecheck-9f8c1/doublecheck \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project doublecheck-9f8c1
```

Or use the convenience script:

```bash
./scripts/deploy-cloudrun.sh
```

---

## 🔧 Current Setup Analysis

Your project is currently configured with:

### firebase.json Configuration

```json
{
  "hosting": {
    "site": "doublecheck22",
    "public": ".firebase/doublecheck22/hosting",
    "rewrites": [
      {
        "source": "**",
        "function": "ssrdoublecheck22"
      }
    ]
  }
}
```

**⚠️ Issue:** This expects a Cloud Function called `ssrdoublecheck22` which may not exist.

### Recommended Configuration for Static Deployment

If you want pure Firebase Hosting (no Cloud Functions), update `firebase.json`:

```json
{
  "firestore": {
    "indexes": "firestore.indexes.json",
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "apps/web/out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Then enable static export in `apps/web/next.config.js`:

```javascript
const nextConfig = {
  output: 'export',  // Enable static export
  // ... rest of config
};
```

**But note:** This won't work with dynamic routes like `[projectId]` unless you pre-generate all paths.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set:

**For Local Development (`.env.local`):**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBKS_cGxwhPAIiSLMsKvo-KIh_bi2MmXMo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=doublecheck-9f8c1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=doublecheck-9f8c1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=doublecheck-9f8c1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=672207092025
NEXT_PUBLIC_FIREBASE_APP_ID=1:672207092025:web:8765da71fdbae52ee790e8
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

**For Vercel:** Add these in the Vercel dashboard under "Environment Variables"

**For Cloud Run:** Pass via `--set-env-vars` flag

### 2. Firebase Rules

Deploy your security rules before deploying the app:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 3. Build Test

Test the build locally:

```bash
cd apps/web
pnpm build
pnpm start
```

Visit http://localhost:3000 to verify.

### 4. Type Check (Optional)

Since `ignoreBuildErrors: true` is set in next.config.js, TypeScript errors won't block the build. To check for errors:

```bash
pnpm type-check
```

---

## 🎯 Recommended Deployment Strategy

Based on your architecture (Firebase Client SDK + Next.js), here's the recommended approach:

### Best Option: Vercel

**Why Vercel?**
- ✅ Works perfectly with Next.js App Router
- ✅ Supports dynamic routes (`[projectId]`)
- ✅ No complex configuration needed
- ✅ Your app still connects to Firebase (database, auth, storage)
- ✅ Free tier is generous
- ✅ Automatic preview deployments

**Deployment Steps:**

```bash
# 1. Deploy Firestore rules first
firebase deploy --only firestore:rules,storage:rules

# 2. Install Vercel CLI
npm install -g vercel

# 3. Navigate to web app
cd apps/web

# 4. Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? doublecheck
# - Directory? ./
# - Override settings? No

# 5. Set environment variables in Vercel dashboard
# Go to: https://vercel.com/your-username/doublecheck/settings/environment-variables
# Add all NEXT_PUBLIC_* variables

# 6. Redeploy with env vars
vercel --prod
```

---

## 🔥 Alternative: Pure Firebase Hosting Setup

If you want to use Firebase Hosting exclusively, you need to modify your setup:

### Step 1: Update next.config.js

**Option A: Keep SSR (Requires Firebase Functions)**

Keep current config but ensure Firebase Functions are properly set up.

**Option B: Static Export (No Functions)**

```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // ... rest
};
```

**⚠️ Limitation:** Static export doesn't support:
- Dynamic routes without pre-generation
- API routes
- Server-side rendering

### Step 2: Update firebase.json

For static export:

```json
{
  "hosting": {
    "public": "apps/web/out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "cleanUrls": true,
    "trailingSlash": false,
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 3: Build and Deploy

```bash
cd apps/web
pnpm build
cd ../..
firebase deploy --only hosting
```

---

## 🛠️ Troubleshooting

### Build Fails with Type Errors

**Solution:** Already handled! Your `next.config.js` has:
```javascript
typescript: {
  ignoreBuildErrors: true,
}
```

To see errors without blocking build:
```bash
pnpm type-check
```

### "Firebase Function not found"

**Cause:** `firebase.json` references `ssrdoublecheck22` function that doesn't exist.

**Solution:** Either:
1. Use Vercel instead (recommended)
2. Set up Firebase Functions properly
3. Use static export (see above)

### "Permission denied" in production

**Cause:** Firestore rules are too restrictive or incorrect.

**Solution:** Review and deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Environment variables not working

**Cause:** Variables not set in deployment environment.

**Solution:** 
- **Vercel:** Add in dashboard
- **Cloud Run:** Use `--set-env-vars`
- **Firebase:** Set in `.env.production`

---

## 📊 Deployment Comparison

| Feature | Vercel | Firebase Hosting | Cloud Run |
|---------|--------|------------------|-----------|
| **Setup Complexity** | ⭐ Easy | ⭐⭐⭐ Complex | ⭐⭐ Medium |
| **Next.js Support** | ✅ Excellent | ⚠️ Experimental | ✅ Good |
| **Dynamic Routes** | ✅ Yes | ⚠️ Needs Functions | ✅ Yes |
| **Auto Scaling** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Free Tier** | ✅ Generous | ✅ Good | ⚠️ Limited |
| **Firebase Integration** | ✅ Perfect | ✅ Native | ✅ Perfect |
| **Preview Deploys** | ✅ Automatic | ❌ Manual | ❌ Manual |
| **Best For** | Most projects | Static sites | Enterprise |

---

## ✅ Step-by-Step: Deploy to Vercel (Recommended)

### 1. Prepare Firebase

```bash
# Deploy rules first
firebase deploy --only firestore:rules,storage:rules
```

### 2. Install Vercel

```bash
npm install -g vercel
```

### 3. Deploy

```bash
cd apps/web
vercel
```

### 4. Configure Environment Variables

Go to Vercel dashboard → Project → Settings → Environment Variables

Add:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (if using maps)
- `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)

### 5. Redeploy

```bash
vercel --prod
```

### 6. Verify

Visit your Vercel URL and test:
- ✅ Login works
- ✅ Projects load
- ✅ Real-time updates work
- ✅ Images load from Firebase Storage

---

## 🎉 You're Done!

Your DOUBLEcheck app is now deployed and connected to Firebase for:
- 📊 **Database:** Firestore (real-time)
- 🔐 **Authentication:** Firebase Auth
- 📁 **Storage:** Firebase Storage
- 🌐 **Hosting:** Vercel/Firebase/Cloud Run

**Next Steps:**
1. Set up custom domain (optional)
2. Monitor performance in Firebase Console
3. Review Firestore rules for production
4. Set up monitoring/alerts

---

**Questions?** Check the documentation:
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture details
- [README.md](README.md) - General setup
- [Firebase Console](https://console.firebase.google.com/project/doublecheck-9f8c1)

---

**Last Updated:** January 2026  
**Deployment Status:** Ready to deploy! 🚀

