# Test Credentials (preview only)

## Admin (web, Emergent Google auth — use session token directly)
- Admin email: billrules@gmail.com (ADMIN_EMAIL hardcoded in backend/server.py)
- Preview session token: `test_admin_session_token`
  - Cookie: `session_token=test_admin_session_token` (secure, httpOnly, path=/), or header `Authorization: Bearer test_admin_session_token`
- Admin panel: `/admin` (tabs: Overview, Users, Licenses, Usage, Gift Key)

## Test data seeded in preview DB
- License keys: TEST-REVOKE-0001, TEST-DELETE-0002 (email tester@example.com)
- Gift key created via /api/admin/licenses/gift for giftee@example.com
- usage_tracking record machine_id=test-machine-abc linked to TEST-REVOKE-0001
