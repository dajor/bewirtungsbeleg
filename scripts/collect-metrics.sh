#!/bin/bash

# Performance Metrics Collection Script
# Captures bundle size, test results, and performance metrics
# Usage: ./scripts/collect-metrics.sh [output_dir]

set -e

OUTPUT_DIR="${1:-metrics/current}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Performance Metrics Collection ==="
echo "Output directory: $OUTPUT_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# 1. Bundle Size Analysis
echo "📦 Analyzing bundle size..."
yarn build > "$OUTPUT_DIR/build-output.txt" 2>&1 || true

# Extract bundle sizes from Next.js build output
if [ -f ".next/standalone/package.json" ]; then
  du -sh .next/standalone > "$OUTPUT_DIR/bundle-size.txt"
fi

# Analyze individual chunk sizes
if [ -d ".next/static/chunks" ]; then
  find .next/static/chunks -type f -name "*.js" -exec ls -lh {} \; | \
    awk '{print $5, $9}' | sort -h > "$OUTPUT_DIR/chunk-sizes.txt"
fi

echo "✓ Bundle analysis complete"

# 2. Run E2E Tests (skip broken auth tests)
echo ""
echo "🧪 Running E2E tests..."
yarn test:e2e > "$OUTPUT_DIR/e2e-results.txt" 2>&1 || true
echo "✓ E2E tests complete"

# 3. Run Unit Tests
echo ""
echo "🔬 Running unit tests..."
yarn test --run > "$OUTPUT_DIR/unit-results.txt" 2>&1 || true
echo "✓ Unit tests complete"

# 4. Lighthouse Performance (if available)
if command -v lighthouse &> /dev/null; then
  echo ""
  echo "💡 Running Lighthouse audit..."

  # Start dev server in background
  yarn dev > /dev/null 2>&1 &
  DEV_PID=$!

  # Wait for server to be ready
  sleep 10

  # Run lighthouse
  lighthouse http://localhost:3000 \
    --output json \
    --output-path "$OUTPUT_DIR/lighthouse.json" \
    --quiet \
    --chrome-flags="--headless" || true

  # Kill dev server
  kill $DEV_PID 2>/dev/null || true

  echo "✓ Lighthouse audit complete"
fi

# 5. Analyze node_modules size
echo ""
echo "📦 Analyzing dependencies..."
du -sh node_modules > "$OUTPUT_DIR/dependencies-size.txt"
npm list --depth=0 > "$OUTPUT_DIR/dependencies-list.txt" 2>&1 || true
echo "✓ Dependencies analyzed"

# 6. Create summary
echo ""
echo "📊 Creating summary..."
cat > "$OUTPUT_DIR/summary.txt" <<EOF
Performance Metrics Summary
Timestamp: $TIMESTAMP
Date: $(date)

=== Bundle Size ===
EOF

if [ -f "$OUTPUT_DIR/bundle-size.txt" ]; then
  cat "$OUTPUT_DIR/bundle-size.txt" >> "$OUTPUT_DIR/summary.txt"
fi

cat >> "$OUTPUT_DIR/summary.txt" <<EOF

=== Test Results ===
E2E Tests: $(grep -c "✓" "$OUTPUT_DIR/e2e-results.txt" 2>/dev/null || echo "N/A") passed
Unit Tests: $(grep "Tests:" "$OUTPUT_DIR/unit-results.txt" 2>/dev/null | head -1 || echo "N/A")

=== Dependencies ===
EOF

if [ -f "$OUTPUT_DIR/dependencies-size.txt" ]; then
  cat "$OUTPUT_DIR/dependencies-size.txt" >> "$OUTPUT_DIR/summary.txt"
fi

echo ""
echo "✅ Metrics collection complete!"
echo "Results saved to: $OUTPUT_DIR"
echo ""
echo "Summary:"
cat "$OUTPUT_DIR/summary.txt"
