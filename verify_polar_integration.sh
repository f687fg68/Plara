#!/bin/bash

# Polar.sh Integration Verification Script
# This script checks if all components are properly set up

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║        🐻‍❄️  POLAR.SH INTEGRATION VERIFICATION SCRIPT                    ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNING=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2 (Missing: $1)"
        ((FAILED++))
        return 1
    fi
}

check_command() {
    if command -v "$1" &> /dev/null; then
        VERSION=$($1 --version 2>&1 | head -n 1)
        echo -e "${GREEN}✅${NC} $2 - $VERSION"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2 (Command not found: $1)"
        ((FAILED++))
        return 1
    fi
}

check_optional() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $2 (Optional: $1)"
        ((WARNING++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. CHECKING SYSTEM REQUIREMENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_command "python3" "Python 3"
check_command "node" "Node.js"
check_command "npm" "npm"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. CHECKING BACKEND FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_file "backend/main.py" "Backend API implementation"
check_file "backend/requirements.txt" "Python dependencies"
check_file "backend/.env.example" "Environment variables template"
check_optional "backend/.env" "Environment configuration (⚠️  Create this file!)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. CHECKING FRONTEND FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_file "src/polar-checkout.js" "Frontend checkout module"
check_file "pricing.html" "Pricing page"
check_file "success.html" "Success page"
check_file "cancel.html" "Cancel page"
check_file "tmp_rovodev_polar_demo.html" "Test/demo page"
check_file "package.json" "Frontend dependencies"
check_file "vite.config.js" "Vite configuration"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. CHECKING DOCUMENTATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_file "START_HERE_POLAR.md" "Main entry point"
check_file "POLAR_CHEATSHEET.md" "Quick reference"
check_file "POLAR_QUICKSTART.md" "5-minute setup guide"
check_file "POLAR_SETUP_CHECKLIST.md" "Step-by-step checklist"
check_file "README_POLAR_INTEGRATION.md" "Complete overview"
check_file "POLAR_INTEGRATION_COMPLETE.md" "Full API reference"
check_file "POLAR_INTEGRATION_SUMMARY.md" "Implementation summary"
check_file "POLAR_VISUAL_FLOW.txt" "Visual flow diagram"
check_file "POLAR_DOCS_INDEX.md" "Documentation index"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. CHECKING DEPENDENCIES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} Frontend dependencies installed (node_modules/)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  Frontend dependencies not installed (Run: npm install)"
    ((WARNING++))
fi

# Check if Python packages are installed
if python3 -c "import fastapi" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Backend dependencies installed (fastapi found)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  Backend dependencies not installed (Run: cd backend && pip install -r requirements.txt)"
    ((WARNING++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. CHECKING CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅${NC} .env file exists"
    ((PASSED++))
    
    # Check for required variables
    if grep -q "POLAR_ACCESS_TOKEN=" "backend/.env"; then
        TOKEN=$(grep "POLAR_ACCESS_TOKEN=" "backend/.env" | cut -d '=' -f2)
        if [[ "$TOKEN" == "polar_pat_"* ]] && [ ${#TOKEN} -gt 20 ]; then
            echo -e "${GREEN}✅${NC} POLAR_ACCESS_TOKEN is configured"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠️${NC}  POLAR_ACCESS_TOKEN needs to be set (looks like placeholder)"
            ((WARNING++))
        fi
    else
        echo -e "${RED}❌${NC} POLAR_ACCESS_TOKEN not found in .env"
        ((FAILED++))
    fi
    
    if grep -q "POLAR_ORGANIZATION_ID=" "backend/.env"; then
        echo -e "${GREEN}✅${NC} POLAR_ORGANIZATION_ID is present"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} POLAR_ORGANIZATION_ID not found in .env"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌${NC} .env file not found (Run: cd backend && cp .env.example .env)"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. CHECKING SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend is running
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Backend is running (http://localhost:8000)"
    ((PASSED++))
    
    # Try to get API response
    RESPONSE=$(curl -s http://localhost:8000/)
    if echo "$RESPONSE" | grep -q "status"; then
        echo -e "${GREEN}✅${NC} Backend API is responding correctly"
        ((PASSED++))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  Backend not running (Start: cd backend && python3 main.py)"
    ((WARNING++))
fi

# Check if frontend is running
if curl -s http://localhost:5173/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Frontend is running (http://localhost:5173)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  Frontend not running (Start: npm run dev)"
    ((WARNING++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=$((PASSED + FAILED + WARNING))

echo -e "${GREEN}✅ Passed:${NC}   $PASSED"
echo -e "${RED}❌ Failed:${NC}   $FAILED"
echo -e "${YELLOW}⚠️  Warning:${NC}  $WARNING"
echo "─────────────────"
echo "   Total:    $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNING -eq 0 ]; then
        echo "╔══════════════════════════════════════════════════════════════════════════╗"
        echo "║                    🎉 ALL CHECKS PASSED! 🎉                              ║"
        echo "║                                                                          ║"
        echo "║  Your Polar.sh integration is ready!                                    ║"
        echo "║                                                                          ║"
        echo "║  Next steps:                                                            ║"
        echo "║  1. Start backend:  cd backend && python3 main.py                       ║"
        echo "║  2. Start frontend: npm run dev                                         ║"
        echo "║  3. Test it:        http://localhost:5173/tmp_rovodev_polar_demo.html  ║"
        echo "╚══════════════════════════════════════════════════════════════════════════╝"
    else
        echo "╔══════════════════════════════════════════════════════════════════════════╗"
        echo "║                  ✅ INTEGRATION READY (WITH WARNINGS)                    ║"
        echo "║                                                                          ║"
        echo "║  Core files are in place, but some optional items need attention.       ║"
        echo "║  Check the warnings above for details.                                  ║"
        echo "╚══════════════════════════════════════════════════════════════════════════╝"
    fi
else
    echo "╔══════════════════════════════════════════════════════════════════════════╗"
    echo "║                    ⚠️  SETUP INCOMPLETE                                   ║"
    echo "║                                                                          ║"
    echo "║  Some required files or configurations are missing.                      ║"
    echo "║  Please review the failed checks above and fix them.                     ║"
    echo "║                                                                          ║"
    echo "║  Quick fixes:                                                            ║"
    echo "║  - Create .env:  cd backend && cp .env.example .env                      ║"
    echo "║  - Get token:    https://sandbox.polar.sh/settings/api                   ║"
    echo "║  - Install deps: npm install && cd backend && pip install -r *.txt       ║"
    echo "╚══════════════════════════════════════════════════════════════════════════╝"
fi

echo ""
echo "📚 For help, see: START_HERE_POLAR.md"
echo ""
