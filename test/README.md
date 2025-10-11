# Playwright E2E Tests

## Authentication Tests with MailerSend Webhook

This directory contains comprehensive E2E tests for the authentication flow using MailerSend webhook integration.

### Test Files

1. **`playwright-register.spec.ts`** - Complete registration flow
   - Fills registration form with test data
   - Waits for verification email via webhook
   - Extracts verification link from email
   - Sets up password
   - Verifies auto-login to `/bewirtungsbeleg`
   - Cleans up for next test

2. **`playwright-login.spec.ts`** - Login flow
   - Tests login with credentials from registration
   - Verifies redirect and authentication
   - Tests error handling for invalid credentials

### Test User Credentials

```typescript
const TEST_USER = {
  firstName: 'Test',
  lastName: 'Tester',
  email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
  password: 'Tester45%',
};
```

## Setup: MailerSend Webhook Configuration

### 1. Configure MailerSend Webhook

Go to your MailerSend dashboard and add a webhook:

- **Webhook URL:** `https://dev.bewirtungsbeleg.docbits.com/api/webhook/register`
- **Event Type:** `activity.sent`
- **Description:** E2E test email capture

### 2. Verify Webhook Endpoint

The webhook endpoint is available at:
- Local: `http://localhost:3000/api/webhook/register`
- Dev: `https://dev.bewirtungsbeleg.docbits.com/api/webhook/register`

**Endpoints:**
- `POST /api/webhook/register` - Receives webhook from MailerSend
- `GET /api/webhook/register?email=test@example.com` - Retrieve stored email
- `DELETE /api/webhook/register?email=test@example.com` - Clear specific email
- `DELETE /api/webhook/register` - Clear all stored emails

## Running the Tests

### Sequential Execution (Recommended)

The authentication tests must run in sequence because `playwright-login` depends on the user created by `playwright-register`:

```bash
# Run both tests sequentially
yarn test:e2e:auth

# Or using npx
npx playwright test playwright-register playwright-login --workers=1
```

### Individual Tests

```bash
# Run only registration test
npx playwright test playwright-register

# Run only login test (requires registration to have run first!)
npx playwright test playwright-login
```

### All E2E Tests

```bash
# Run all Playwright tests
yarn test:e2e
```

## How It Works

### Registration Flow

1. **User Registration**
   - Navigate to `/auth/register`
   - Fill form: `Test Tester` / `uzylloqimwnkvwjfufeq@inbound.mailersend.net`
   - Accept terms and submit

2. **Email Reception via Webhook**
   - MailerSend sends email with verification link
   - Webhook receives email at `/api/webhook/register`
   - Email stored in memory (expires after 5 minutes)
   - Test polls webhook endpoint to retrieve email

3. **Email Verification**
   - Extract verification link from email HTML/text
   - Navigate to link: `/auth/setup-password?token=...`
   - Token verified via `/api/auth/verify-email`

4. **Password Setup**
   - Enter password: `Tester45%` (twice)
   - Submit to `/api/auth/setup-password`
   - Auto-login with `signIn('credentials')`
   - Redirect to `/bewirtungsbeleg`

5. **Cleanup**
   - Clear cookies for next test

### Login Flow

1. **Navigate to Signin**
   - Go to `/auth/signin`
   - Ensure password mode is active

2. **Submit Credentials**
   - Email: `uzylloqimwnkvwjfufeq@inbound.mailersend.net`
   - Password: `Tester45%`

3. **Verify Success**
   - Check redirect to `/bewirtungsbeleg`
   - Verify page content loaded

## Test Data Attributes

All forms have been enhanced with `data-testid` attributes for stable selectors:

### Registration Form
- `data-testid="register-firstName"`
- `data-testid="register-lastName"`
- `data-testid="register-email"`
- `data-testid="register-acceptTerms"`
- `data-testid="register-submit"`

### Setup Password Form
- `data-testid="setup-password"`
- `data-testid="setup-confirmPassword"`
- `data-testid="setup-submit"`

### Signin Form
- `data-testid="login-mode-toggle"`
- `data-testid="login-email"`
- `data-testid="login-password"`
- `data-testid="login-submit"`

## Debugging

### View Test Screenshots

Test screenshots are saved to `test-results/`:
- `registration-complete-<timestamp>.png` - Successful registration
- `login-success-<timestamp>.png` - Successful login
- `*-error-<timestamp>.png` - Error screenshots with timestamp

### Check Webhook Status

```bash
# Check if email was received
curl http://localhost:3000/api/webhook/register?email=uzylloqimwnkvwjfufeq@inbound.mailersend.net

# Clear webhook storage
curl -X DELETE http://localhost:3000/api/webhook/register
```

### Common Issues

1. **Webhook not receiving emails**
   - Verify MailerSend webhook is configured correctly
   - Check webhook URL is accessible from internet (use ngrok for local testing)
   - Verify webhook event type is `activity.sent`

2. **Email timeout**
   - Default timeout: 30 seconds
   - Check MailerSend dashboard for delivery status
   - Verify email provider isn't blocking inbound.mailersend.net

3. **Token expired**
   - Tokens expire after 15 minutes
   - Test should complete within timeout
   - Check Redis/file storage is working

4. **Tests running in parallel**
   - Always use `--workers=1` for auth tests
   - Or use the npm script: `yarn test:e2e:auth`

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Playwright)│
└──────┬──────┘
       │
       │ 1. Fill form & submit
       ▼
┌─────────────────┐
│  Registration   │
│      Page       │
└──────┬──────────┘
       │
       │ 2. Call API
       ▼
┌──────────────────┐        3. Send email        ┌─────────────┐
│ /api/auth/       │ ─────────────────────────▶ │ MailerSend  │
│ register         │                             └──────┬──────┘
└──────────────────┘                                    │
                                                        │ 4. Webhook
       ┌────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────┐
│ /api/webhook/    │
│ register         │ ◀──── 5. Poll for email ──── Playwright
└──────────────────┘
       │
       │ 6. Return email with verification link
       ▼
   Playwright navigates to link and completes flow
```

## Future Improvements

- [ ] Add test for duplicate email registration
- [ ] Test magic link login flow
- [ ] Add test for password reset
- [ ] Implement proper logout button detection
- [ ] Add visual regression testing
- [ ] Test mobile responsive layouts

## References

- [Playwright Documentation](https://playwright.dev/)
- [MailerSend Webhooks](https://developers.mailersend.com/webhooks.html)
- [NextAuth.js](https://next-auth.js.org/)
