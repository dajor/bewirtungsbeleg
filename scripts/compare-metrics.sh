#!/bin/bash

# Performance Metrics Comparison Script
# Compares baseline metrics with current metrics
# Usage: ./scripts/compare-metrics.sh [baseline_dir] [current_dir]

set -e

BASELINE_DIR="${1:-metrics/baseline}"
CURRENT_DIR="${2:-metrics/current}"

echo "=== Performance Metrics Comparison ==="
echo "Baseline: $BASELINE_DIR"
echo "Current:  $CURRENT_DIR"
echo ""

# Check if directories exist
if [ ! -d "$BASELINE_DIR" ]; then
  echo "❌ Error: Baseline directory not found: $BASELINE_DIR"
  exit 1
fi

if [ ! -d "$CURRENT_DIR" ]; then
  echo "❌ Error: Current directory not found: $CURRENT_DIR"
  exit 1
fi

# Helper function to calculate percentage change
calc_percent_change() {
  local baseline=$1
  local current=$2

  if [ "$baseline" = "0" ] || [ -z "$baseline" ] || [ -z "$current" ]; then
    echo "N/A"
    return
  fi

  echo "scale=2; (($current - $baseline) / $baseline) * 100" | bc
}

# Helper function to extract numeric value
extract_number() {
  echo "$1" | grep -oE '[0-9]+\.?[0-9]*' | head -1
}

# Helper function to compare values
compare_metric() {
  local name=$1
  local baseline=$2
  local current=$3
  local unit=$4
  local lower_is_better=${5:-true}

  if [ -z "$baseline" ] || [ -z "$current" ]; then
    echo "  $name: N/A"
    return
  fi

  local change=$(calc_percent_change "$baseline" "$current")
  local symbol=""

  if [ "$change" != "N/A" ]; then
    local change_val=$(echo "$change" | grep -oE '-?[0-9]+\.?[0-9]*')
    if [ -n "$change_val" ]; then
      if (( $(echo "$change_val < 0" | bc -l) )); then
        symbol="✅ 📉"
      elif (( $(echo "$change_val > 0" | bc -l) )); then
        symbol="⚠️  📈"
      else
        symbol="➡️"
      fi
    fi
  fi

  printf "  %-40s %10s %s → %10s %s (%+.1f%%) %s\n" \
    "$name:" "$baseline" "$unit" "$current" "$unit" "$change" "$symbol"
}

# 1. Compare Bundle Sizes
echo "📦 Bundle Size Comparison"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$BASELINE_DIR/bundle-size.txt" ] && [ -f "$CURRENT_DIR/bundle-size.txt" ]; then
  BASELINE_SIZE=$(cat "$BASELINE_DIR/bundle-size.txt" | awk '{print $1}')
  CURRENT_SIZE=$(cat "$CURRENT_DIR/bundle-size.txt" | awk '{print $1}')

  # Convert to MB for comparison
  BASELINE_MB=$(echo "$BASELINE_SIZE" | sed 's/M//;s/G/*1024/')
  CURRENT_MB=$(echo "$CURRENT_SIZE" | sed 's/M//;s/G/*1024/')

  compare_metric "Total Bundle Size" "$BASELINE_MB" "$CURRENT_MB" "MB"
else
  echo "  Bundle size data not available"
fi

echo ""

# 2. Compare Test Results
echo "🧪 Test Results Comparison"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# E2E Tests
if [ -f "$BASELINE_DIR/e2e-results.txt" ] && [ -f "$CURRENT_DIR/e2e-results.txt" ]; then
  BASELINE_E2E=$(grep -c "✓" "$BASELINE_DIR/e2e-results.txt" 2>/dev/null || echo "0")
  CURRENT_E2E=$(grep -c "✓" "$CURRENT_DIR/e2e-results.txt" 2>/dev/null || echo "0")

  compare_metric "E2E Tests Passed" "$BASELINE_E2E" "$CURRENT_E2E" "tests" false
else
  echo "  E2E test data not available"
fi

# Unit Tests
if [ -f "$BASELINE_DIR/unit-results.txt" ] && [ -f "$CURRENT_DIR/unit-results.txt" ]; then
  BASELINE_UNIT=$(grep "Tests:" "$BASELINE_DIR/unit-results.txt" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' || echo "0")
  CURRENT_UNIT=$(grep "Tests:" "$CURRENT_DIR/unit-results.txt" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' || echo "0")

  compare_metric "Unit Tests Passed" "$BASELINE_UNIT" "$CURRENT_UNIT" "tests" false
else
  echo "  Unit test data not available"
fi

echo ""

# 3. Compare Dependencies
echo "📦 Dependencies Comparison"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$BASELINE_DIR/dependencies-size.txt" ] && [ -f "$CURRENT_DIR/dependencies-size.txt" ]; then
  BASELINE_DEPS=$(cat "$BASELINE_DIR/dependencies-size.txt" | awk '{print $1}')
  CURRENT_DEPS=$(cat "$CURRENT_DIR/dependencies-size.txt" | awk '{print $1}')

  # Convert to MB
  BASELINE_DEPS_MB=$(echo "$BASELINE_DEPS" | sed 's/M//;s/G/*1024/')
  CURRENT_DEPS_MB=$(echo "$CURRENT_DEPS" | sed 's/M//;s/G/*1024/')

  compare_metric "node_modules Size" "$BASELINE_DEPS_MB" "$CURRENT_DEPS_MB" "MB"
else
  echo "  Dependencies data not available"
fi

echo ""

# 4. Compare Lighthouse Scores (if available)
if [ -f "$BASELINE_DIR/lighthouse.json" ] && [ -f "$CURRENT_DIR/lighthouse.json" ]; then
  echo "💡 Lighthouse Scores Comparison"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  BASELINE_PERF=$(jq '.categories.performance.score * 100' "$BASELINE_DIR/lighthouse.json" 2>/dev/null || echo "0")
  CURRENT_PERF=$(jq '.categories.performance.score * 100' "$CURRENT_DIR/lighthouse.json" 2>/dev/null || echo "0")

  compare_metric "Performance Score" "$BASELINE_PERF" "$CURRENT_PERF" "pts" false

  echo ""
fi

# 5. Overall Assessment
echo "📊 Overall Assessment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if tests are still passing
if [ -f "$CURRENT_DIR/e2e-results.txt" ]; then
  FAILURES=$(grep -c "✗" "$CURRENT_DIR/e2e-results.txt" 2>/dev/null || echo "0")

  if [ "$FAILURES" -gt "0" ]; then
    echo "❌ REGRESSION DETECTED: $FAILURES E2E test(s) failing"
    echo ""
    echo "⚠️  Recommendation: ROLLBACK changes and investigate failures"
    exit 1
  else
    echo "✅ All tests passing - no functional regressions detected"
  fi
else
  echo "⚠️  Cannot verify test status - test results not available"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Comparison complete!"
echo ""
echo "Legend:"
echo "  ✅ 📉 = Improvement (lower is better)"
echo "  ⚠️  📈 = Regression (higher is worse)"
echo "  ➡️  = No significant change"
