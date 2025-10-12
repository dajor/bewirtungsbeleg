# Claude Code Documentation

This directory contains context-specific documentation for Claude Code to optimize token usage.

## File Structure

- **`commands.md`**: All yarn/npm commands
- **`frontend.md`**: UI components, forms, German localization
- **`api.md`**: API routes, security, OpenAI integration
- **`deployment.md`**: DigitalOcean App Platform configuration
- **`testing.md`**: Test patterns, mock configurations

## Why Separate Files?

Instead of loading one large CLAUDE.md file (consuming ~2000 tokens), Claude can now:
- Load only relevant context (frontend work = only frontend.md)
- Reduce token usage by 60-80%
- Get more focused, relevant information
- Scale documentation without impacting performance

## Usage

Claude Code automatically reads `CLAUDE.md` at the root, which now acts as a directory to these specialized files. Claude can read specific files as needed based on the task context.

## Maintenance

When adding new features:
1. Update the relevant specialized file
2. Keep information focused and concise
3. Remove outdated information promptly
