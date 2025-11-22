# PowerShell script for Windows deployment to Cloud Run

Write-Host "🚀 Deploying DOUBLEcheck to Cloud Run..." -ForegroundColor Cyan
Write-Host ""

# Build first
Write-Host "📦 Building application..." -ForegroundColor Yellow
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""

# Deploy to Cloud Run using gcloud
Write-Host "📤 Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy doublecheck `
  --source apps/web `
  --project doublecheck-9f8c1 `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --port 3000 `
  --memory 1Gi `
  --cpu 1 `
  --max-instances 10 `
  --min-instances 0 `
  --timeout 300

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your app is now live!" -ForegroundColor Cyan
    Write-Host "📊 Manage it in Firebase Console: https://console.firebase.google.com/project/doublecheck-9f8c1" -ForegroundColor White
    Write-Host "🔧 Or Cloud Run Console: https://console.cloud.google.com/run?project=doublecheck-9f8c1" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: Both consoles manage the SAME service. Use whichever you prefer!" -ForegroundColor Yellow
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

