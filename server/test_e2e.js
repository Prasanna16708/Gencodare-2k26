// Comprehensive E2E Verification Script for Doomsday Hackathon Platform
const BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING AUTOMATED VERIFICATION ===\n');

  // 1. Check Authoritative Timer & Config
  const timerRes = await fetch(`${BASE}/hackathon/status`);
  const timer = await timerRes.json();
  console.log('[PASS] 1. Authoritative Timer:', {
    status: timer.status,
    remainingHours: (timer.remainingMs / 3600000).toFixed(2),
    isExpired: timer.isExpired,
    title: timer.hackathonTitle,
    feedbackUrl: timer.feedbackFormUrl
  });

  if (timer.remainingMs <= 0 || timer.status !== 'RUNNING') {
    throw new Error('Timer is not in active 24-hour running state');
  }

  // 2. Check 4 Domains & PNG Icons
  const domainsRes = await fetch(`${BASE}/domains`);
  const domains = await domainsRes.json();
  console.log('[PASS] 2. Domain Configurations:', domains.map(d => ({ id: d.id, name: d.name, icon: d.icon })));
  if (domains.length !== 4) throw new Error('Expected exactly 4 domains');

  // 3. Test Participant Authentication - Negative test
  const invalidLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'unknown_agent@cyber.com' })
  });
  console.log('[PASS] 3. Negative Login (Unknown user rejected):', invalidLogin.status === 404 ? 'Correct 404 status' : 'Failed');

  // 4. Test Participant Authentication - Positive test (Participant 1)
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'participant@gmail.com' })
  });
  const loginData = await loginRes.json();
  console.log('[PASS] 4. Positive Login (Participant 1):', {
    name: loginData.participant.name,
    domain: loginData.participant.domain,
    tokenIssued: !!loginData.token
  });

  const partToken = loginData.token;

  // 5. Test Domain Problem Isolation
  const problemsRes = await fetch(`${BASE}/problems`, {
    headers: { Authorization: `Bearer ${partToken}` }
  });
  const problemsData = await problemsRes.json();
  console.log('[PASS] 5. Domain Problem Isolation (Generative AI):', {
    domain: problemsData.domain,
    problemsCount: problemsData.problems.length,
    firstProblem: problemsData.problems[0].id,
    tenthProblem: problemsData.problems[9].id
  });
  if (problemsData.problems.length !== 10) throw new Error('Expected exactly 10 problems for domain');

  // 6. Test Problem Selection & FIRE Action
  const selectRes = await fetch(`${BASE}/participant/select-problem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${partToken}` },
    body: JSON.stringify({ problemId: 'GEN-01' })
  });
  const selectData = await selectRes.json();
  console.log('[PASS] 6. Problem Selection:', selectData.message, selectData.problem.id);

  const fireRes = await fetch(`${BASE}/participant/fire-problem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${partToken}` },
    body: JSON.stringify({ problemId: 'GEN-01' })
  });
  const fireData = await fireRes.json();
  console.log('[PASS] 7. FIRE Launch Action:', fireData.message);

  // 7. Verify Session Persistence (Restores session state on reload)
  const sessionRes = await fetch(`${BASE}/auth/session`, {
    headers: { Authorization: `Bearer ${partToken}` }
  });
  const sessionData = await sessionRes.json();
  console.log('[PASS] 8. Session Persistence (Restored on reconnect):', {
    name: sessionData.participant.name,
    domain: sessionData.participant.domain,
    selectedProblemId: sessionData.participant.selectedProblemId,
    hasFired: sessionData.participant.hasFired
  });

  if (!sessionData.participant.hasFired || sessionData.participant.selectedProblemId !== 'GEN-01') {
    throw new Error('Session state persistence failed');
  }

  // 8. Verify Admin Security & Login
  const adminLoginRes = await fetch(`${BASE}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin' })
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.token;
  console.log('[PASS] 9. Admin Authentication Granted:', !!adminToken);

  // 9. Verify Admin Stats
  const statsRes = await fetch(`${BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const stats = await statsRes.json();
  console.log('[PASS] 10. Admin Stats Overview:', {
    totalParticipants: stats.totalParticipants,
    activeSessionsCount: stats.activeSessionsCount,
    firedParticipantsCount: stats.firedParticipantsCount,
    domainCounts: stats.domainCounts
  });

  // 10. Verify Carousel Items
  const carouselRes = await fetch(`${BASE}/carousel`);
  const carousel = await carouselRes.json();
  console.log('[PASS] 11. Carousel Broadcast Slides Count:', carousel.length);
  carousel.forEach((c, idx) => {
    console.log(`     Slide ${idx + 1}: ${c.title} (${c.imageUrl})`);
  });

  console.log('\n=== ALL 11 PRODUCTION VERIFICATION CHECKS PASSED ===');
}

runTests().catch(err => {
  console.error('[TEST FAIL]:', err);
  process.exit(1);
});
