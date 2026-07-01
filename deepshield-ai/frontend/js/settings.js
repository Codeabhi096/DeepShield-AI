// ── settings.js ──────────────────────────────────────────

requireAuth();

const userAvatar     = document.getElementById('userAvatar');
const avatarDropdown = document.getElementById('avatarDropdown');

userAvatar?.addEventListener('click', (e) => { e.stopPropagation(); avatarDropdown?.classList.toggle('open'); });
document.addEventListener('click', () => avatarDropdown?.classList.remove('open'));

(function setAvatar() {
  const user = JSON.parse(localStorage.getItem('ds_user') || '{}');
  if (userAvatar && user.firstName) userAvatar.textContent = (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase();
})();

// Tab switching
document.querySelectorAll('.settings-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
  });
});

// Toggle switches
document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('on');
    const prefs = JSON.parse(localStorage.getItem('ds_prefs') || '{}');
    prefs[toggle.dataset.key] = toggle.classList.contains('on');
    localStorage.setItem('ds_prefs', JSON.stringify(prefs));
  });
});

(function loadToggles() {
  const prefs = JSON.parse(localStorage.getItem('ds_prefs') || '{}');
  Object.entries(prefs).forEach(([key, value]) => {
    const toggle = document.querySelector(`[data-key="${key}"]`);
    if (toggle) toggle.classList.toggle('on', value);
  });
})();

// Save general
document.getElementById('saveGeneralBtn')?.addEventListener('click', async () => {
  const statusEl = document.getElementById('generalSaveStatus');
  statusEl.textContent = 'Saving...';
  try {
    await apiRequest('/auth/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        default_detection:    document.getElementById('defaultDetection')?.value,
        results_per_page:     +document.getElementById('resultsPerPage')?.value,
        confidence_threshold: +document.getElementById('confidenceThreshold')?.value,
        retention_period:     +document.getElementById('retentionPeriod')?.value,
      }),
    });
    statusEl.textContent = 'Saved ✓';
    statusEl.style.color = '#10B981';
  } catch {
    statusEl.textContent = 'Could not save';
    statusEl.style.color = '#EF4444';
  }
  setTimeout(() => (statusEl.textContent = ''), 3000);
});

// Export data
document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
  try {
    const data = await apiRequest('/results/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `deepshield-export-${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  } catch (err) { alert('Export failed: ' + err.message); }
});

// Change password
document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwSuccess = document.getElementById('pwSuccess');
  const pwError   = document.getElementById('pwError');
  pwSuccess.style.display = 'none';
  pwError.style.display   = 'none';

  const newPw = document.getElementById('newPassword').value;
  const cfPw  = document.getElementById('confirmNewPassword').value;
  const errEl = document.getElementById('confirmPwError');

  if (newPw !== cfPw) { errEl.textContent = 'Passwords do not match.'; errEl.classList.add('visible'); return; }
  if (newPw.length < 8) { errEl.textContent = 'Min. 8 characters.'; errEl.classList.add('visible'); return; }
  errEl.classList.remove('visible');

  const btn = document.getElementById('updatePwBtn');
  const sp  = document.getElementById('pwSpinner');
  btn.disabled = true; sp.style.display = 'inline-flex';

  try {
    await apiRequest('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ current_password: document.getElementById('currentPassword').value, new_password: newPw }),
    });
    pwSuccess.style.display = 'block';
    document.getElementById('passwordForm').reset();
    document.getElementById('strengthBar').style.display = 'none';
  } catch (err) {
    document.getElementById('pwErrorMsg').textContent = err.message;
    pwError.style.display = 'block';
  } finally { btn.disabled = false; sp.style.display = 'none'; }
});

document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.input-wrapper')?.querySelector('input');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });
});

document.getElementById('newPassword')?.addEventListener('input', function () {
  const bar = document.getElementById('strengthBar');
  bar.style.display = this.value.length ? 'block' : 'none';
  const segs = bar.querySelectorAll('.strength-segment');
  let score = 0;
  if (this.value.length >= 8) score++;
  if (/[A-Z]/.test(this.value)) score++;
  if (/[0-9]/.test(this.value)) score++;
  if (/[^A-Za-z0-9]/.test(this.value)) score++;
  const levels = ['','weak','fair','good','strong'];
  const labels = ['','Weak','Fair','Good','Strong'];
  segs.forEach((s, i) => { s.className = 'strength-segment' + (i < score ? ` ${levels[score]}` : ''); });
  const lbl = document.getElementById('strengthLabel');
  if (lbl) lbl.textContent = this.value.length ? labels[score] : '';
});

document.getElementById('signOutAllBtn')?.addEventListener('click', async () => {
  if (!confirm('Sign out all other sessions?')) return;
  try { await apiRequest('/auth/sessions', { method: 'DELETE' }); alert('Done.'); }
  catch (err) { alert('Failed: ' + err.message); }
});

document.getElementById('setup2faBtn')?.addEventListener('click', () => alert('2FA setup coming soon.'));
document.getElementById('setupSmsBtn')?.addEventListener('click', () => alert('SMS verification coming soon.'));

// API key
let apiKeyVisible = false, realApiKey = null;

document.getElementById('showApiKey')?.addEventListener('click', async function () {
  const input = document.getElementById('apiKey');
  if (!apiKeyVisible) {
    if (!realApiKey) { try { const d = await apiRequest('/auth/api-key'); realApiKey = d.api_key; } catch { realApiKey = 'Error'; } }
    input.value = realApiKey; this.textContent = 'Hide';
  } else { input.value = 'sk-••••••••••••••••••••••••••••••••'; this.textContent = 'Show'; }
  apiKeyVisible = !apiKeyVisible;
});

document.getElementById('copyApiKey')?.addEventListener('click', async function () {
  if (!realApiKey) { try { const d = await apiRequest('/auth/api-key'); realApiKey = d.api_key; } catch { return; } }
  await navigator.clipboard.writeText(realApiKey);
  const orig = this.textContent; this.textContent = 'Copied!';
  setTimeout(() => (this.textContent = orig), 1500);
});

document.getElementById('regenApiKey')?.addEventListener('click', async () => {
  if (!confirm('This will invalidate your old key. Continue?')) return;
  try {
    const d = await apiRequest('/auth/api-key/regenerate', { method: 'POST' });
    realApiKey = d.api_key;
    document.getElementById('apiKey').value = realApiKey;
    apiKeyVisible = true;
    document.getElementById('showApiKey').textContent = 'Hide';
  } catch (err) { alert('Failed: ' + err.message); }
});

async function loadApiStats() {
  try {
    const s = await apiRequest('/results/api-stats');
    document.getElementById('apiRequests').textContent    = s.requests ?? '—';
    document.getElementById('apiSuccessRate').textContent = s.success_rate ? `${s.success_rate}%` : '—';
    document.getElementById('apiAvgLatency').textContent  = s.avg_latency_ms ? `${s.avg_latency_ms}ms` : '—';
  } catch {}
}

document.getElementById('webhookForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const successEl = document.getElementById('webhookSuccess');
  const errorEl   = document.getElementById('webhookError');
  successEl.style.display = 'none'; errorEl.style.display = 'none';
  const events = [...document.querySelectorAll('.webhook-checkboxes input:checked')].map(cb => cb.closest('.check-label').textContent.trim());
  try {
    await apiRequest('/auth/webhook', { method: 'POST', body: JSON.stringify({ url: document.getElementById('webhookUrl').value, secret: document.getElementById('webhookSecret').value, events }) });
    successEl.style.display = 'block';
  } catch (err) { document.getElementById('webhookErrorMsg').textContent = err.message; errorEl.style.display = 'block'; }
});

document.getElementById('testWebhookBtn')?.addEventListener('click', async () => {
  const url = document.getElementById('webhookUrl').value;
  if (!url) { alert('Enter a webhook URL first.'); return; }
  try { await apiRequest('/auth/webhook/test', { method: 'POST', body: JSON.stringify({ url }) }); alert('Test payload sent!'); }
  catch (err) { alert('Test failed: ' + err.message); }
});

loadApiStats();