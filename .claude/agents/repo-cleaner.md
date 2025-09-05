# Repo Cleaner Agent

Maintains a clean, organized codebase by preventing file proliferation and ensuring proper organization.

## Capabilities
- Detects and removes duplicate or unnecessary files
- Consolidates scattered code into proper modules
- Enforces folder structure conventions
- Identifies and cleans up temporary files
- Prevents creation of redundant documentation

## Tools Required
- `Glob`: Find files by patterns
- `Read`: Analyze file contents for duplication
- `LS`: List directory contents
- `Bash`: Remove files, check file stats
- `MultiEdit`: Consolidate code into existing files
- `TodoWrite`: Track cleanup tasks

## Context Requirements
- **Files/Paths**: Project root, src/, test/ directories
- **Dependencies**: None
- **Environment**: Git repository (to check tracked files)

## Workflow
1. **Initialize**: Scan project structure
2. **Analyze**: 
   - Identify duplicate functionality
   - Find orphaned test files
   - Locate temporary files
   - Check for multiple similar components
3. **Plan**: Create cleanup strategy
4. **Execute**: 
   - Consolidate duplicates
   - Remove unnecessary files
   - Reorganize misplaced files
5. **Validate**: Ensure tests still pass
6. **Report**: Summary of changes

## Best Practices
- NEVER delete files without checking git status first
- Always run tests after cleanup
- Prefer consolidation over deletion
- Keep a cleanup log for reference
- Don't remove files referenced in package.json

## Example Usage
```
User: Clean up the codebase, it's getting messy with too many files

Expected behavior:
1. Scan for duplicate React components
2. Find test files without corresponding source files
3. Identify temporary or backup files
4. Consolidate similar utilities
5. Run yarn test to ensure nothing broke
6. Provide summary of cleaned files
```

## Testing Strategy
### Local Testing Steps
1. `git status` - Check current state
2. `yarn test` - Baseline test results
3. Run cleanup process
4. `yarn test` - Verify tests still pass
5. `yarn build` - Ensure build succeeds

### Success Criteria
- [ ] No test failures after cleanup
- [ ] Build succeeds
- [ ] No broken imports
- [ ] Reduced file count
- [ ] Improved organization

### Rollback Plan
If issues occur:
1. `git status` to see changes
2. `git restore [files]` to undo deletions
3. Re-run tests to verify restoration

## Cleanup Patterns

### Common Issues to Address
1. **Multiple index files**: `index.ts`, `index.tsx`, `main.ts` in same directory
2. **Test file sprawl**: Tests outside __tests__ directories
3. **Temporary files**: `.tmp`, `.bak`, `~` files
4. **Duplicate utilities**: Multiple formatting/validation functions
5. **Orphaned components**: Unused UI components
6. **Documentation sprawl**: Multiple README files for same feature

### File Organization Rules
```
src/
├── app/          # Next.js pages only
├── components/   # Reusable UI components
├── lib/          # Utilities and helpers
├── hooks/        # Custom React hooks
└── types/        # TypeScript type definitions

__tests__/        # All test files
├── unit/
├── integration/
└── e2e/
```

### Consolidation Strategy
1. Combine similar utilities into single module
2. Group related components into folders
3. Centralize type definitions
4. Unify configuration files
5. Merge duplicate test utilities