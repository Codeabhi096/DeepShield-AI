// ── profile.js ───────────────────────────────────────────

requireAuth();

// Avatar dropdown
const userAvatar     = document.getElementById('userAvatar');
const avatarDropdown = document.getElementById('avatarDropdown');
userAvatar?.addEventListener('click', (e) => { e.stopPropagation(); avatarDropdown?.classList.toggle('open'); });
document.addEventListener('click', () => avatarDropdown?.classList.remove('open'));

// Plan features
const PLAN_FEATURES = {
  free: ['5 detections per month', 'Video + image detection', 'Basic results report', 'API access'],
  pro:  ['2,000 detections per month', 'All 4 detection types', 'Heatmaps + explainability', 'Webhook notifications', 'Priority processing'],
  enterprise: ['Unlimited detections', 'On-premise deployment', 'SLA + dedicated support', 'Custom model fine-tuning'],
};

// Load profile
async function loadProfile() {
  try {
    const user = await apiRequest('/auth/me');

    // Avatar & name
    const initials = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase();
    document.getElementById('profileAvatar').textContent   = initials;
    document.getElementById('userAvatar').textContent      = initials;
    document.getElementById('profileName').textContent     = `${user.first_name} ${user.last_name}`;
    document.getElementById('profileEmail').textContent    = user.email;

    // Plan badge
    const plan = user.plan || 'free';
    document.getElementById('planBadge').textContent  = `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
    document.getElementById('planTitle').textContent  = `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
    document.getElementById('planPrice').textContent  = plan === 'free' ? '$0 / month' : plan === 'pro' ? '$49 / month' : 'Custom';
    document.getElementById('statPlan').textContent   = plan.charAt(0).toUpperCase() + plan.slice(1);

    // Joined date
    if (user.created_at) {
      const joined = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      document.getElementById('joinedBadge').textContent = `Joined ${joined}`;
    }

    // Stats
    const used  = user.detections_used  ?? 0;
    const limit = user.detections_limit ?? 5;
    const left  = Math.max(0, limit - used);

    document.getElementById('statTotal').textContent = used;
    document.getElementById('statLeft').textContent  = left;

    // Usage bar
    document.getElementById('usageCount').textContent        = `${used} / ${limit}`;
    document.getElementById('usageFill').style.width         = `${Math.min((used / limit) * 100, 100)}%`;
    document.getElementById('usageReset').textContent        = `${left} detections remaining this month`;

    // Deepfakes stat (from results if available)
    document.getElementById('statFakes').textContent = user.fakes_found ?? '—';

    // Plan features
    const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
    const list = document.getElementById('planFeaturesList');
    list.innerHTML = features.map(f => `<div class="plan-feature-item">${f}</div>`).join('');

    // Form fields
    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value  = user.last_name  || '';
    document.getElementById('email').value     = user.email      || '';
    document.getElementById('phone').value     = user.phone      || '';

    // Save to localStorage
    localStorage.setItem('ds_user', JSON.stringify({ firstName: user.first_name, lastName: user.last_name, email: user.email }));

  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

// Save profile
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const success = document.getElementById('saveSuccess');
  const error   = document.getElementById('saveError');
  success.style.display = 'none';
  error.style.display   = 'none';

  const btn = document.getElementById('saveBtn');
  const sp  = document.getElementById('saveSpinner');
  btn.disabled = true; sp.style.display = 'inline-flex';

  try {
    await apiRequest('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({
        first_name: document.getElementById('firstName').value.trim(),
        last_name:  document.getElementById('lastName').value.trim(),
        email:      document.getElementById('email').value.trim(),
        phone:      document.getElementById('phone').value.trim(),
      }),
    });
    success.style.display = 'block';
    loadProfile();
  } catch (err) {
    document.getElementById('saveErrorMsg').textContent = err.message;
    error.style.display = 'block';
  } finally {
    btn.disabled = false; sp.style.display = 'none';
  }
});

// Change password
document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const success = document.getElementById('pwSuccess');
  const error   = document.getElementById('pwError');
  success.style.display = 'none';
  error.style.display   = 'none';

  const newPw = document.getElementById('newPassword').value;
  const cfPw  = document.getElementById('confirmPassword').value;
  const errEl = document.getElementById('confirmPwError');

  if (newPw !== cfPw) { errEl.textContent = 'Passwords do not match.'; errEl.classList.add('visible'); return; }
  errEl.classList.remove('visible');

  const btn = document.getElementById('pwBtn');
  const sp  = document.getElementById('pwSpinner');
  btn.disabled = true; sp.style.display = 'inline-flex';

  try {
    await apiRequest('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ current_password: document.getElementById('currentPassword').value, new_password: newPw }),
    });
    success.style.display = 'block';
    document.getElementById('passwordForm').reset();
  } catch (err) {
    document.getElementById('pwErrorMsg').textContent = err.message;
    error.style.display = 'block';
  } finally { btn.disabled = false; sp.style.display = 'none'; }
});

// Delete account
const deleteModal = document.getElementById('deleteModal');
document.getElementById('deleteAccountBtn')?.addEventListener('click', () => deleteModal.classList.add('open'));
document.getElementById('cancelDelete')?.addEventListener('click', () => deleteModal.classList.remove('open'));
deleteModal?.addEventListener('click', (e) => { if (e.target === deleteModal) deleteModal.classList.remove('open'); });

document.getElementById('confirmDelete')?.addEventListener('click', async () => {
  try {
    await apiRequest('/auth/me', { method: 'DELETE' });
    clearToken();
    window.location.href = 'index.html';
  } catch (err) { alert('Could not delete account: ' + err.message); }
});

loadProfile();