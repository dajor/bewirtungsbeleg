# 🚀 Bewirtungsbeleg Agent System

## Overview
A comprehensive multi-agent system designed specifically for the Bewirtungsbeleg Next.js application. This system provides specialized agents for every aspect of development, from requirements gathering to testing and maintenance.

## ✨ Key Features

### 🏗️ Meta-Agent Architecture
- **Meta-Architect**: Central orchestrator ensuring consistency and best practices
- **Agent Registry**: JSON-based tracking of all agents and their capabilities
- **Template System**: Standardized agent creation templates

### 👥 Specialized Role Agents

#### Planning & Design
- **PM-Agent**: Requirements analysis, user stories, German compliance
- **UX-Designer**: Mantine-based UI design, German locale formatting

#### Development & Testing
- **Frontend-Dev**: React/Next.js implementation with TypeScript
- **Tester**: Jest-based unit and integration testing
- **E2E-Tester**: Playwright end-to-end testing

#### Maintenance & Optimization
- **Repo-Cleaner**: Code hygiene, file organization, duplicate removal
- **Local-Test-Improver**: Test performance optimization, flaky test fixes

## 🎯 Quick Start

### 1. Select Your Task Type
```bash
# View available agents
cat .claude/registry/agents.json | jq '.agents[].name'
```

### 2. Common Workflows

#### New Feature Development
```
PM-Agent → UX-Designer → Frontend-Dev → Tester → E2E-Tester → Repo-Cleaner
```

#### Bug Fix
```
Frontend-Dev → Tester → Repo-Cleaner
```

#### Testing Optimization
```
Local-Test-Improver + Tester + E2E-Tester (parallel)
```

## 📊 Agent Capabilities Matrix

| Agent | Primary Focus | Key Tools | German Support |
|-------|--------------|-----------|----------------|
| Meta-Architect | System Design | TodoWrite, MultiEdit | ✅ Guidelines |
| PM-Agent | Requirements | TodoWrite, WebFetch | ✅ Compliance |
| UX-Designer | UI/UX | Read, Grep | ✅ Locale |
| Frontend-Dev | Implementation | Edit, Bash | ✅ Formatting |
| Tester | Unit Tests | Bash, Write | ✅ Test Data |
| E2E-Tester | Integration | Playwright, Bash | ✅ Scenarios |
| Repo-Cleaner | Maintenance | Glob, MultiEdit | ✅ Naming |
| Local-Test-Improver | Performance | Read, Bash | ✅ Optimization |

## 🔄 Workflow Patterns

### Sequential Execution
Perfect for feature development where each step depends on the previous:
```
Requirements → Design → Implementation → Testing → Cleanup
```

### Parallel Execution
Optimal for independent tasks like comprehensive testing:
```
        ┌─> Unit Tests
Testing ─┼─> Integration Tests
        └─> E2E Tests
```

### Conditional Execution
Smart routing based on task analysis:
```
if (newFiles > 5) → Activate Repo-Cleaner
if (testsSlower) → Activate Local-Test-Improver
if (germanCompliance) → Activate PM-Agent
```

## 📁 Directory Structure
```
.claude/
├── agents/              # Individual agent definitions
├── templates/           # Agent creation templates
├── registry/           # Agent metadata and metrics
├── AGENT_MANAGER.md    # Management documentation
├── orchestrator.md     # Workflow orchestration
└── README.md          # This file
```

## 🎓 Best Practices

### For Clean Code
1. **Minimize File Creation**: Edit existing files when possible
2. **Follow Patterns**: Use existing code conventions
3. **Test Everything**: Every change needs tests
4. **German Locale**: Always format numbers/dates correctly

### For Agent Usage
1. **Use TodoWrite**: Track all tasks systematically
2. **Validate Quality Gates**: Build, test, lint must pass
3. **Clean After Work**: Always run repo-cleaner
4. **Document Decisions**: Keep agent registry updated

## 🚦 Quality Gates

Every workflow must pass:
- ✅ `yarn build` - TypeScript compilation
- ✅ `yarn test` - All tests passing
- ✅ `yarn lint` - Clean linting
- ✅ German formatting verified
- ✅ No console errors

## 📈 Performance Targets

- **Feature Development**: < 60 minutes
- **Bug Fix**: < 30 minutes
- **Test Suite**: < 15 seconds
- **E2E Tests**: < 30 seconds
- **File Modifications**: < 5 per feature

## 🛠️ Maintenance

### Weekly Tasks
1. Review agent utilization metrics
2. Update agent registry statistics
3. Identify optimization opportunities
4. Clean up unused code

### Monthly Tasks
1. Analyze workflow patterns
2. Update agent capabilities
3. Refine quality gates
4. Document lessons learned

## 🚨 Troubleshooting

### Common Issues

#### Tests Failing
→ Activate: Tester + Local-Test-Improver

#### Type Errors
→ Activate: Frontend-Dev (with TypeScript focus)

#### Performance Issues
→ Activate: Local-Test-Improver + Repo-Cleaner

#### German Formatting Issues
→ Activate: PM-Agent + Frontend-Dev

## 🔗 Integration Points

- **Next.js 14**: App Router, Server Components
- **Mantine UI v7**: Component library
- **OpenAI Vision**: OCR capabilities
- **Jest & Playwright**: Testing frameworks
- **German Locale**: DE number/date formatting

## 📚 Resources

- [Agent Manager](./AGENT_MANAGER.md) - Detailed management guide
- [Orchestrator](./orchestrator.md) - Workflow automation
- [Registry](./registry/agents.json) - Agent metadata
- [Templates](./templates/) - Agent creation templates

## 🎯 Success Metrics

- **Code Quality**: Zero TypeScript errors, 100% critical tests pass
- **Efficiency**: 95% first-attempt task success
- **Maintainability**: < 3 files modified per feature
- **Performance**: All operations < 5 minutes

---

**Remember**: The goal is clean, maintainable code with comprehensive testing and proper German localization. Let the agents work together to achieve this!