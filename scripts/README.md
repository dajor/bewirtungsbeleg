# Performance Metrics Scripts

This directory contains scripts for capturing and comparing performance metrics during optimization work.

## Quick Start

### 1. Capture Baseline (First Time Only)
```bash
./scripts/capture-baseline-simple.sh
```

This creates `metrics/baseline/` with:
- Bundle sizes
- Dependency sizes
- Source code metrics
- Component line counts

### 2. Make Performance Changes
Edit your code to implement optimizations.

### 3. Capture Current Metrics
```bash
./scripts/capture-baseline-simple.sh metrics/current
```

### 4. Compare Metrics
```bash
./scripts/compare-metrics.sh metrics/baseline metrics/current
```

This shows:
- ✅ 📉 = Improvements (smaller bundle, faster)
- ⚠️ 📈 = Regressions (larger bundle, slower)
- ➡️ = No significant change

### 5. If Metrics Look Good
```bash
./scripts/save-baseline.sh metrics/current
```

This saves the current metrics as the new baseline for future comparisons.

## Available Scripts

### capture-baseline-simple.sh
**Fast baseline capture using existing build**

```bash
./scripts/capture-baseline-simple.sh [output_dir]
```

- Default output: `metrics/baseline`
- Uses existing .next build
- Captures bundle sizes, dependencies, source code metrics
- Runs in ~5 seconds

**Example:**
```bash
./scripts/capture-baseline-simple.sh metrics/after-memoization
```

### collect-metrics.sh
**Comprehensive metrics collection (includes rebuild and tests)**

```bash
./scripts/collect-metrics.sh [output_dir]
```

- Default output: `metrics/current`
- Rebuilds the application
- Runs full test suite
- Optional Lighthouse audit
- Runs in ~5-10 minutes

**Example:**
```bash
./scripts/collect-metrics.sh metrics/phase1-complete
```

### compare-metrics.sh
**Compare two metric directories**

```bash
./scripts/compare-metrics.sh [baseline_dir] [current_dir]
```

- Shows side-by-side comparison
- Calculates percentage changes
- Highlights regressions
- Exit code 1 if tests fail

**Example:**
```bash
./scripts/compare-metrics.sh metrics/baseline metrics/after-optimization
```

### save-baseline.sh
**Save current metrics as new baseline**

```bash
./scripts/save-baseline.sh [source_dir]
```

- Backs up existing baseline
- Copies source metrics to baseline
- Updates metadata

**Example:**
```bash
./scripts/save-baseline.sh metrics/current
```

### quick-baseline.sh
**Original quick baseline script**

Similar to `capture-baseline-simple.sh` but runs build first.

## Workflow Examples

### Safe Optimization Workflow

```bash
# 1. Capture starting point
./scripts/capture-baseline-simple.sh metrics/before-memo

# 2. Make changes (add React.memo)
vim src/app/components/SomeComponent.tsx

# 3. Capture results
./scripts/capture-baseline-simple.sh metrics/after-memo

# 4. Compare
./scripts/compare-metrics.sh metrics/before-memo metrics/after-memo

# 5. If good, update baseline
./scripts/save-baseline.sh metrics/after-memo
```

### Multi-Phase Optimization

```bash
# Phase 1: React.memo
./scripts/capture-baseline-simple.sh metrics/baseline
# ... make changes ...
./scripts/capture-baseline-simple.sh metrics/phase1
./scripts/compare-metrics.sh metrics/baseline metrics/phase1

# Phase 2: Lazy Loading
./scripts/save-baseline.sh metrics/phase1  # Phase 1 becomes new baseline
# ... make changes ...
./scripts/capture-baseline-simple.sh metrics/phase2
./scripts/compare-metrics.sh metrics/baseline metrics/phase2

# Phase 3: Component Splitting
./scripts/save-baseline.sh metrics/phase2
# ... make changes ...
./scripts/capture-baseline-simple.sh metrics/phase3
./scripts/compare-metrics.sh metrics/baseline metrics/phase3
```

## Metrics Captured

### Bundle Metrics
- `.next` directory total size
- Individual chunk sizes
- Top 10 largest chunks

### Dependency Metrics
- `node_modules` size
- Total package count

### Source Code Metrics
- `src` directory size
- TypeScript file count
- Key component line counts

### Test Results (full collection only)
- E2E test pass/fail counts
- Unit test pass/fail counts

### Performance Scores (if Lighthouse available)
- Performance score
- First Contentful Paint
- Time to Interactive

## Tips

1. **Use simple script during development:** `capture-baseline-simple.sh` is faster
2. **Use full script before commits:** `collect-metrics.sh` includes tests
3. **Always compare before committing:** Ensure no regressions
4. **Back up baselines:** Old baselines saved to `metrics/baseline-backups/`
5. **Check git status:** Scripts include git commit info in metadata

## Troubleshooting

### "No .next directory found"
Run `yarn build` first, or use `quick-baseline.sh` which builds automatically.

### "Command not found: bc"
Install bc for percentage calculations:
```bash
brew install bc  # macOS
```

### Tests taking too long
Use `capture-baseline-simple.sh` to skip tests during rapid iteration.

### Comparison shows N/A
Ensure both directories have the same metric files. Run the same capture script for both.

## Directory Structure

```
metrics/
├── baseline/              # Current baseline for comparisons
│   ├── README.md         # Documentation
│   ├── summary.txt       # Quick overview
│   └── *.txt            # Individual metrics
├── baseline-backups/     # Historical baselines
│   └── baseline-20251011_195430/
└── current/              # Latest metrics (temporary)
```

## Integration with Performance Plan

These scripts support the 3-phase performance optimization plan:

- **Phase 1:** React.memo, useMemo, lazy loading
- **Phase 2:** API optimization, caching, dependencies
- **Phase 3:** Component splitting, refactoring

After each change:
1. Capture metrics
2. Compare to baseline
3. Verify improvements
4. Run tests
5. Update baseline if successful

## See Also

- `metrics/baseline/README.md` - Current baseline documentation
- GitHub Issue #871 - Auth endpoint issue (skip auth tests)
- Performance analysis report - See conversation history
