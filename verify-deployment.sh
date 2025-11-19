#!/bin/bash

# Verification Script for CASP SR Response Viewer
# Tests the Apps Script API and displays diagnostic information

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API URL from config.js
API_URL="https://script.google.com/macros/s/AKfycbxQyAI89eyOkoxdvFlUU3OgvysWkBQxFqrrT7SV9U6czT6eYPn_TA0sOAwdPGsBdEtSlQ/exec"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CASP SR Response Viewer - Deployment Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo

echo -e "${YELLOW}[1/4]${NC} Testing API connectivity..."
if curl -s -f -L "${API_URL}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API is reachable"
else
    echo -e "${RED}✗${NC} API is not reachable"
    exit 1
fi
echo

echo -e "${YELLOW}[2/4]${NC} Fetching response data..."
RESPONSE=$(curl -s -L "${API_URL}")
TOTAL_STUDENTS=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('totalStudents', 0))")

echo "$RESPONSE" | python3 -m json.tool | head -20
echo
echo -e "Total Students: ${BLUE}$TOTAL_STUDENTS${NC}"

if [ "$TOTAL_STUDENTS" -eq 0 ]; then
    echo -e "${RED}✗${NC} No student data found"
    echo
    echo -e "${YELLOW}[3/4]${NC} Running debug diagnostics..."
    DEBUG_RESPONSE=$(curl -s -L "${API_URL}?action=debug")
    echo "$DEBUG_RESPONSE" | python3 -m json.tool
    echo
    echo -e "${RED}PROBLEM DETECTED:${NC} The Apps Script is not reading any data."
    echo
    echo -e "Possible causes:"
    echo -e "  1. Apps Script deployed from wrong Google Sheet"
    echo -e "  2. Sheet name is not exactly 'Form Responses 1'"
    echo -e "  3. No responses have been submitted yet"
    echo
    echo -e "Please see ${BLUE}TROUBLESHOOTING-SR-VIEWER.md${NC} for detailed fix instructions."
    exit 1
else
    echo -e "${GREEN}✓${NC} Student data found!"
fi
echo

echo -e "${YELLOW}[3/4]${NC} Testing vote endpoint..."
VOTES=$(curl -s -L "${API_URL}?action=getVotes")
echo "$VOTES" | python3 -m json.tool
echo -e "${GREEN}✓${NC} Votes endpoint working"
echo

echo -e "${YELLOW}[4/4]${NC} Checking GitHub Pages deployment..."
VIEWER_URL="https://barrie-cork.github.io/casp_sr_responses/"
if curl -s -f "${VIEWER_URL}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Viewer is deployed and accessible"
    echo -e "   ${BLUE}${VIEWER_URL}${NC}"
else
    echo -e "${RED}✗${NC} Viewer is not accessible"
    exit 1
fi
echo

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  All checks passed! Viewer should be working.${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo
echo -e "Next steps:"
echo -e "  1. Open ${BLUE}${VIEWER_URL}${NC} in your browser"
echo -e "  2. Check browser console (F12) for any errors"
echo -e "  3. Verify student responses are displaying"
echo
