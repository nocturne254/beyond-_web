# Beyond Web Setup Script for Windows
# This script helps set up the development environment

Write-Host "🌟 Setting up Beyond Web - Interactive Star Map..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is available
Write-Host "📦 Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please ensure npm is installed with Node.js" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Open: http://localhost:3000" -ForegroundColor White
Write-Host "3. For mobile testing: npm run dev-mobile" -ForegroundColor White
Write-Host "   Then access via: http://your-ip:8080" -ForegroundColor White
Write-Host ""
Write-Host "🌟 Features:" -ForegroundColor Cyan
Write-Host "   • Interactive star map with real astronomical data" -ForegroundColor White
Write-Host "   • Location-based sky viewing" -ForegroundColor White
Write-Host "   • Educational star information with Wikipedia" -ForegroundColor White
Write-Host "   • Night mode for stargazing" -ForegroundColor White
Write-Host "   • Time controls to see sky changes" -ForegroundColor White
Write-Host "   • Responsive design for all devices" -ForegroundColor White
Write-Host ""
Write-Host "Happy stargazing! 🌟✨" -ForegroundColor Green
