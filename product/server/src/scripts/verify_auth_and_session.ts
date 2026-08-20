import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function runAuthVerification() {
  console.log('================================================================');
  console.log('CAMPUSOS — P0 AUTHENTICATION & SESSION PERSISTENCE VERIFIER');
  console.log('================================================================\n');

  const authService = new AuthService();
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, label: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${label}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${label}`);
      throw new Error(`Assertion failed: ${label}`);
    }
  }

  // -------------------------------------------------------------
  // Test Suite 1: Multi-Role Credential Verification
  // -------------------------------------------------------------
  console.log('--- 1. Testing Institutional Roles Login ---');
  const roleTestCases = [
    { email: 'admin@geetorus.com', pass: 'Admin@123', expectedRole: 'Super Admin' },
    { email: 'cse.head@geetorus.com', pass: 'Campus@123', expectedRole: 'HOD' },
    { email: 'ada.lovelace@geetorus.com', pass: 'Campus@123', expectedRole: 'Faculty' },
    { email: 'accountant@geetorus.com', pass: 'Campus@123', expectedRole: 'Accountant' },
    { email: 'ao@geetorus.com', pass: 'Campus@123', expectedRole: 'Accounts Officer' },
    { email: 'transport.manager@geetorus.com', pass: 'Campus@123', expectedRole: 'Transport Manager' },
    { email: 'hostel.warden@geetorus.com', pass: 'Campus@123', expectedRole: 'Hostel Warden' },
    { email: 'librarian@geetorus.com', pass: 'Campus@123', expectedRole: 'Librarian' },
  ];

  for (const tc of roleTestCases) {
    try {
      const res = await authService.login({ email: tc.email, password: tc.pass });
      assert(
        Boolean(res.accessToken) && Boolean(res.refreshToken) && res.user.email.toLowerCase() === tc.email.toLowerCase(),
        `Login succeeded for ${tc.email} (Role: ${res.user.role})`
      );

    } catch (err: any) {
      console.error(`Failed logging in as ${tc.email}:`, err.message);
      assert(false, `Login failed for ${tc.email}: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // Test Suite 2: Identifier Normalization & Case Insensitivity
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Identifier Normalization ---');
  // Whitespace trimmed
  const resTrimmed = await authService.login({
    email: '   ada.lovelace@geetorus.com   ',
    password: 'Campus@123',
  });
  assert(resTrimmed.user.email === 'ada.lovelace@geetorus.com', 'Whitespace in email normalized and authenticated');

  // Uppercase email
  const resUpper = await authService.login({
    email: 'ADA.LOVELACE@GEETORUS.COM',
    password: 'Campus@123',
  });
  assert(resUpper.user.email === 'ada.lovelace@geetorus.com', 'Uppercase email case-insensitively authenticated');

  // -------------------------------------------------------------
  // Test Suite 3: Negative Login Tests
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Negative Login Scenarios ---');
  // Wrong password
  try {
    await authService.login({ email: 'ada.lovelace@geetorus.com', password: 'WrongPassword@999' });
    assert(false, 'Wrong password should have failed');
  } catch (err: any) {
    assert(err.status === 401 && err.message.includes('Invalid email, username, ID, or password'), 'Wrong password returned 401 with safe message');
  }

  // Unknown email
  try {
    await authService.login({ email: 'nonexistent.user.123@geetorus.com', password: 'Campus@123' });
    assert(false, 'Nonexistent account should have failed');
  } catch (err: any) {
    assert(err.status === 401 && err.message.includes('Invalid email, username, ID, or password'), 'Nonexistent account returned 401 with safe message');
  }

  // -------------------------------------------------------------
  // Test Suite 4: Token Refresh & Session Persistence
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Token Refresh & Rotation Lifecycle ---');
  const loginRes = await authService.login({ email: 'cse.head@geetorus.com', password: 'Campus@123', rememberMe: true });
  const initialRefresh = loginRes.refreshToken;
  assert(Boolean(initialRefresh), 'Initial refresh token issued');

  // Refresh token rotation
  const refreshed = await authService.refresh(initialRefresh);
  assert(
    Boolean(refreshed.accessToken) && Boolean(refreshed.refreshToken) && refreshed.refreshToken !== initialRefresh,
    'Session refreshed with rotated refresh token'
  );

  // Replay Attack detection (using old rotated refresh token)
  try {
    await authService.refresh(initialRefresh);
    assert(false, 'Old rotated token should be rejected');
  } catch (err: any) {
    assert(err.status === 401, 'Replay attack prevented: Revoked refresh token rejected with 401');
  }

  // -------------------------------------------------------------
  // Test Suite 5: Fetch Current User (/auth/me)
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Profile Bootstrap (/auth/me) ---');
  const me = await authService.getMe(loginRes.user.id);
  assert(
    me.id === loginRes.user.id && Array.isArray(me.permissions) && Array.isArray(me.menus) && me.menus.length > 0,
    `Profile bootstrap succeeded for ${me.fullName} with ${me.menus.length} authorized menu sections`
  );

  // -------------------------------------------------------------
  // Test Suite 6: Explicit Logout
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Explicit Logout & Revocation ---');
  await authService.logout(refreshed.refreshToken);
  try {
    await authService.refresh(refreshed.refreshToken);
    assert(false, 'Logged out refresh token should fail');
  } catch (err: any) {
    assert(err.status === 401, 'Logged out session successfully revoked');
  }

  console.log('\n================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} tests succeeded.`);
  console.log('================================================================\n');
}

runAuthVerification()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
