#!/bin/bash

# Save Current Metrics as Baseline
# Copies current metrics to baseline directory for future comparisons
# Usage: ./scripts/save-baseline.sh [source_dir]

set -e

SOURCE_DIR="${1:-metrics/current}"
BASELINE_DIR="metrics/baseline"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="metrics/baseline-backups/baseline-$TIMESTAMP"

echo "=== Save Performance Baseline ==="
echo "Source:   $SOURCE_DIR"
echo "Baseline: $BASELINE_DIR"
echo ""

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ Error: Source directory not found: $SOURCE_DIR"
  echo ""
  echo "Please run: ./scripts/collect-metrics.sh first"
  exit 1
fi

# Backup existing baseline if it exists
if [ -d "$BASELINE_DIR" ]; then
  echo "📦 Backing up existing baseline..."
  mkdir -p "$BACKUP_DIR"
  cp -r "$BASELINE_DIR"/* "$BACKUP_DIR/"
  echo "✓ Backup saved to: $BACKUP_DIR"
  echo ""
fi

# Create baseline directory
mkdir -p "$BASELINE_DIR"

# Copy metrics to baseline
echo "💾 Saving new baseline..."
cp -r "$SOURCE_DIR"/* "$BASELINE_DIR/"

# Add metadata
cat > "$BASELINE_DIR/metadata.txt" <<EOF
Baseline Metadata
Created: $(date)
Timestamp: $TIMESTAMP
Git Branch: $(git branch --show-current 2>/dev/null || echo "unknown")
Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
EOF

echo "✓ New baseline saved to: $BASELINE_DIR"
echo ""

# Show summary
if [ -f "$BASELINE_DIR/summary.txt" ]; then
  echo "📊 Baseline Summary:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  cat "$BASELINE_DIR/summary.txt"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo ""
echo "✅ Baseline saved successfully!"
echo ""
echo "Next steps:"
echo "  1. Make performance optimizations"
echo "  2. Run: ./scripts/collect-metrics.sh"
echo "  3. Run: ./scripts/compare-metrics.sh"
