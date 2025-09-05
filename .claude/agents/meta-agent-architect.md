# Meta Agent Architect

The architect for creating and maintaining consistent, high-quality agents in this repository.

## Agent Creation Standards

### 1. File Structure
```
.claude/
├── agents/
│   ├── meta-agent-architect.md      # This file - the architect
│   ├── repo-cleaner.md              # Maintains clean codebase
│   ├── test-runner.md               # Handles local testing
│   ├── code-reviewer.md             # Reviews code changes
│   └── [category]/                  # Organized by function
│       └── [specific-agent].md
├── templates/                       # Agent templates
│   └── agent-template.md
└── config/
    └── agent-registry.json          # Central registry of all agents
```

### 2. Naming Conventions
- Use kebab-case for agent files: `api-endpoint-generator.md`
- Descriptive names that clearly indicate purpose
- Prefix with category when appropriate: `test-unit-test-writer.md`

### 3. Agent Structure Template
Every agent MUST follow this structure:

```markdown
# Agent Name

Brief description of what this agent does.

## Capabilities
- Clear bullet points of what the agent can do
- Specific use cases

## Tools Required
- List of Claude tools this agent needs
- Why each tool is needed

## Context Requirements
- What information the agent needs
- Required file paths or patterns
- Dependencies on other agents

## Workflow
1. Step-by-step process
2. Decision points
3. Error handling

## Best Practices
- Specific guidelines for this agent
- Common pitfalls to avoid

## Example Usage
\`\`\`
Example prompt and expected behavior
\`\`\`

## Testing Strategy
- How to test this agent locally
- Expected outcomes
- Validation criteria
```

### 4. Tool Selection Guidelines

Based on this repository's patterns:

**Essential Tools:**
- `Read`: For understanding existing code
- `Edit`/`MultiEdit`: For modifying files
- `Write`: Only when creating truly new files
- `Bash`: For running yarn commands, tests
- `Grep`/`Glob`: For searching codebase
- `TodoWrite`: For complex multi-step tasks

**Tool Usage Rules:**
1. ALWAYS prefer Edit over Write for existing files
2. Use MultiEdit for multiple changes to same file
3. Batch related Bash commands for efficiency
4. Use TodoWrite for tasks with >3 steps

### 5. Best Practices Enforcement

**Code Quality:**
- Run `yarn lint` after code changes
- Run `yarn test` for affected components
- Follow TypeScript strict mode
- Maintain existing code style

**File Management:**
- Check if file exists before Write
- Use proper folder structure
- Clean up temporary files
- Avoid creating unnecessary documentation

**Testing Focus:**
- Write tests for new functionality
- Update existing tests when modifying code
- Use established mock patterns
- Test edge cases and error scenarios

### 6. Agent Categories

Organize agents by primary function:
- `api/` - API route generators, endpoint handlers
- `ui/` - Component builders, UI updates
- `test/` - Test writers, test runners
- `utility/` - Formatters, validators, helpers
- `maintenance/` - Cleaners, refactoring tools
- `security/` - Security scanners, validators

### 7. Quality Checklist

Before finalizing any agent:
- [ ] Follows naming convention
- [ ] Includes all required sections
- [ ] Lists specific tools needed
- [ ] Has clear workflow steps
- [ ] Includes testing strategy
- [ ] Registered in agent-registry.json
- [ ] Has at least one example

### 8. Local Testing Requirements

Every agent MUST include:
1. How to test locally before deployment
2. Specific yarn commands to validate changes
3. Expected test output examples
4. Rollback procedures if tests fail

### 9. Creating New Agents

To create a new agent:
1. Determine category and purpose
2. Copy template from `.claude/templates/agent-template.md`
3. Fill all required sections
4. Test the agent workflow locally
5. Register in `agent-registry.json`
6. Submit for review

### 10. Maintenance Guidelines

- Review agents quarterly for relevance
- Update when project structure changes
- Remove deprecated agents
- Consolidate overlapping functionality
- Keep agent count minimal and focused