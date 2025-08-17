Write-Host "🚀 TESTING COMPLETE COW_N -> SWAP FLOW" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host ""
Write-Host "1️⃣ Step 1: Create session from COW_N" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Yellow

$sessionResult = Invoke-RestMethod -Uri "http://localhost:3001/api/session/create" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"walletAddress":"0x742d35Cc6634C0532925a3b8D404BAB95e5194de95faa"}'

Write-Host "Session Result:" -ForegroundColor White
$sessionResult | ConvertTo-Json -Depth 3

$ciphertext = $sessionResult.ciphertext
$sessionId = $sessionResult.sessionId

Write-Host "Ciphertext: $($ciphertext.Substring(0, 50))..." -ForegroundColor Cyan
Write-Host "Session ID: $sessionId" -ForegroundColor Cyan

Write-Host ""
Write-Host "2️⃣ Step 2: Authenticate with SWAP API" -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Yellow

$authBody = @{
    ciphertext = $ciphertext
    sessionId = $sessionId
} | ConvertTo-Json

$authResult = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/cow-wallet" -Method POST -Headers @{"Content-Type"="application/json"} -Body $authBody

Write-Host "Auth Result:" -ForegroundColor White
$authResult | ConvertTo-Json -Depth 3

$authToken = $authResult.authToken
Write-Host "Auth Token: $authToken" -ForegroundColor Cyan

Write-Host ""
Write-Host "3️⃣ Step 3: Test private key API" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow

$privateKeyResult = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/private-key?auth=$authToken" -Method GET

Write-Host "Private Key Result:" -ForegroundColor White
$privateKeyResult | ConvertTo-Json -Depth 3

Write-Host ""
Write-Host "4️⃣ Step 4: Test session store debug" -ForegroundColor Yellow
Write-Host "----------------------------------" -ForegroundColor Yellow

$debugResult = Invoke-RestMethod -Uri "http://localhost:3000/api/debug/session-store" -Method GET

Write-Host "Debug Result:" -ForegroundColor White
$debugResult | ConvertTo-Json -Depth 3

Write-Host ""
Write-Host "5️⃣ Step 5: Final URL" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
Write-Host "✅ Final URL to test: http://localhost:3000/swap?auth=$authToken" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 FLOW COMPLETED - Opening browser for final result!" -ForegroundColor Green

# Open the final URL in browser
Start-Process "http://localhost:3000/swap?auth=$authToken"
