#!/bin/bash

# Chronicle AI - Pre-Deployment Check Script
# This script runs all necessary checks before deploying to production
# Usage: ./scripts/pre-deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall success
CHECKS_PASSED=true

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Chronicle AI - Pre-Deployment Validation Check         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}▶ $1${NC}"
    echo "─────────────────────────────────────────────────────────────"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
    CHECKS_PASSED=false
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# 1. Check Node and npm versions
print_section "1. Checking Environment"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js: $NODE_VERSION"
    
    # Check if version is >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_error "Node.js version must be >= 18.0.0"
    fi
else
    print_error "Node.js is not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm: $NPM_VERSION"
else
    print_error "npm is not installed"
fi

# 2. Check if node_modules exists
print_section "2. Checking Dependencies"

if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"
else
    print_warning "node_modules not found. Running npm install..."
    npm install
fi

# 3. Run TypeScript type checking
print_section "3. TypeScript Type Checking"

if npm run type-check &> /dev/null; then
    print_success "No TypeScript errors"
else
    print_error "TypeScript type checking failed"
    npm run type-check 2>&1 | tail -20
fi

# 4. Run ESLint
print_section "4. Running Linter"

if npm run lint &> /dev/null; then
    print_success "No linting errors"
else
    print_error "Linting failed"
    npm run lint 2>&1 | tail -20
fi

# 5. Check code formatting
print_section "5. Checking Code Formatting"

if npm run format:check &> /dev/null; then
    print_success "Code is properly formatted"
else
    print_warning "Code formatting issues found. Run 'npm run format' to fix"
fi

# 6. Environment Variables Check
print_section "6. Validating Environment Variables"

# Check if .env.local exists for local testing
if [ -f ".env.local" ]; then
    print_success ".env.local file exists"
else
    print_warning ".env.local not found (OK for CI/CD)"
fi

# Required production env vars
REQUIRED_ENV_VARS=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_APP_URL"
)

for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_warning "$var not set in current environment"
    else
        print_success "$var is set"
    fi
done

# 7. Security Check
print_section "7. Security Audit"

if npm audit --audit-level=moderate &> /dev/null; then
    print_success "No moderate or high security vulnerabilities"
else
    print_warning "Security vulnerabilities found"
    echo "Run 'npm audit' for details or 'npm audit fix' to fix automatically"
fi

# 8. Test Build
print_section "8. Testing Production Build"

if npm run build:prod &> /dev/null; then
    print_success "Production build successful"
    
    # Check dist directory
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        print_success "Build output size: $DIST_SIZE"
        
        # Check if index.html exists
        if [ -f "dist/index.html" ]; then
            print_success "dist/index.html exists"
        else
            print_error "dist/index.html not found"
        fi
    else
        print_error "dist directory not created"
    fi
else
    print_error "Production build failed"
    npm run build:prod 2>&1 | tail -30
fi

# 9. Check for sensitive data in code
print_section "9. Checking for Sensitive Data"

# Check for common secret patterns
if grep -r "PRIVATE_KEY\|SECRET_KEY\|password.*=" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . &> /dev/null; then
    print_warning "Possible secrets found in code. Review manually"
else
    print_success "No obvious secrets in code"
fi

# Check for console.logs in production code
CONSOLE_COUNT=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules src/ | wc -l)
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    print_warning "$CONSOLE_COUNT console.log statements found in src/"
else
    print_success "No console.log statements in production code"
fi

# 10. Check Supabase Configuration
print_section "10. Supabase Configuration Check"

if command -v supabase &> /dev/null; then
    print_success "Supabase CLI installed"
    
    # Check if linked to a project
    if [ -f ".supabase/config.toml" ]; then
        print_success "Supabase project linked"
    else
        print_warning "Supabase project not linked locally (OK for remote deployment)"
    fi
else
    print_warning "Supabase CLI not installed (optional for local dev)"
fi

# 11. Check for TODO and FIXME comments
print_section "11. Checking for TODOs and FIXMEs"

TODO_COUNT=$(grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules src/ | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    print_warning "$TODO_COUNT TODO/FIXME comments found"
    grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules src/ | head -5
else
    print_success "No TODO/FIXME comments"
fi

# 12. Check Git status
print_section "12. Git Status Check"

if command -v git &> /dev/null; then
    if git rev-parse --git-dir &> /dev/null; then
        # Check for uncommitted changes
        if [ -z "$(git status --porcelain)" ]; then
            print_success "No uncommitted changes"
        else
            print_warning "You have uncommitted changes"
            git status --short | head -10
        fi
        
        # Check current branch
        CURRENT_BRANCH=$(git branch --show-current)
        print_success "Current branch: $CURRENT_BRANCH"
        
        # Check if on main/master
        if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
            print_success "On production branch"
        else
            print_warning "Not on main/master branch"
        fi
    fi
fi

# 13. Bundle Size Check
print_section "13. Bundle Size Analysis"

if [ -d "dist" ]; then
    # Check total JS size
    JS_SIZE=$(find dist -name "*.js" -exec du -ch {} + | tail -1 | cut -f1)
    print_success "Total JavaScript size: $JS_SIZE"
    
    # Warn if JS bundle is too large
    JS_SIZE_KB=$(find dist -name "*.js" -exec du -k {} + | awk '{sum+=$1} END {print sum}')
    if [ "$JS_SIZE_KB" -gt 2048 ]; then
        print_warning "JS bundle size exceeds 2MB. Consider code splitting"
    fi
fi

# 14. Check Required Files
print_section "14. Checking Required Files"

REQUIRED_FILES=(
    "README.md"
    "package.json"
    "tsconfig.json"
    "vite.config.ts"
    ".gitignore"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file is missing"
    fi
done

# Final Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                      Summary                                  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

if [ "$CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}\n"
    echo -e "Your app is ready for deployment. Next steps:\n"
    echo "1. Review warnings above (if any)"
    echo "2. Verify environment variables in hosting platform"
    echo "3. Deploy Supabase edge functions:"
    echo "   npx supabase functions deploy gemini-proxy"
    echo "4. Deploy to hosting:"
    echo "   npm run deploy:vercel  OR  npm run deploy:netlify"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed!${NC}\n"
    echo -e "Please fix the errors above before deploying.\n"
    exit 1
fi
