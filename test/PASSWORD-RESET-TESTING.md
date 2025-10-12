# Password Reset Testing Guide

This guide explains how to test the complete password reset flow, including email delivery verification using MailerSend.

## Test Overview

The password reset test (`playwright-5-password-reset-e2e.spec.ts`) covers:

1. ✅ User registration
2. ✅ Password reset request (sends email)
3. ✅ Email delivery verification (MailerSend Inbound API)
4. ✅ Token extraction from email
5. ✅ Password reset page access
6. ✅ New password submission
7. ✅ Auto-login verification
8. ✅ Protected page access
9. ✅ New password login test
10. ✅ Old password rejection

## Prerequisites

### 1. MailerSend Configuration

To test with real email delivery, you need:

1. **MailerSend Account**: Sign up at https://mailersend.com
2. **Inbound Route**: Configure an inbound domain (e.g., `@inbound.mailersend.net`)
3. **API Token**: Generate an API token with `Email` permissions

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# MailerSend API Key (for sending emails)
MAILERSEND_API_KEY=mlsn.your_api_key_here

# MailerSend Test Email (for receiving emails)
MAILERSEND_TEST_EMAIL=test-reset@inbound.mailersend.net
```

### 3. Test User Cleanup

The test creates temporary users with emails like `test-reset-1234567890@inbound.mailersend.net`.

Run the cleanup script periodically:

```bash
node test/helpers/cleanup-test-user.js
```

## Running the Tests

### Run Complete Password Reset Test

```bash
# With email verification (requires MAILERSEND_API_KEY)
yarn test:e2e test/playwright-5-password-reset-e2e.spec.ts

# Without email verification (will skip token extraction)
yarn test:e2e test/playwright-5-password-reset-e2e.spec.ts
```

### Run All Authentication Tests

```bash
# Run all auth tests in order
yarn test:e2e:auth

# Or run individually
yarn test:e2e playwright-1-register.spec.ts
yarn test:e2e playwright-2-login.spec.ts
yarn test:e2e playwright-3-password-reset.spec.ts
yarn test:e2e playwright-5-password-reset-e2e.spec.ts
```

## Test Modes

### Mode 1: With Email Verification (Full E2E)

**Requirements**:
- `MAILERSEND_API_KEY` environment variable set
- MailerSend inbound domain configured
- Internet connection

**What it tests**:
- Complete flow including email delivery
- Token extraction from real email
- Email arrives within 30 seconds

**Run command**:
```bash
MAILERSEND_API_KEY=mlsn.your_key yarn test:e2e playwright-5-password-reset-e2e.spec.ts
```

### Mode 2: Without Email Verification (Mock Token)

**Requirements**:
- None (runs offline)

**What it tests**:
- Password reset request UI
- Form validation
- Success messages
- ⚠️ Does NOT test email delivery

**Run command**:
```bash
yarn test:e2e playwright-5-password-reset-e2e.spec.ts
```

## MailerSend Setup Instructions

### Step 1: Create Inbound Domain

1. Go to https://app.mailersend.com/inbound
2. Click "Add domain"
3. Choose "Use MailerSend subdomain" or add your own
4. Example: `myapp.inbound.mailersend.net`

### Step 2: Configure Inbound Route

1. Go to "Inbound Routes"
2. Click "Create Route"
3. Set:
   - **Match**: `test-reset-*@inbound.mailersend.net`
   - **Forward to**: Your webhook (optional) or just store
   - **Enabled**: Yes

### Step 3: Generate API Token

1. Go to https://app.mailersend.com/api-tokens
2. Click "Generate new token"
3. Name: `Password Reset Testing`
4. Permissions: `Email: Full Access`, `Inbound: Full Access`
5. Copy the token (starts with `mlsn.`)

### Step 4: Test Email Sending

```bash
# Send test email
curl -X POST https://api.mailersend.com/v1/email \\
  -H "Authorization: Bearer mlsn.your_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": {"email": "no-reply@your-domain.com"},
    "to": [{"email": "test@inbound.mailersend.net"}],
    "subject": "Test",
    "text": "Test email"
  }'
```

### Step 5: Test Email Receiving

```bash
# Check inbound emails
curl https://api.mailersend.com/v1/inbound \\
  -H "Authorization: Bearer mlsn.your_token"
```

## Debugging Failed Tests

### Email Not Received

**Symptoms**: Test times out waiting for email

**Solutions**:
1. Check MailerSend dashboard for delivery status
2. Verify inbound route is enabled
3. Check spam folder (if forwarding to real email)
4. Increase timeout in test (currently 30 seconds)

```typescript
const maxAttempts = 60; // Increase from 30 to 60 seconds
```

### Token Not Extracted

**Symptoms**: Email received but token not found

**Solutions**:
1. Check email template in `src/lib/email/templates/password-reset.ts`
2. Verify token URL format matches regex: `/token=([a-zA-Z0-9_-]+)/`
3. Check email content in MailerSend dashboard

### 404 on Reset Page

**Symptoms**: Visiting `/auth/passwort-zurucksetzen?token=...` returns 404

**Solutions**:
1. Restart dev server: `yarn dev`
2. Check Next.js build: `yarn build`
3. Verify file exists: `src/app/auth/passwort-zurucksetzen/page.tsx`

### Auto-Login Fails

**Symptoms**: Password reset succeeds but doesn't auto-login

**Solutions**:
1. Check browser console for NextAuth errors
2. Verify DocBits auth server is reachable
3. Check password was actually updated in database
4. Try manual login with new password

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Password Reset E2E Tests
  env:
    MAILERSEND_API_KEY: ${{ secrets.MAILERSEND_API_KEY }}
    MAILERSEND_TEST_EMAIL: test-ci@inbound.mailersend.net
  run: |
    yarn test:e2e playwright-5-password-reset-e2e.spec.ts
```

### Pre-deployment Hook

Add to your deployment pipeline:

```bash
#!/bin/bash
# Run critical auth tests before deploying
yarn test:e2e:auth

if [ $? -ne 0 ]; then
  echo "❌ Auth tests failed - blocking deployment"
  exit 1
fi

echo "✅ Auth tests passed - proceeding with deployment"
```

## Test Coverage

The complete password reset test suite covers:

| Test File | Coverage |
|-----------|----------|
| `playwright-1-register.spec.ts` | User registration |
| `playwright-2-login.spec.ts` | Login flow |
| `playwright-3-password-reset.spec.ts` | Password reset UI |
| `playwright-5-password-reset-e2e.spec.ts` | **Complete flow with email** |

## Expected Test Results

### Successful Run

```
🧪 TEST: Complete Password Reset with Email Verification

=== Step 1: Register Test User ===
✓ Registration successful, redirected to login

=== Step 2: Request Password Reset ===
✓ Password reset email sent

=== Step 3: Wait for Email and Extract Token ===
Checking for email (attempt 1/30)...
Checking for email (attempt 2/30)...
Checking for email (attempt 3/30)...
✓ Reset token extracted from email: EyRqf6bkMvYVXQvLSt0Va9...

=== Step 4: Visit Password Reset Link ===
✓ Reset page loaded successfully

=== Step 5: Set New Password ===
✓ Password changed successfully

=== Step 6: Verify Auto-Login ===
✓ Auto-login successful, redirected to main app

=== Step 7: Verify Access to Protected Pages ===
✓ Can access protected page: Bewirtungsbeleg erstellen
✓ User is authenticated

=== Step 8: Test Login with New Password ===
✓ Can login with new password

=== Step 9: Verify Old Password Doesn't Work ===
✓ Old password correctly rejected

✅ COMPLETE PASSWORD RESET FLOW TEST PASSED!
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Check `AUTH_SERVER` environment variable
2. **Rate limiting**: Wait 60 seconds between test runs
3. **Email delays**: Increase `maxAttempts` in test
4. **Token expiry**: Run test within 15 minutes of email send

### Debug Mode

Run tests with debug logging:

```bash
DEBUG=pw:api yarn test:e2e playwright-5-password-reset-e2e.spec.ts
```

## Support

For issues with:
- **MailerSend**: https://www.mailersend.com/help
- **Playwright**: https://playwright.dev/docs/intro
- **This codebase**: Open an issue on GitHub

## Related Documentation

- [MailerSend API Docs](https://developers.mailersend.com/)
- [Playwright Test Docs](https://playwright.dev/docs/test-assertions)
- [Password Reset Implementation](../src/app/api/auth/reset-password/route.ts)
- [Email Templates](../src/lib/email/templates/password-reset.ts)
