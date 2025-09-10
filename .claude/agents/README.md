# Claude Agents Architecture

This directory contains specialized agents for various development tasks. The meta-agent architect ensures consistency and quality across all agents.

## Quick Start

1. **Creating a New Agent**:
   ```bash
   # Copy the template
   cp .claude/templates/agent-template.md .claude/agents/[category]/[agent-name].md
   
   # Fill in all sections
   # Register in .claude/config/agent-registry.json
   ```

2. **Using an Agent**:
   - Reference the agent by name in your prompts
   - Agents will use their defined tools and workflows
   - Check agent-registry.json for available agents

3. **Key Agents**:
   - **meta-agent-architect**: Creates and maintains other agents
   - **repo-cleaner**: Keeps codebase organized
   - **test-runner**: Comprehensive testing strategies
   - **code-reviewer**: Quality and security reviews

## Best Practices

1. **Always test locally** before marking tasks complete
2. **Prefer editing** existing files over creating new ones
3. **Use TodoWrite** for complex multi-step tasks
4. **Run linting** after code changes
5. **Keep agents focused** on specific responsibilities

## Structure

```
.claude/
├── agents/           # Agent definitions
├── templates/        # Templates for new agents
└── config/          # Registry and configuration
```

## Maintenance

- Review agents quarterly
- Update when project structure changes
- Remove deprecated agents
- Keep agent count minimal