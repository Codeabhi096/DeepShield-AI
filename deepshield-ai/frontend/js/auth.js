// ── auth.js ──────────────────────────────────────────────

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// ── Helpers ───────────────────────────────────────────────

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('visible'); }
  const input = document.getElementById(id.replace('Error', ''));
  if (input) input.classList.add('error');
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
  document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
  ['loginError','registerError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  const span = el.querySelector('span');
  if (span) span.textContent = msg;
  else el.textContent = msg;
  el.style.display = 'block';
}

function setLoading(btnId, spinnerId, loading) {
  const btn = document.getElementById(btnId);
  const sp  = document.getElementById(spinnerId);
  if (btn) btn.disabled = loading;
  if (sp)  sp.style.display = loading ? 'inline-flex' : 'none';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── LOGIN ─────────────────────────────────────────────────

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    let valid = true;

    if (!email || !validateEmail(email)) { showFieldError('emailError', 'Enter a valid email.'); valid = false; }
    if (!password) { showFieldError('passwordError', 'Password is required.'); valid = false; }
    if (!valid) return;

    setLoading('loginBtn', 'loginSpinner', true);

    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { showAlert('loginError', data.detail || 'Invalid email or password.'); return; }

      setToken(data.access_token);
      localStorage.setItem('ds_user', JSON.stringify({
        firstName: data.user.first_name,
        lastName:  data.user.last_name,
        email:     data.user.email,
      }));
      window.location.href = 'dashboard.html';

    } catch { showAlert('loginError', 'Could not connect to server.'); }
    finally  { setLoading('loginBtn', 'loginSpinner', false); }
  });
}

// ── REGISTER ──────────────────────────────────────────────

const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const email     = document.getElementById('email').value.trim();
    const password  = document.getElementById('password').value;
    const confirm   = document.getElementById('confirmPassword').value;
    const terms     = document.getElementById('terms');
    let valid = true;

    if (!firstName) { showFieldError('firstNameError', 'First name is required.'); valid = false; }
    if (!lastName)  { showFieldError('lastNameError',  'Last name is required.');  valid = false; }
    if (!email || !validateEmail(email)) { showFieldError('emailError', 'Enter a valid email.'); valid = false; }
    if (password.length < 8) { showFieldError('passwordError', 'Min. 8 characters.'); valid = false; }
    if (password !== confirm) { showFieldError('confirmPasswordError', 'Passwords do not match.'); valid = false; }
    if (terms && !terms.checked) { showAlert('registerError', 'Please accept the terms.'); valid = false; }
    if (!valid) return;

    setLoading('registerBtn', 'registerSpinner', true);

    try {
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { showAlert('registerError', data.detail || 'Registration failed.'); return; }

      setToken(data.access_token);
      localStorage.setItem('ds_user', JSON.stringify({
        firstName: data.user.first_name,
        lastName:  data.user.last_name,
        email:     data.user.email,
      }));
      window.location.href = 'dashboard.html';

    } catch { showAlert('registerError', 'Could not connect to server.'); }
    finally  { setLoading('registerBtn', 'registerSpinner', false); }
  });
}

// ── Password toggle ───────────────────────────────────────

document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.input-wrapper')?.querySelector('input');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// ── Password strength ─────────────────────────────────────

const pwInput = document.getElementById('password');
if (pwInput && document.getElementById('strengthBar')) {
  pwInput.addEventListener('input', function () {
    const bar  = document.getElementById('strengthBar');
    bar.style.display = this.value.length ? 'block' : 'none';
    const segs = bar.querySelectorAll('.strength-segment');
    let score = 0;
    if (this.value.length >= 8)           score++;
    if (/[A-Z]/.test(this.value))         score++;
    if (/[0-9]/.test(this.value))         score++;
    if (/[^A-Za-z0-9]/.test(this.value)) score++;
    const levels = ['','weak','fair','good','strong'];
    const labels = ['','Weak','Fair','Good','Strong'];
    segs.forEach((s, i) => { s.className = 'strength-segment' + (i < score ? ` ${levels[score]}` : ''); });
    const lbl = document.getElementById('strengthLabel');
    if (lbl) lbl.textContent = this.value.length ? labels[score] : '';
  });
}

// ── Forgot password ───────────────────────────────────────

document.getElementById('forgotLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  const email = document.getElementById('email')?.value.trim();
  if (!email || !validateEmail(email)) { showFieldError('emailError', 'Enter your email first.'); return; }
  showAlert('loginError', `Reset link sent to ${email}`, 'success');
});

// ── Google OAuth placeholder ──────────────────────────────

document.getElementById('googleLogin')?.addEventListener('click', () => {
  alert('Google OAuth coming soon!');
});

// ── Logout ────────────────────────────────────────────────



function logout() { 
  clearToken(); 
  window.location.href = '/deepshield-ai/frontend/login.html'; 
}

document.querySelectorAll('[data-logout]').forEach(el => {
  el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
});