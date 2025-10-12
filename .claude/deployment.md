# Deployment Documentation

## DigitalOcean App Platform

### Dev Environment
- **Branch**: `dev`
- **App ID**: `f75cb63f-d548-419f-95aa-c3b9a9ac53a3`
- **URL**: https://dev.bewirtungsbeleg.docbits.com/
- **App Name**: "whale-app"

### Production Environment
- **Branch**: `main`
- **App ID**: `35e0d2dd-82ab-4c1d-8da6-67057301433c`
- **URL**: https://bewirtungsbeleg.docbits.com/
- **App Name**: "bewirtungsbeleg"
- **Autoscaling**: 1-4 instances (70% CPU threshold)

## Managing Apps

Use DigitalOcean MCP tools:
```bash
# Get app info
mcp__digitalocean__apps-get-info

# Get deployment status
mcp__digitalocean__apps-get-deployment-status

# Update app
mcp__digitalocean__apps-update
```

## Deployment Flow

1. Push to `dev` branch → Auto-deploy to dev environment
2. Create PR to `main` → Review
3. Merge to `main` → Auto-deploy to production

## Build Configuration

- **Build Command**: `yarn build`
- **Start Command**: `node server.js`
- **Node Version**: 18.x
- **Environment**: Production

## Health Checks

Production server includes health check endpoint for monitoring.
