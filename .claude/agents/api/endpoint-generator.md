# API Endpoint Generator

Creates Next.js 14 API route handlers with proper validation, error handling, and testing.

## Capabilities
- Generate RESTful API endpoints following Next.js 14 conventions
- Implement Zod validation schemas automatically
- Add proper error handling and status codes
- Create corresponding test files with mocks
- Implement rate limiting where appropriate
- Add TypeScript types for request/response

## Tools Required
- `Read`: Analyze existing API patterns
- `Write`: Create new API route files
- `MultiEdit`: Add validation schemas to lib/validation.ts
- `Bash`: Run tests and type checking
- `TodoWrite`: Track endpoint creation steps

## Context Requirements
- **Files/Paths**: src/app/api/, src/lib/validation.ts, __tests__/
- **Dependencies**: Next.js 14, Zod, existing auth setup
- **Environment**: TypeScript strict mode, ESLint config

## Workflow
1. **Analyze Requirements**: Parse endpoint specification
2. **Check Existing**: Verify endpoint doesn't exist
3. **Create Route Handler**:
   - Implement HTTP method handlers
   - Add input validation
   - Include error handling
   - Add rate limiting if needed
4. **Add Validation Schema**: Update lib/validation.ts
5. **Create Tests**: Generate comprehensive test suite
6. **Verify**: Run tests and type checking
7. **Document**: Update API documentation if needed

## Best Practices
- Use Zod for all input validation
- Return consistent error formats
- Include proper HTTP status codes
- Add rate limiting for sensitive endpoints
- Test both success and error cases
- Follow existing auth patterns

## Example Usage
```
User: Create an API endpoint for updating user preferences at /api/user/preferences

Expected behavior:
1. Create src/app/api/user/preferences/route.ts
2. Add PreferencesSchema to lib/validation.ts
3. Implement PUT method with validation
4. Add authentication check
5. Create __tests__/api/user/preferences.test.ts
6. Run yarn test preferences
7. Verify TypeScript compilation
```

## Testing Strategy
### Local Testing Steps
1. `yarn test api/user/preferences`
2. `yarn tsc --noEmit`
3. Test with curl or REST client
4. Verify error responses
5. Check rate limiting

### Success Criteria
- [ ] Endpoint responds correctly
- [ ] Validation works properly
- [ ] Auth checks in place
- [ ] Tests pass with >80% coverage
- [ ] TypeScript compiles

### Rollback Plan
If endpoint has issues:
1. Remove route file
2. Remove validation schema
3. Remove test file
4. Clean up any imports

## Template Structure

### Route Handler Template
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { [Schema] } from '@/lib/validation'
import { rateLimiter } from '@/lib/rate-limit'

export async function [METHOD](request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip ?? 'anonymous'
    const { success } = await rateLimiter.limit(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validation
    const body = await request.json()
    const validatedData = [Schema].parse(body)

    // Business logic
    // TODO: Implement

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```