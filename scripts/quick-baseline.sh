#!/bin/bash

# Quick Performance Metrics Collection
# Captures essential metrics without running full E2E suite
# Usage: ./scripts/quick-baseline.sh [output_dir]

set -e

OUTPUT_DIR="${1:-metrics/baseline}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Quick Performance Baseline Collection ==="
echo "Output directory: $OUTPUT_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# 1. Bundle Size Analysis
echo "📦 Analyzing bundle size..."
yarn build > "$OUTPUT_DIR/build-output.txt" 2>&1

# Extract bundle sizes from Next.js build output
if [ -f ".next/standalone/package.json" ]; then
  du -sh .next/standalone > "$OUTPUT_DIR/bundle-size.txt"
  echo "✓ Bundle size: $(cat $OUTPUT_DIR/bundle-size.txt)"
fi

# Analyze individual chunk sizes
if [ -d ".next/static/chunks" ]; then
  find .next/static/chunks -type f -name "*.js" -exec ls -lh {} \; | \
    awk '{print $5, $9}' | sort -hr | head -10 > "$OUTPUT_DIR/chunk-sizes.txt"
  echo "✓ Top 10 chunks analyzed"
fi

echo ""

# 2. Run Unit Tests Only (fast)
echo "🔬 Running unit tests..."
yarn test --run > "$OUTPUT_DIR/unit-results.txt" 2>&1 || true
UNIT_PASSED=$(grep "Tests:" "$OUTPUT_DIR/unit-results.txt" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' || echo "0")
echo "✓ Unit tests: $UNIT_PASSED passed"

echo ""

# 3. Analyze node_modules size
echo "📦 Analyzing dependencies..."
du -sh node_modules > "$OUTPUT_DIR/dependencies-size.txt"
npm list --depth=0 > "$OUTPUT_DIR/dependencies-list.txt" 2>&1 || true
echo "✓ Dependencies: $(cat $OUTPUT_DIR/dependencies-size.txt)"

echo ""

# 4. Analyze source code size
echo "📁 Analyzing source code..."
du -sh src > "$OUTPUT_DIR/source-size.txt"
find src -name "*.tsx" -o -name "*.ts" | wc -l > "$OUTPUT_DIR/source-files.txt"
echo "✓ Source size: $(cat $OUTPUT_DIR/source-size.txt), Files: $(cat $OUTPUT_DIR/source-files.txt)"

echo ""

# 5. Analyze key component sizes
echo "📄 Analyzing key components..."
ls -lh src/app/components/BewirtungsbelegForm.tsx | awk '{print $5}' > "$OUTPUT_DIR/main-form-size.txt" 2>/dev/null || echo "N/A" > "$OUTPUT_DIR/main-form-size.txt"
wc -l src/app/components/BewirtungsbelegForm.tsx | awk '{print $1}' > "$OUTPUT_DIR/main-form-lines.txt" 2>/dev/null || echo "N/A" > "$OUTPUT_DIR/main-form-lines.txt"
echo "✓ Main form: $(cat $OUTPUT_DIR/main-form-size.txt), Lines: $(cat $OUTPUT_DIR/main-form-lines.txt)"

echo ""

# 6. Create summary
echo "📊 Creating summary..."
cat > "$OUTPUT_DIR/summary.txt" <<EOF
Performance Metrics Summary
Timestamp: $TIMESTAMP
Date: $(date)
Git Branch: $(git branch --show-current 2>/dev/null || echo "unknown")
Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

=== Bundle Size ===
Standalone: $(cat "$OUTPUT_DIR/bundle-size.txt" 2>/dev/null || echo "N/A")

Top 5 Largest Chunks:
$(head -5 "$OUTPUT_DIR/chunk-sizes.txt" 2>/dev/null || echo "N/A")

=== Test Results ===
Unit Tests: $UNIT_PASSED passed

=== Dependencies ===
node_modules: $(cat "$OUTPUT_DIR/dependencies-size.txt" 2>/dev/null || echo "N/A")

=== Source Code ===
Size: $(cat "$OUTPUT_DIR/source-size.txt" 2>/dev/null || echo "N/A")
Files: $(cat "$OUTPUT_DIR/source-files.txt" 2>/dev/null || echo "N/A")

=== Key Components ===
BewirtungsbelegForm.tsx: $(cat "$OUTPUT_DIR/main-form-size.txt" 2>/dev/null || echo "N/A"), $(cat "$OUTPUT_DIR/main-form-lines.txt" 2>/dev/null || echo "N/A") lines

=== Next.js Build Output (Last 20 lines) ===
$(tail -20 "$OUTPUT_DIR/build-output.txt" 2>/dev/null || echo "N/A")
EOF

echo ""
echo "✅ Quick baseline collection complete!"
echo "Results saved to: $OUTPUT_DIR"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$OUTPUT_DIR/summary.txt"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
