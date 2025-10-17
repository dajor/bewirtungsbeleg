#!/bin/bash

# Apply Phase 2 fixes to all test files
# This increases waitForLoadState delays and adds proper DOM readiness checks

echo "=== Applying Phase 2 Fixes ==="

# Fix pdf-conversion.spec.ts
echo "Fixing pdf-conversion.spec.ts..."
sed -i '' 's/await this\.page\.waitForLoadState.*networkidle.*);$/await this.page.waitForLoadState('\''networkidle'\'');\n    await this.page.waitForLoadState('\''domcontentloaded'\'');\n    await this.page.waitForTimeout(1000);/' test/pdf-conversion.spec.ts

# Fix image-preview-real.spec.ts
echo "Fixing image-preview-real.spec.ts..."
sed -i '' 's/await page\.waitForLoadState.*networkidle.*);$/await page.waitForLoadState('\''networkidle'\'');\n    await page.waitForLoadState('\''domcontentloaded'\'');\n    await page.waitForTimeout(1000);/' test/image-preview-real.spec.ts

# Fix e2e-zugferd.spec.ts
echo "Fixing e2e-zugferd.spec.ts..."
sed -i '' 's/await page\.waitForLoadState.*networkidle.*);$/await page.waitForLoadState('\''networkidle'\'');\n    await page.waitForLoadState('\''domcontentloaded'\'');\n    await page.waitForTimeout(1000);/' test/e2e-zugferd.spec.ts

# Fix end2end-test.spec.ts
echo "Fixing end2end-test.spec.ts..."
sed -i '' 's/await page\.waitForLoadState.*networkidle.*);$/await page.waitForLoadState('\''networkidle'\'');\n  await page.waitForLoadState('\''domcontentloaded'\'');\n  await page.waitForTimeout(1000);/' test/end2end-test.spec.ts

# Fix e2e-eigenbeleg-workflow.spec.ts
echo "Fixing e2e-eigenbeleg-workflow.spec.ts..."
sed -i '' 's/await page\.waitForLoadState.*networkidle.*);$/await page.waitForLoadState('\''networkidle'\'');\n  await page.waitForLoadState('\''domcontentloaded'\'');\n  await page.waitForTimeout(1000);/' test/e2e-eigenbeleg-workflow.spec.ts

# Fix e2e-critical-scenarios.spec.ts
echo "Fixing e2e-critical-scenarios.spec.ts..."
sed -i '' 's/await page\.waitForLoadState.*networkidle.*);$/await page.waitForLoadState('\''networkidle'\'');\n  await page.waitForLoadState('\''domcontentloaded'\'');\n  await page.waitForTimeout(1000);/' test/e2e-critical-scenarios.spec.ts

echo "=== Phase 2 fixes applied ==="
