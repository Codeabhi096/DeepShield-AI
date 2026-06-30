// ── profile.js ───────────────────────────────────────────

requireAuth();

// ── Avatar dropdown ────────────────────────────────────────

const userAvatar = document.getElementById('userAvatar');
const avatarDropdown = document.getElementById('avatarDropdown');

userAvatar?.addEventListener('click', (e) => {
  e.stopPropagation();
  avatarDropdown?.classList.toggle('open');
});
document.addEventListener('click', () => avatarDropdown?.classList.remove('open'));

// ── Load profile data ──────────────────────────────────────

async function loadProfile() {
  try {
    const user = await apiRequest('/auth/me');

    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value  = user.last_name || '';
    document.getElementById('email').value     = user.email || '';
    document.getElementById('phone').value     = user.phone || '';

    const initials = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase();
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('userAvatar').textContent = initials;

    document.getElementById('profileName').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('profileEmail').textContent = user.email;

    document.getElementById('planBadge').textContent = `${user.plan || 'Free'} Plan`;

    const used  = user.detections_used ?? 0;
    const limit = user.detections_limit ?? 50;
    document.getElementById('usageCount').textContent = `${used} / ${limit}`;
    document.getElementById('usageFill').style.width = `${Math.min((used / limit) * 100, 100)}%`;

    // Save to localStorage for use across pages
    localStorage.setItem('ds_user', JSON.stringify({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    }));

  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

// ── Save profile changes ────────────────────────────────────

const profileForm = document.getElementById('profileForm');

profileForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const saveSuccess = document.getElementById('saveSuccess');
  const saveError = document.getElementById('saveError');
  saveSuccess.style.display = 'none';
  saveError.style.display = 'none';

  const btn = document.getElementById('saveBtn');
  const spinner = document.getElementById('saveSpinner');
  btn.disabled = true;
  spinner.style.display = 'inline-flex';

  try {
    await apiRequest('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
      }),
    });

    saveSuccess.style.display = 'block';
    loadProfile();

  } catch (err) {
    document.getElementById('saveErrorMsg').textContent = err.message || 'Could not update profile.';
    saveError.style.display = 'block';
  } finally {
    btn.disabled = false;
    spinner.style.display = 'none';
  }
});

// ── API key actions ──────────────────────────────────────────

let apiKeyVisible = false;
let realApiKey = null;

document.getElementById('toggleApiKey')?.addEventListener('click', async function () {
  const input = document.getElementById('apiKeyInput');

  if (!apiKeyVisible) {
    if (!realApiKey) {
      try {
        const data = await apiRequest('/auth/api-key');
        realApiKey = data.api_key;
      } catch {
        realApiKey = 'Could not load key';
      }
    }
    input.value = realApiKey;
    this.textContent = 'Hide';
  } else {
    input.value = '••••••••••••••••••••••••';
    this.textContent = 'Show';
  }
  apiKeyVisible = !apiKeyVisible;
});

document.getElementById('copyApiKey')?.addEventListener('click', async function () {
  if (!realApiKey) {
    try {
      const data = await apiRequest('/auth/api-key');
      realApiKey = data.api_key;
    } catch {
      return;
    }
  }
  await navigator.clipboard.writeText(realApiKey);
  const original = this.textContent;
  this.textContent = 'Copied!';
  setTimeout(() => (this.textContent = original), 1500);
});

document.getElementById('regenApiKey')?.addEventListener('click', async function () {
  if (!confirm('Regenerating will invalidate your old API key. Continue?')) return;

  try {
    const data = await apiRequest('/auth/api-key/regenerate', { method: 'POST' });
    realApiKey = data.api_key;
    apiKeyVisible = true;
    document.getElementById('apiKeyInput').value = realApiKey;
    document.getElementById('toggleApiKey').textContent = 'Hide';
  } catch (err) {
    alert('Could not regenerate API key: ' + err.message);
  }
});

// ── Delete account ──────────────────────────────────────────

const deleteModal = document.getElementById('deleteModal');

document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
  deleteModal.classList.add('open');
});

document.getElementById('cancelDelete')?.addEventListener('click', () => {
  deleteModal.classList.remove('open');
});

document.getElementById('confirmDelete')?.addEventListener('click', async () => {
  try {
    await apiRequest('/auth/me', { method: 'DELETE' });
    clearToken();
    window.location.href = 'index.html';
  } catch (err) {
    alert('Could not delete account: ' + err.message);
  }
});

deleteModal?.addEventListener('click', (e) => {
  if (e.target === deleteModal) deleteModal.classList.remove('open');
});

// ── Init ───────────────────────────────────────────────────

loadProfile();