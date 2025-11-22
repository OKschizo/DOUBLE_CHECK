# Deploy to Vercel (Web Interface - EASIEST WAY)

## Steps:

1. **Go to Vercel**: https://vercel.com/new

2. **Import Git Repository**:
   - Click "Add New..." → "Project"
   - Choose "Import Git Repository"
   - If not connected, connect your GitHub/GitLab/Bitbucket
   - OR use "Import Third-Party Git Repository" and paste your repo URL

3. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` ← IMPORTANT!
   - **Build Command**: `cd ../.. && pnpm build --filter=web`
   - **Install Command**: `pnpm install`
   - **Output Directory**: Leave as default (`.next`)

4. **Environment Variables** (Add these):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBKS_cGxwhPAIiSLMsKvo-KIh_bi2MmXMo
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=doublecheck-9f8c1.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=doublecheck-9f8c1
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=doublecheck-9f8c1.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=672207092025
   NEXT_PUBLIC_FIREBASE_APP_ID=1:672207092025:web:8765da71fdbae52ee790e8
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   FIREBASE_ADMIN_PROJECT_ID=doublecheck-9f8c1
   FIREBASE_ADMIN_DATABASE_URL=https://doublecheck-9f8c1-default-rtdb.firebaseio.com
   ```

5. **Click "Deploy"**

That's it! Vercel will:
- Build your app (2-3 minutes)
- Give you a live URL
- Auto-deploy on every git push

## Alternative: Use Vercel CLI (From Your Computer)

If you want to deploy from your computer without Git:

1. Open terminal in your project root:
```bash
cd C:\Users\anonw\Desktop\DOUBLE_CHECK\doublecheck
```

2. Login to Vercel (opens browser):
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Answer prompts:
   - **Set up and deploy?** Y
   - **Which scope?** (your account)
   - **Link to existing project?** N
   - **Project name?** doublecheck
   - **In which directory is your code?** `apps/web`
   - **Override settings?** N

5. Wait 2-3 minutes, get your URL!

## After Deployment

Your app will be live at: `https://doublecheck-[random].vercel.app`

You can:
- ✅ Set a custom domain in Vercel dashboard
- ✅ Manage from Firebase Console (Firestore, Auth, Storage still work!)
- ✅ Redeploy by pushing to Git or running `vercel --prod`

## Why Vercel is Better:

- ✅ 2 minute deploys vs 10 minute Docker builds
- ✅ Native Next.js support
- ✅ Works perfectly with pnpm monorepos
- ✅ Free tier for most usage
- ✅ Still uses all your Firebase backend!

