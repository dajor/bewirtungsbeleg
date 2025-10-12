#!/usr/bin/env node

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

/**
 * Get Basic Auth header for admin
 */
function getBasicAuthHeader() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('DOCBITS_ADMIN_EMAIL and DOCBITS_ADMIN_PASSWORD environment variables required');
  }

  console.log('🔐 Using admin credentials...');
  const credentials = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString('base64');
  console.log('✓ Basic Auth header created');
  return `Basic ${credentials}`;
}

/**
 * Find user by email
 */
async function findUserByEmail(email, basicAuth) {
  console.log(`🔍 Looking for user: ${email}`);

  const response = await fetch(
    `${DOCBITS_AUTH_URL}/management/api/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        'Authorization': basicAuth,
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
async function deleteUser(userId, basicAuth) {
  console.log(`🗑️  Deleting user ID: ${userId}`);

  const response = await fetch(
    `${DOCBITS_AUTH_URL}/management/user/${userId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': basicAuth,
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
async function cleanupTestUser(email = TEST_USER_EMAIL) {
  try {
    console.log('=== Test User Cleanup ===');
    console.log(`Target: ${email}`);
    console.log(`DocBits Auth: ${DOCBITS_AUTH_URL}`);
    console.log('');

    // Get admin Basic Auth header
    const basicAuth = getBasicAuthHeader();

    // Find user
    const user = await findUserByEmail(email, basicAuth);

    if (!user) {
      console.log('✅ Cleanup complete - user does not exist');
      return true;
    }

    // Delete user
    await deleteUser(user.id, basicAuth);

    console.log('✅ Cleanup complete - user deleted');
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return false;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupTestUser()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { cleanupTestUser };
