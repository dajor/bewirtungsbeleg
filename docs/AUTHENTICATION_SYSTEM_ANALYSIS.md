# Authentication System Analysis

## Critical Issues Identified

### 1. **DISCONNECTED USER SYSTEMS** ❌❌❌
**Root Cause**: Two separate user authentication systems that don't talk to each other

**Problem**:
- Registration creates users in **DocBits** (external OAuth2 system)
- Login checks against **hardcoded in-memory users** in `src/lib/auth.ts`
- **Result**: Users can register but can NEVER login!

**Evidence**:
```typescript
// src/lib/auth.ts - Hardcoded users
const users = [
  {
    id: '1',
    email: 'admin@docbits.com',
    password: '$2b$12$...',  // Hashed password
  },
  {
    id: '2',
    email: 'user@docbits.com',
    password: '$2b$12$...',
  },
];

// Credentials provider checks ONLY these hardcoded users
const user = users.find((user) => user.email === credentials.email);
```

**Current Flow (BROKEN)**:
```
1. User Registers → DocBits creates user → Email sent ✅
2. User clicks email link → Sets password in DocBits ✅
3. User tries to login → NextAuth checks hardcoded array → NOT FOUND → 401 ❌
```

### 2. **NO DOCBITS INTEGRATION FOR LOGIN** ❌
The credentials provider doesn't call DocBits API to validate users. It only checks the hardcoded array.

### 3. **PASSWORD RESET DOESN'T AUTO-LOGIN** ❌
After resetting password, user must manually login again. This is poor UX.

### 4. **POOR ERROR MESSAGES** ❌
- "Ungültige Anmeldedaten" is vague
- Doesn't explain if email doesn't exist, password is wrong, or email not verified

### 5. **NO COMPREHENSIVE TESTS** ❌
Current tests only test isolated parts, not end-to-end flows

---

## Solution Architecture

### Option 1: **Full DocBits Integration** (RECOMMENDED)
Replace in-memory users with DocBits OAuth2 for ALL authentication.

**Changes Required**:
1. Update credentials provider to call `docbitsLogin()`
2. Store DocBits tokens in session
3. Password reset should use DocBits password change API
4. Magic link should authenticate via DocBits

**Pros**:
- Single source of truth
- Proper OAuth2 flow
- All users managed in DocBits

**Cons**:
- Requires DocBits API to be working properly
- Current DocBits 401 errors need to be resolved first

### Option 2: **Hybrid System** (QUICK FIX)
Keep in-memory users for admin/testing, add DocBits for registered users.

**Changes Required**:
1. Check in-memory users first
2. If not found, try DocBits login
3. Keep backward compatibility

**Pros**:
- Quick to implement
- Maintains admin access

**Cons**:
- Two systems to maintain
- More complexity

---

## Recommended Fix Plan

### Phase 1: Fix Login (URGENT) ✅ COMPLETED
1. ✅ Updated credentials provider in `src/lib/auth.ts` to call `docbitsLogin()`
   - Added hybrid authentication: checks hardcoded users first, then DocBits
   - Integrated `docbitsLogin()` function from docbits-auth.ts
   - Added comprehensive logging for debugging
2. ✅ Handle DocBits tokens properly
   - Extended NextAuth types to include `accessToken` and `refreshToken`
   - Store tokens in JWT and session callbacks
3. ✅ Better error messages
   - Specific error for wrong credentials: "E-Mail oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben."
   - Specific error for unverified email: "Bitte verifizieren Sie zuerst Ihre E-Mail-Adresse."
   - Specific error for disabled account: "Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Support."
   - Generic fallback error: "Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut."

**Files Modified:**
- `src/lib/auth.ts` - Added DocBits integration (lines 38-104)
- `src/types/next-auth.d.ts` - Extended types for tokens
- Auth callbacks updated to store and pass tokens

### Phase 2: Fix Password Reset Flow ✅ COMPLETED
1. ✅ Auto-login after password setup
   - Added `signIn` import from next-auth/react
   - Updated handleSubmit to call `signIn('credentials')` after successful password setup
   - On success, automatically redirects to `/bewirtungsbeleg`
   - Fallback to signin page if auto-login fails
2. ✅ Auto-login after password reset
   - Added `signIn` import from next-auth/react
   - Updated handleSubmit to call `signIn('credentials')` after successful password reset
   - On success, automatically redirects to `/bewirtungsbeleg`
   - Fallback to signin page if auto-login fails
3. ✅ Redirect to main app
   - Both flows now redirect to `/bewirtungsbeleg` after successful auto-login

**Files Modified:**
- `src/app/auth/setup-password/page.tsx` - Added auto-login after password setup (lines 27, 156-189)
- `src/app/auth/reset-password/page.tsx` - Added auto-login after password reset (lines 24, 98-131)

### Phase 3: Comprehensive Testing
1. Create test matrix for all flows
2. Document test results
3. Fix any remaining issues

---

## Test Matrix (To Be Implemented)

| Flow | Steps | Expected Result | Current Status |
|------|-------|----------------|----------------|
| **Registration** | 1. Fill form<br>2. Submit<br>3. Check email<br>4. Click link<br>5. Set password | User registered in DocBits, password set | ⚠️ PARTIAL (DocBits 401 error) |
| **Email Verification** | 1. Register<br>2. Get token<br>3. Verify token | Token valid, email verified | ✅ WORKS |
| **Login (Password)** | 1. Enter email/password<br>2. Submit | Logged in, redirected to /bewirtungsbeleg | ❌ BROKEN (checks wrong user store) |
| **Login (Magic Link)** | 1. Request magic link<br>2. Click email link<br>3. Verify | Logged in via magic link | ⚠️ UNKNOWN (needs testing) |
| **Password Reset** | 1. Request reset<br>2. Click email link<br>3. Set new password<br>4. AUTO-LOGIN | Logged in automatically | ❌ BROKEN (no auto-login) |
| **Duplicate Registration** | 1. Register same email twice | Show error | ✅ WORKS |
| **Expired Token** | 1. Use old token | Show error | ✅ WORKS |
| **Invalid Token** | 1. Use fake token | Show error | ✅ WORKS |

---

## Current Blockers

1. **DocBits `/user/create` returns 401 UNAUTHORIZED**
   - Admin credentials not working
   - Prevents registration from completing

2. **No DocBits login integration**
   - Can't validate real users
   - Only hardcoded users work

3. **No test coverage for happy paths**
   - Tests only check edge cases
   - Don't verify actual working flows
