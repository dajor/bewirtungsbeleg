#!/bin/bash

# Script to run PDF upload E2E tests
# Usage: ./test/run-pdf-upload-tests.sh [options]
#
# Options:
#   --ui         Run in UI mode
#   --debug      Run in debug mode
#   --headed     Run with browser visible
#   --single     Run only single PDF tests
#   --multiple   Run only multiple PDF test
#   --submission Run only form submission test
#
# Examples:
#   ./test/run-pdf-upload-tests.sh              # Run all tests
#   ./test/run-pdf-upload-tests.sh --ui         # Run in UI mode
#   ./test/run-pdf-upload-tests.sh --single     # Run single file tests only

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PDF Upload E2E Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}Warning: Dev server not running on http://localhost:3000${NC}"
    echo -e "${YELLOW}Starting dev server...${NC}"
    echo -e "${YELLOW}(Press Ctrl+C to cancel)${NC}"
    sleep 2
    yarn dev &
    DEV_PID=$!
    sleep 5
    echo -e "${GREEN}Dev server started (PID: $DEV_PID)${NC}"
    CLEANUP_SERVER=true
else
    echo -e "${GREEN}Dev server is already running${NC}"
    CLEANUP_SERVER=false
fi

echo ""

# Parse command line arguments
MODE="normal"
FILTER=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --ui)
            MODE="ui"
            shift
            ;;
        --debug)
            MODE="debug"
            shift
            ;;
        --headed)
            MODE="headed"
            shift
            ;;
        --single)
            FILTER="--grep \"should upload.*PDF, extract data|should upload Kreditkartenbeleg\""
            shift
            ;;
        --multiple)
            FILTER="--grep \"should upload both PDFs\""
            shift
            ;;
        --submission)
            FILTER="--grep \"should handle form submission\""
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Determine command to run
case $MODE in
    ui)
        CMD="npx playwright test playwright-3-pdf-upload --ui"
        ;;
    debug)
        CMD="npx playwright test playwright-3-pdf-upload --debug"
        ;;
    headed)
        CMD="npx playwright test playwright-3-pdf-upload --headed"
        ;;
    *)
        CMD="npx playwright test playwright-3-pdf-upload"
        ;;
esac

# Add filter if specified
if [ ! -z "$FILTER" ]; then
    CMD="$CMD $FILTER"
fi

echo -e "${BLUE}Running tests...${NC}"
echo -e "${BLUE}Command: $CMD${NC}"
echo ""

# Cleanup function
cleanup() {
    if [ "$CLEANUP_SERVER" = true ] && [ ! -z "$DEV_PID" ]; then
        echo ""
        echo -e "${YELLOW}Stopping dev server (PID: $DEV_PID)...${NC}"
        kill $DEV_PID 2>/dev/null || true
        echo -e "${GREEN}Dev server stopped${NC}"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Run the tests
eval $CMD
TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}All tests passed!${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Tests failed!${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "${YELLOW}Check test-results/ directory for screenshots${NC}"
fi

echo ""
echo -e "${BLUE}Test artifacts:${NC}"
echo -e "  - Screenshots: ${BLUE}test-results/${NC}"
echo -e "  - HTML Report: ${BLUE}playwright-report/${NC}"
echo -e "  - Open report: ${BLUE}npx playwright show-report${NC}"
echo ""

exit $TEST_EXIT_CODE
