#!/bin/bash

# Run Authentication E2E Tests with Cleanup
# This script:
# 1. Cleans up test user before starting
# 2. Runs the auth tests
# 3. Cleans up test user on failure
# 4. Keeps test user on success (for debugging)

set -e

echo "================================================"
echo "  Authentication E2E Tests with Cleanup"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment variables
if [ -z "$DOCBITS_ADMIN_EMAIL" ] || [ -z "$DOCBITS_ADMIN_PASSWORD" ]; then
    echo -e "${YELLOW}Warning: DOCBITS_ADMIN_EMAIL and DOCBITS_ADMIN_PASSWORD not set${NC}"
    echo "Cleanup will be skipped. Set these variables to enable automatic cleanup."
    echo ""

    # Run tests without cleanup
    yarn test:e2e:auth
    exit $?
fi

# Function to cleanup test user
cleanup_user() {
    echo ""
    echo "🧹 Cleaning up test user..."
    node test/helpers/cleanup-test-user.js
}

# Cleanup before starting (ensure clean state)
echo "📋 Step 1: Pre-test cleanup"
cleanup_user

echo ""
echo "📋 Step 2: Running authentication tests"
echo ""

# Run the tests
if yarn test:e2e:auth; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "💡 Test user remains for debugging. To cleanup manually, run:"
    echo "   node test/helpers/cleanup-test-user.js"
    echo ""
    exit 0
else
    TEST_EXIT_CODE=$?
    echo ""
    echo -e "${RED}❌ Tests failed!${NC}"
    echo ""

    # Cleanup on failure
    echo "📋 Step 3: Post-failure cleanup"
    cleanup_user

    echo ""
    echo -e "${YELLOW}Test user has been cleaned up. Run again to retry.${NC}"
    echo ""
    exit $TEST_EXIT_CODE
fi
