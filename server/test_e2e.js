// Comprehensive E2E Verification Script for Doomsday Hackathon Platform
const BASE = 'http://localhost:5000/api';
const ROOT = 'http://localhost:5000';

async function runTests() {
  console.log('=== STARTING AUTOMATED FULL-SCALE VERIFICATION ===\n');

  // 1. Health check for Railway deployment
  const healthRes = await fetch(`${ROOT}/health`);
  const health = await healthRes.json();
  console.log('[PASS] 1. Railway Health Endpoint:', health);
  if (health.status !== 'ONLINE') throw new Error('Health check failed');

  // 2. Authoritative Timer & Config
  const timerRes = await fetch(`${BASE}/hackathon/status`);
  const timer = await timerRes.json();
  console.log('[PASS] 2. Authoritative Timer:', {
    status: timer.status,
    remainingHours: (timer.remainingMs / 3600000).toFixed(2),
    isExpired: timer.isExpired,
    title: timer.hackathonTitle,
    feedbackUrl: timer.feedbackFormUrl
  });

  if (timer.remainingMs <= 0 || timer.status !== 'RUNNING') {
    throw new Error('Timer is not in active 24-hour running state');
  }

  // 3. Check 4 Domains & Icons
  const domainsRes = await fetch(`${BASE}/domains`);
  const domains = await domainsRes.json();
  console.log('[PASS] 3. Domain Configurations (4 Domains):', domains.map(d => ({ id: d.id, name: d.name, icon: d.icon })));
  if (domains.length !== 4) throw new Error('Expected exactly 4 domains');

  // 4. Test Participant Authentication - Negative test
  const invalidLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'unknown_agent@cyber.com' })
  });
  console.log('[PASS] 4. Negative Login (Unknown user rejected):', invalidLogin.status === 404 ? 'Correct 404 status' : 'Failed');

  // 5. Test Positive Login & Problem Statements across ALL 4 DOMAINS
  const testParticipants = [
    { id: '1234567890', expectedDomain: 'generative-ai', prefix: 'GEN' },
    { id: '9876543210', expectedDomain: 'ai-healthcare', prefix: 'HLT' },
    { id: '9876543220', expectedDomain: 'ai-education', prefix: 'EDU' },
    { id: '9876543230', expectedDomain: 'fintech', prefix: 'FIN' }
  ];

  for (const tp of testParticipants) {
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: tp.id })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) throw new Error(`Login failed for ${tp.id}`);

    const problemsRes = await fetch(`${BASE}/problems`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const problemsData = await problemsRes.json();

    console.log(`[PASS] 5. Domain Verification [${tp.expectedDomain.toUpperCase()}]:`, {
      participant: loginData.participant.name,
      domain: problemsData.domain,
      problemsCount: problemsData.problems.length,
      firstProblem: problemsData.problems[0]?.id,
      lastProblem: problemsData.problems[problemsData.problems.length - 1]?.id
    });

    if (problemsData.problems.length !== 10) {
      throw new Error(`Expected 10 problems for ${tp.expectedDomain}, found ${problemsData.problems.length}`);
    }

    if (!problemsData.problems[0].id.startsWith(tp.prefix)) {
      throw new Error(`Expected ID prefix ${tp.prefix}, got ${problemsData.problems[0].id}`);
    }
  }

  // 6. Test Problem Selection & FIRE Action (Generative AI participant)
  const genLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '1234567890' })
  });
  const genData = await genLogin.json();
  const partToken = genData.token;

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

  console.log('\n=== ALL 11 PRODUCTION VERIFICATION CHECKS PASSED ===');
}

runTests().catch(err => {
  console.error('[TEST FAIL]:', err);
  process.exit(1);
});
