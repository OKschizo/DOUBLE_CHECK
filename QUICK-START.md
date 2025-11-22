# Quick Start - DOUBLEcheck Deployment

## Your App is Deploying! 🚀

Your Next.js app is currently being deployed to Google Cloud Run, which is fully integrated with Firebase.

### What's Happening Now:
1. ✅ Building your monorepo with Docker
2. ✅ Installing dependencies (pnpm workspace packages)
3. ⏳ Building Next.js app (this takes 3-5 minutes)
4. ⏳ Deploying to Cloud Run
5. ⏳ Setting up auto-scaling and HTTPS

### After Deployment:

Your app will be live at: **https://doublecheck-9f8c1.run.app**

## Managing Your App

### Firebase Console (Recommended)
https://console.firebase.google.com/project/doublecheck-9f8c1

From here you can:
- ✅ View and manage Firestore database
- ✅ Manage Storage files
- ✅ Configure Authentication
- ✅ View app logs
- ✅ Manage your Cloud Run service

### Cloud Run Console (Advanced)
https://console.cloud.google.com/run?project=doublecheck-9f8c1

More detailed controls:
- Traffic splitting
- Revision management  
- Detailed metrics
- Environment variables

**Both consoles control the SAME app!** They're just different interfaces.

## Making Updates

To deploy changes:

```bash
# Make your changes, then:
pnpm deploy
```

That's it! The script will build and deploy automatically.

## Local Development

```bash
pnpm dev
# App runs on http://localhost:3000
```

## Key Features of Your Setup

✅ **Monorepo Support**: Your pnpm workspace packages work seamlessly
✅ **Firebase Integration**: Firestore, Auth, Storage all connected
✅ **Auto-scaling**: Scales from 0 to handle traffic automatically  
✅ **Free Tier**: 2M requests/month free
✅ **HTTPS Automatic**: SSL certificates managed for you
✅ **Firebase Console**: Manage everything from one place

## Environment Variables

All your Firebase config is baked into the Docker image (it's public data anyway, safe to include).

For sensitive variables (API keys, secrets):
```bash
# In Cloud Run console, add under "Variables & Secrets"
```

## Connecting a Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the prompts
4. Point it to your Cloud Run service
5. Firebase handles SSL automatically

OR

1. Go to Cloud Run Console → Your service
2. Click "Manage Custom Domains"  
3. Follow Google's domain verification

## Troubleshooting

**Build failed?**
- Check the error in Cloud Run logs
- Most common: Missing environment variables

**App not loading?**
- Check Firestore rules allow access
- Verify Firebase config is correct
- Check Cloud Run logs for errors

**Need to rollback?**
- Go to Cloud Run Console
- Click "Revisions"
- Route traffic to previous revision

## What Makes Your Setup Special

You have a **pnpm monorepo** with:
- `apps/web` - Your Next.js app
- `packages/api` - Backend tRPC API
- `packages/schemas` - Shared Zod schemas
- `packages/ui` - Shared React components

Firebase's experimental Next.js hosting doesn't support this well (hence the errors you were getting).

**Solution**: Deploy to Cloud Run directly, which:
- ✅ Supports complex monorepos
- ✅ Still fully manageable from Firebase Console
- ✅ Uses same Firebase backend (Firestore, Auth, Storage)
- ✅ No Docker knowledge required after initial setup

## Cost Estimate

With typical usage:
- **Cloud Run**: Free (under 2M requests/month)
- **Firestore**: Free (under 50k reads/day)
- **Storage**: Free (under 5GB)
- **Hosting**: Free
- **Authentication**: Free (unlimited)

You'll likely stay in the free tier unless you have significant traffic.

## Getting Help

- **Firebase Console**: https://console.firebase.google.com/project/doublecheck-9f8c1
- **Cloud Run Console**: https://console.cloud.google.com/run?project=doublecheck-9f8c1
- **Logs**: Check either console under "Logs" tab
- **Firebase Support**: https://firebase.google.com/support

## Next Steps

Once deployment finishes:
1. ✅ Visit your live app
2. ✅ Test login/signup
3. ✅ Create a test project
4. ✅ Verify Firestore data is saving
5. ✅ Check that images upload to Storage

Everything should just work! 🎉

