# Simple Deployment Guide for DOUBLEcheck

## TL;DR - Deploy Your App

```bash
pnpm deploy
```

That's it! This will build and deploy your app to Google Cloud Run, which is fully integrated with Firebase.

## Managing Your App

### ✅ YES - You Can Still Use Firebase Console!

Your app is deployed to Cloud Run, which is **fully integrated with Firebase**. You can manage it from:

1. **Firebase Console** (Recommended): https://console.firebase.google.com/project/doublecheck-9f8c1
   - View all your services (Firestore, Storage, Authentication, Hosting)
   - Your Cloud Run service appears under "Functions" or "Extensions"
   - Manage environment variables
   - View logs and analytics

2. **Cloud Run Console**: https://console.cloud.google.com/run?project=doublecheck-9f8c1
   - More detailed Cloud Run-specific settings
   - Traffic splitting, revisions, etc.

**Both consoles manage the SAME service!** Use whichever you prefer.

## Why This Approach?

Your app uses a **pnpm monorepo** structure:
```
apps/web           → Your Next.js app
packages/api       → Backend logic
packages/schemas   → Shared types
packages/ui        → Shared components
```

Firebase's experimental Next.js integration doesn't support pnpm workspaces well (it uses npm internally and doesn't understand `workspace:*` dependencies).

**Solution**: Deploy to Cloud Run directly, which:
- ✅ Works perfectly with monorepos
- ✅ Fully manageable from Firebase Console
- ✅ Uses the same Firebase backend (Firestore, Auth, Storage)
- ✅ Auto-scales like Firebase Hosting
- ✅ Free tier included

## Deployment Commands

### Full Deployment (App + Rules)

```bash
pnpm deploy                    # Deploy everything (Windows)
```

Or manually:

```bash
pnpm build                     # Build the app
pwsh scripts/deploy-cloudrun.ps1   # Deploy to Cloud Run (Windows)
# OR
bash scripts/deploy-cloudrun.sh    # Deploy to Cloud Run (Mac/Linux)
```

### Deploy Only Database Rules

```bash
pnpm deploy:firestore          # Deploy Firestore rules
pnpm deploy:storage            # Deploy Storage rules
pnpm deploy:rules              # Deploy both
```

## Environment Variables

Your app automatically uses:
- **Firebase Application Default Credentials** (set up when you logged in with `firebase login`)
- **Environment variables** from your `.env.local` file during development

For production environment variables:

```bash
# Set a secret in Cloud Run (via Firebase Console)
gcloud run services update doublecheck \
  --update-env-vars NEXT_PUBLIC_APP_URL=https://your-domain.com \
  --project doublecheck-9f8c1 \
  --region us-central1
```

Or set them in the Firebase Console → Cloud Run service → "Variables & Secrets" tab.

## Connecting a Custom Domain

### Option 1: Firebase Hosting (Easiest)

1. Go to Firebase Console → Hosting
2. Add custom domain
3. Firebase handles SSL certificates automatically
4. Point it to your Cloud Run service

### Option 2: Cloud Run Directly

1. Go to Cloud Run Console → Your service
2. Click "Manage Custom Domains"
3. Follow the instructions

## Monitoring & Logs

View logs in either console:

**Firebase Console**:
- Go to your project
- Navigate to "Functions" or search for "doublecheck"
- Click "Logs"

**Cloud Run Console**:
- Go to your service
- Click "Logs" tab

## Costs

- **Cloud Run Free Tier**:
  - 2 million requests/month
  - 360,000 GB-seconds/month
  - 180,000 vCPU-seconds/month

Your app uses minimal resources, so it should stay in the free tier for small to medium traffic.

## Troubleshooting

### Deployment Fails

```bash
# Check if you're logged in
gcloud auth list
firebase login:list

# Re-authenticate if needed
gcloud auth login
firebase login
```

### Build Fails Locally

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### App Not Loading After Deployment

1. Check logs in Firebase Console
2. Verify environment variables are set
3. Check that Firestore rules allow access

## Local Development

```bash
pnpm dev
```

Runs on `http://localhost:3000` with:
- Hot reloading
- Local Firebase emulators (if configured)
- Service account for Firebase Admin

## Need Help?

- Firebase Console: https://console.firebase.google.com/project/doublecheck-9f8c1
- Cloud Run Console: https://console.cloud.google.com/run?project=doublecheck-9f8c1
- Firebase Support: https://firebase.google.com/support

