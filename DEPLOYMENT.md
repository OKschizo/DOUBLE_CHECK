# Firebase Deployment Guide for DOUBLEcheck

This guide will help you deploy your Next.js monorepo app to Firebase Hosting with automatic SSR support.

## Prerequisites

1. **Node.js 18+** and **pnpm 8+** installed
2. **Firebase CLI** installed and logged in
3. Firebase project: `doublecheck-9f8c1`

## Initial Setup

### 1. Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Enable Web Frameworks (Required for Next.js SSR)

```bash
firebase experiments:enable webframeworks
```

This enables Firebase's automatic Next.js SSR support without needing Docker.

### 4. Set Environment Variables

You need to configure environment variables in your Firebase project. Run:

```bash
firebase functions:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY
firebase functions:secrets:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
firebase functions:secrets:set NEXT_PUBLIC_FIREBASE_PROJECT_ID
firebase functions:secrets:set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
firebase functions:secrets:set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
firebase functions:secrets:set NEXT_PUBLIC_FIREBASE_APP_ID
firebase functions:secrets:set NEXT_PUBLIC_APP_URL
```

Or use the provided script:

```bash
node scripts/set-firebase-env.js
```

**Important:** For `NEXT_PUBLIC_APP_URL`, use your Firebase Hosting URL:
- `https://doublecheck-9f8c1.web.app` or
- `https://doublecheck22.web.app`

### 5. Firebase Admin SDK (Automatic in Production)

The app is configured to automatically use Firebase Application Default Credentials when deployed to Firebase. No service account file is needed in production!

## Deployment Steps

### Full Deployment (First Time)

Deploy everything (hosting, Firestore rules, storage rules):

```bash
pnpm deploy
```

Or using Firebase CLI directly:

```bash
firebase deploy
```

### Subsequent Deployments

**Deploy only hosting (faster):**

```bash
pnpm deploy:hosting
```

**Deploy only Firestore rules:**

```bash
pnpm deploy:firestore
```

**Deploy only Storage rules:**

```bash
pnpm deploy:storage
```

## How It Works

Firebase Web Frameworks automatically:
1. Detects your Next.js app in `apps/web`
2. Builds it using your existing build configuration
3. Deploys static assets to Firebase Hosting
4. Deploys SSR functions to Cloud Run (behind the scenes)
5. Sets up automatic routing

**No Docker needed!** Firebase handles containerization automatically.

## Troubleshooting

### Build Fails During Deployment

If you see build errors, try building locally first:

```bash
pnpm build
```

Fix any errors, then deploy again.

### Environment Variables Not Working

Make sure you've set all required environment variables:

```bash
firebase functions:config:get
```

### Deployment Hangs or Times Out

Try deploying with debug mode:

```bash
firebase deploy --debug
```

### "Firebase Admin not initialized" Error

This shouldn't happen in production, but if it does:
1. Check that your Firebase project ID matches: `doublecheck-9f8c1`
2. Verify Application Default Credentials are available

## Accessing Your Deployed App

After deployment, your app will be available at:
- **Primary URL:** https://doublecheck-9f8c1.web.app
- **Secondary URL:** https://doublecheck-9f8c1.firebaseapp.com
- **Custom URL (if configured):** https://doublecheck22.web.app

## Local Development

For local development, the app uses the service account file:
- `doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json`

**Never commit this file to Git!** It's already in `.gitignore`.

Run locally with:

```bash
pnpm dev
```

## Project Structure

```
doublecheck/
├── apps/web/              # Next.js app
├── packages/
│   ├── api/              # tRPC API layer
│   ├── schemas/          # Zod schemas
│   └── ui/               # Shared UI components
├── firebase.json         # Firebase configuration
├── .firebaserc          # Firebase project configuration
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
└── env.example          # Environment variables template
```

## CI/CD Integration

To deploy from CI/CD:

```bash
# Get CI token
firebase login:ci

# Use token in CI
firebase deploy --token "$FIREBASE_TOKEN"
```

## Cost Considerations

- **Firebase Hosting:** Free tier covers most usage
- **Cloud Run (for SSR):** Free tier includes 2M requests/month
- **Firestore:** Free tier includes 50k reads/20k writes per day
- **Storage:** Free tier includes 5GB storage

Monitor usage at: https://console.firebase.google.com/project/doublecheck-9f8c1/usage

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs/hosting/frameworks/nextjs
- Next.js on Firebase: https://firebase.google.com/docs/hosting/frameworks/frameworks-overview
- Firebase Support: https://firebase.google.com/support

