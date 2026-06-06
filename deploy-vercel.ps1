# Deploy to Vercel
# Prerequisites:
# 1. Install Vercel CLI: npm i -g vercel
# 2. Create free Upstash Redis account: https://upstash.com
# 3. Set environment variables:
#    vercel env add UPSTASH_REDIS_REST_URL
#    vercel env add UPSTASH_REDIS_REST_TOKEN

Write-Host "Building for production..."
npm run build

Write-Host "Setting environment variables..."
Write-Host "Make sure to run: vercel env add UPSTASH_REDIS_REST_URL"
Write-Host "                   vercel env add UPSTASH_REDIS_REST_TOKEN"

Write-Host "Deploying to Vercel..."
vercel --prod

Write-Host "Done! App deployed with persistent Redis storage."
