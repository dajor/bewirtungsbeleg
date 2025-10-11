# DocBits API Endpoints Analysis

**Date**: 2025-01-10
**Purpose**: Document correct DocBits API endpoints for user and password management

---

## Password Management Endpoints

### 1. `/me/change-password` - Self-Service Password Change ✅ RECOMMENDED FOR LOGGED-IN USERS

**Endpoint**: `POST /me/change-password`
**Authentication**: Bearer Token (user's own token)
**Location**: `/namespaces/me.py` (lines 131-214)

**Use Case**: Authenticated users changing their own password

**Request (form-data)**:
```typescript
{
  current_password: string;      // Required - for verification
  new_password: string;          // Required - 6-20 chars, 1 digit, 1 upper, 1 lower
  new_password_confirm: string;  // Required - must match new_password
}
```

**Password Requirements**:
- 6-20 characters long
- At least 1 digit
- At least 1 uppercase letter
- At least 1 lowercase letter
- Must differ from current password

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Key Features**:
- ✅ Validates current password (prevents unauthorized changes)
- ✅ Strong password validation
- ✅ User changes their own password (no admin needed)
- ✅ Secure - requires valid user token
- ❌ Cannot be used for password reset (requires current password)

---

### 2. `/management/user/{user_id}` - Admin Password Update ✅ RECOMMENDED FOR PASSWORD RESET

**Endpoint**: `POST /management/user/{user_id}`
**Authentication**: Basic Auth (admin credentials)
**Location**: `/management_app/namespaces/management_user.py` (lines 107-132)

**Use Case**: Admins or system updating user passwords (password reset flow)

**Request (JSON)**:
```typescript
{
  password: string;       // New password
  first_name: string;     // Must include existing data
  last_name: string;      // Must include existing data
  email: string;          // Must include existing data
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "first_name": "...",
    "last_name": "...",
    "email": "...",
    // ... other user fields
  }
}
```

**Key Features**:
- ✅ Admin can update any user's password
- ✅ Perfect for password reset flows (no current password needed)
- ✅ Updates password directly
- ⚠️ Requires admin credentials (Basic Auth)
- ⚠️ Must include all user data (first_name, last_name, email) to prevent data loss

---

### 3. User Lookup Endpoint

**Endpoint**: `GET /management/api/users?email={email}`
**Authentication**: Basic Auth (admin credentials)
**Location**: Test file reference in `/test_password_change_direct.py` (lines 82-85)

**Use Case**: Find user ID by email for password updates

**Response**:
```json
{
  "users": [
    {
      "id": "user_id",
      "email": "user@example.com",
      "first_name": "...",
      "last_name": "...",
      // ... other fields
    }
  ]
}
```

or

```json
{
  "data": [
    { /* same structure */ }
  ]
}
```

---

## Implementation Recommendations

### For Password Reset Flow (Email Token → New Password)

**Use**: `POST /management/user/{user_id}` with admin credentials

**Reason**:
- User doesn't have current password (forgot it)
- Token validates identity instead
- Admin credentials allow password override

**Current Implementation**: ✅ CORRECT
- Function: `docbitsUpdatePassword()` in `src/lib/docbits-auth.ts`
- Uses: Admin Basic Auth + Management API

### For Logged-In User Changing Password (Profile Settings)

**Use**: `POST /me/change-password` with user's token

**Reason**:
- User is authenticated
- Extra security with current password verification
- No admin credentials needed
- Better user experience

**Current Implementation**: ❌ NOT IMPLEMENTED YET
- Would need new function: `docbitsChangeOwnPassword()`
- Would use user's Bearer token instead of admin credentials

---

## Current Implementation Status

### ✅ Implemented

1. **Password Reset via Admin API**
   - File: `src/lib/docbits-auth.ts`
   - Function: `docbitsUpdatePassword(email, newPassword)`
   - Endpoint: `POST /management/user/{user_id}`
   - Auth: Admin Basic Auth
   - Status: ✅ Correct implementation

### ❌ Not Implemented

1. **Self-Service Password Change** (for logged-in users)
   - Would need: `docbitsChangeOwnPassword(currentPassword, newPassword)`
   - Endpoint: `POST /me/change-password`
   - Auth: User's Bearer Token
   - Use case: User changing password in profile settings
   - Priority: LOW (not required for password reset flow)

---

## Security Comparison

| Feature | `/me/change-password` | `/management/user/{id}` |
|---------|----------------------|------------------------|
| **Auth Type** | Bearer Token (user) | Basic Auth (admin) |
| **Current Password** | ✅ Required | ❌ Not required |
| **Admin Access** | ❌ No | ✅ Yes |
| **Use Case** | Profile settings | Password reset |
| **Security Level** | High (user-initiated) | High (admin-only) |
| **Token Needed** | User's OAuth token | Admin credentials |

---

## Code Examples

### Password Reset (Current Implementation) ✅

```typescript
// src/lib/docbits-auth.ts (lines 392-490)
export async function docbitsUpdatePassword(
  email: string,
  newPassword: string
): Promise<void> {
  // 1. Use admin credentials (Basic Auth)
  const adminUser = process.env.ADMIN_AUTH_USER;
  const adminPassword = process.env.ADMIN_AUTH_PASSWORD;
  const basicAuth = Buffer.from(`${adminUser}:${adminPassword}`).toString('base64');

  // 2. Find user by email
  const getUserResponse = await fetch(
    `${AUTH_SERVER}/management/api/users?email=${email}`,
    {
      headers: { 'Authorization': `Basic ${basicAuth}` }
    }
  );

  // 3. Update password via Management API
  const updateResponse = await fetch(
    `${AUTH_SERVER}/management/user/${user.id}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Basic ${basicAuth}` },
      body: JSON.stringify({
        password: newPassword,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      })
    }
  );
}
```

### Self-Service Password Change (Future Implementation) ⚠️

```typescript
// Future: src/lib/docbits-auth.ts
export async function docbitsChangeOwnPassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Use /me/change-password endpoint with user's token
  const response = await fetch(`${AUTH_SERVER}/me/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirm: newPassword,
    }),
  });
}
```

---

## Conclusion

### Current Implementation: ✅ CORRECT

The current password reset implementation using `/management/user/{user_id}` is **correct** for the password reset flow because:

1. ✅ Users don't have their current password (they forgot it)
2. ✅ Email token validates their identity
3. ✅ Admin credentials allow password override
4. ✅ No current password needed

### Alternative `/me/change-password` Endpoint

The `/me/change-password` endpoint exists but is **not suitable** for password reset because:

1. ❌ Requires current password (which user doesn't have)
2. ❌ Only works for authenticated users
3. ✅ Better for profile settings password changes

### Recommendation

**Keep the current implementation** (`POST /management/user/{user_id}`) for password reset flows. The `/me/change-password` endpoint is designed for a different use case (logged-in users changing their password in profile settings).

---

**Analysis By**: Claude Code
**Version**: 1.0
**Last Updated**: 2025-01-10
