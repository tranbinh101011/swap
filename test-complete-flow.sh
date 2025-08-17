#!/bin/bash

echo "🚀 TESTING COMPLETE COW_N -> SWAP FLOW"
echo "====================================="

echo ""
echo "1️⃣ Step 1: Create session from COW_N"
echo "-------------------------------------"

SESSION_RESULT=$(curl -s -X POST http://localhost:3001/api/session/create \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x742d35Cc6634C0532925a3b8D404BAB95e5194de95faa"}')

echo "Session Result: $SESSION_RESULT"

# Extract values using PowerShell
CIPHERTEXT=$(echo $SESSION_RESULT | jq -r '.ciphertext')
SESSION_ID=$(echo $SESSION_RESULT | jq -r '.sessionId')

echo "Ciphertext: ${CIPHERTEXT:0:50}..."
echo "Session ID: $SESSION_ID"

echo ""
echo "2️⃣ Step 2: Authenticate with SWAP API"
echo "-------------------------------------"

AUTH_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/cow-wallet \
  -H "Content-Type: application/json" \
  -d "{\"ciphertext\":\"$CIPHERTEXT\",\"sessionId\":\"$SESSION_ID\"}")

echo "Auth Result: $AUTH_RESULT"

# Extract auth token
AUTH_TOKEN=$(echo $AUTH_RESULT | jq -r '.authToken')
echo "Auth Token: $AUTH_TOKEN"

echo ""
echo "3️⃣ Step 3: Test private key API"
echo "------------------------------"

PRIVATE_KEY_RESULT=$(curl -s "http://localhost:3000/api/auth/private-key?auth=$AUTH_TOKEN")
echo "Private Key Result: $PRIVATE_KEY_RESULT"

echo ""
echo "4️⃣ Step 4: Test session store debug"
echo "----------------------------------"

DEBUG_RESULT=$(curl -s "http://localhost:3000/api/debug/session-store")
echo "Debug Result: $DEBUG_RESULT"

echo ""
echo "5️⃣ Step 5: Final URL"
echo "-------------------"
echo "✅ Final URL to test: http://localhost:3000/swap?auth=$AUTH_TOKEN"

echo ""
echo "🎯 FLOW COMPLETED - Check browser for final result!"
