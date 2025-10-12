#!/bin/bash

# Simple Baseline Capture (uses existing build)
# Usage: ./scripts/capture-baseline-simple.sh

set -e

OUTPUT_DIR="metrics/baseline"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Simple Baseline Capture ==="
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# 1. Check if build exists
if [ ! -d ".next" ]; then
  echo "❌ No build found. Running build first..."
  yarn build
fi

# 2. Bundle Size
echo "📦 Bundle Size"
du -sh .next > "$OUTPUT_DIR/bundle-size.txt"
echo "  Total: $(cat $OUTPUT_DIR/bundle-size.txt)"

# 3. Chunk Sizes
echo ""
echo "📦 Top 10 Largest Chunks"
find .next/static/chunks -type f -name "*.js" 2>/dev/null | \
  xargs ls -lh | awk '{print $5, $9}' | sort -hr | head -10 | tee "$OUTPUT_DIR/chunk-sizes.txt"

# 4. Dependencies
echo ""
echo "📦 Dependencies"
du -sh node_modules | tee "$OUTPUT_DIR/dependencies-size.txt"

# 5. Source Code
echo ""
echo "📁 Source Code"
du -sh src | tee "$OUTPUT_DIR/source-size.txt"
echo -n "  Files: "
find src -name "*.tsx" -o -name "*.ts" | wc -l | tee "$OUTPUT_DIR/source-files.txt"

# 6. Main Form Component
echo ""
echo "📄 Main Form Component"
if [ -f "src/app/components/BewirtungsbelegForm.tsx" ]; then
  ls -lh src/app/components/BewirtungsbelegForm.tsx | awk '{print "  Size: " $5}'
  wc -l src/app/components/BewirtungsbelegForm.tsx | awk '{print "  Lines: " $1}' | tee "$OUTPUT_DIR/main-form-lines.txt"
fi

# 7. Package Info
echo ""
echo "📦 Package Information"
echo -n "  Total packages: "
npm list --depth=0 2>/dev/null | grep -c "├\|└" | tee "$OUTPUT_DIR/package-count.txt"

# 8. Git Info
echo ""
echo "📝 Git Information"
echo "  Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "  Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# 9. Create summary
cat > "$OUTPUT_DIR/summary.txt" <<EOF
Performance Baseline Summary
Captured: $(date)
Timestamp: $TIMESTAMP

=== Build Artifacts ===
.next directory: $(cat "$OUTPUT_DIR/bundle-size.txt")

=== Dependencies ===
node_modules: $(cat "$OUTPUT_DIR/dependencies-size.txt")
Packages: $(cat "$OUTPUT_DIR/package-count.txt")

=== Source Code ===
src directory: $(cat "$OUTPUT_DIR/source-size.txt")
TypeScript files: $(cat "$OUTPUT_DIR/source-files.txt")

=== Key Component ===
BewirtungsbelegForm.tsx: $(cat "$OUTPUT_DIR/main-form-lines.txt" 2>/dev/null || echo "N/A") lines

=== Git ===
Branch: $(git branch --show-current 2>/dev/null || echo "unknown")
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

=== Top 10 Largest Chunks ===
$(cat "$OUTPUT_DIR/chunk-sizes.txt")
EOF

# 10. Save metadata
cat > "$OUTPUT_DIR/metadata.txt" <<EOF
Baseline Metadata
Created: $(date)
Timestamp: $TIMESTAMP
Git Branch: $(git branch --show-current 2>/dev/null || echo "unknown")
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Git Commit Short: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
Node Version: $(node --version 2>/dev/null || echo "unknown")
Yarn Version: $(yarn --version 2>/dev/null || echo "unknown")
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat "$OUTPUT_DIR/summary.txt"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Baseline captured successfully!"
echo "   Saved to: $OUTPUT_DIR"
