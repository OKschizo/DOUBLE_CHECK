#!/bin/bash

# Deploy Next.js app to Cloud Run (Firebase's backend)
# This integrates with Firebase but avoids the pnpm workspace issues

echo "🚀 Deploying DOUBLEcheck to Cloud Run..."
echo ""

# Build first
echo "📦 Building application..."
pnpm build

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build complete!"
echo ""

# Deploy to Cloud Run using gcloud
echo "📤 Deploying to Cloud Run..."
gcloud run deploy doublecheck \
  --source apps/web \
  --project doublecheck-9f8c1 \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment complete!"
  echo ""
  echo "🌐 Your app is now live!"
  echo "📊 Manage it in Firebase Console: https://console.firebase.google.com/project/doublecheck-9f8c1"
  echo "🔧 Or Cloud Run Console: https://console.cloud.google.com/run?project=doublecheck-9f8c1"
  echo ""
  echo "Note: Both consoles manage the SAME service. Use whichever you prefer!"
else
  echo "❌ Deployment failed"
  exit 1
fi

