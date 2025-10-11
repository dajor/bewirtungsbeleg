/**
 * Cleanup Test User Script
 *
 * Deletes the test user from DocBits using admin credentials
 * Used to ensure clean state before/after E2E tests
 */

const TEST_USER_EMAIL = 'uzylloqimwnkvwjfufeq@inbound.mailersend.net';
const DOCBITS_AUTH_URL = process.env.DOCBITS_AUTH_URL || 'https://dev.auth.docbits.com';
const ADMIN_EMAIL = process.env.DOCBITS_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DOCBITS_ADMIN_PASSWORD;

interface DocBitsUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Get admin access token
 */
async function getAdminToken(): Promise<string> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('DOCBITS_ADMIN_EMAIL and DOCBITS_ADMIN_PASSWORD environment variables required');
  }

  console.log('🔐 Authenticating as admin...');

  const response = await fetch(`${DOCBITS_AUTH_URL}/management/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Admin login failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('No access token received from admin login');
  }

  console.log('✓ Admin authenticated');
  return data.access_token;
}

/**
 * Find user by email
 */
async function findUserByEmail(email: string, token: string): Promise<DocBitsUser | null> {
  console.log(`🔍 Looking for user: ${email}`);

  const response = await fetch(
    `${DOCBITS_AUTH_URL}/management/api/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      console.log('✓ User not found (already deleted or never existed)');
      return null;
    }
    const error = await response.text();
    throw new Error(`Failed to search for user: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Check if users array exists and has items
  if (Array.isArray(data) && data.length > 0) {
    const user = data[0];
    console.log(`✓ Found user: ${user.email} (ID: ${user.id})`);
    return user;
  }

  // Check if data is a single user object
  if (data.id && data.email) {
    console.log(`✓ Found user: ${data.email} (ID: ${data.id})`);
    return data;
  }

  console.log('✓ User not found');
  return null;
}

/**
 * Delete user by ID
 */
async function deleteUser(userId: string, token: string): Promise<void> {
  console.log(`🗑️  Deleting user ID: ${userId}`);

  const response = await fetch(
    `${DOCBITS_AUTH_URL}/management/api/users/${userId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete user: ${response.status} - ${error}`);
  }

  console.log('✓ User deleted successfully');
}

/**
 * Main cleanup function
 */
export async function cleanupTestUser(email: string = TEST_USER_EMAIL): Promise<boolean> {
  try {
    console.log('=== Test User Cleanup ===');
    console.log(`Target: ${email}`);
    console.log(`DocBits Auth: ${DOCBITS_AUTH_URL}`);
    console.log('');

    // Get admin token
    const token = await getAdminToken();

    // Find user
    const user = await findUserByEmail(email, token);

    if (!user) {
      console.log('✅ Cleanup complete - user does not exist');
      return true;
    }

    // Delete user
    await deleteUser(user.id, token);

    console.log('✅ Cleanup complete - user deleted');
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

// CLI usage
if (require.main === module) {
  cleanupTestUser()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
