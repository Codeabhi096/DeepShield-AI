// ── auth.js ──────────────────────────────────────────────
// Handles login, register, logout, token management

const API_BASE = 'http://localhost:8000/api/v1';

// ── Helpers ───────────────────────────────────────────────

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  document.getElementById(elementId.replace('Error', ''))?.classList.add('error');
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');
  if (loginError) loginError.style.display = 'none';
  if (registerError) registerError.style.display = 'none';
}

function setLoading(btnId, spinnerId, loading) {
  const btn     = document.getElementById(btnId);
  const spinner = document.getElementById(spinnerId);
  const text    = btn?.querySelector('.btn-text');
  if (!btn) return;
  btn.disabled = loading;
  if (spinner) spinner.style.display = loading ? 'inline-flex' : 'none';
  if (text)    text.style.opacity    = loading ? '0.5' : '1';
}

function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.querySelector('span') ? (el.querySelector('span').textContent = message) : (el.textContent = message);
  el.style.display = 'block';
}

// ── Validation ────────────────────────────────────────────

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

// ── Login ─────────────────────────────────────────────────

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    let valid = true;

    if (!email) {
      showError('emailError', 'Email is required.');
      valid = false;
    } else if (!validateEmail(email)) {
      showError('emailError', 'Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showError('passwordError', 'Password is required.');
      valid = false;
    }

    if (!valid) return;

    setLoading('loginBtn', 'loginSpinner', true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert('loginError', data.detail || 'Invalid email or password.');
        return;
      }

      // Save token and user
      setToken(data.access_token);
      localStorage.setItem('ds_user', JSON.stringify(data.user));

      // Redirect to dashboard
      window.location.href = 'dashboard.html';

    } catch (err) {
      showAlert('loginError', 'Could not connect to server. Try again.');
    } finally {
      setLoading('loginBtn', 'loginSpinner', false);
    }
  });
}

// ── Register ──────────────────────────────────────────────

const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name     = document.getElementById('name')?.value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirmPassword')?.value;
    let valid = true;

    if (!name) {
      showError('nameError', 'Full name is required.');
      valid = false;
    }

    if (!email) {
      showError('emailError', 'Email is required.');
      valid = false;
    } else if (!validateEmail(email)) {
      showError('emailError', 'Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showError('passwordError', 'Password is required.');
      valid = false;
    } else if (!validatePassword(password)) {
      showError('passwordError', 'Password must be at least 8 characters.');
      valid = false;
    }

    if (confirm !== undefined && password !== confirm) {
      showError('confirmPasswordError', 'Passwords do not match.');
      valid = false;
    }

    const terms = document.getElementById('terms');
    if (terms && !terms.checked) {
      showAlert('registerError', 'You must accept the terms and conditions.');
      valid = false;
    }

    if (!valid) return;

    setLoading('registerBtn', 'registerSpinner', true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showAlert('registerError', data.detail || 'Registration failed. Try again.');
        return;
      }

      setToken(data.access_token);
      localStorage.setItem('ds_user', JSON.stringify(data.user));
      window.location.href = 'dashboard.html';

    } catch (err) {
      showAlert('registerError', 'Could not connect to server. Try again.');
    } finally {
      setLoading('registerBtn', 'registerSpinner', false);
    }
  });
}

// ── Password toggle ───────────────────────────────────────

document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.input-wrapper')?.querySelector('input');
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });
});

// ── Password strength (register page) ────────────────────

const passwordInput = document.getElementById('password');
const strengthBar   = document.getElementById('strengthBar');

if (passwordInput && strengthBar) {
  passwordInput.addEventListener('input', () => {
    const val      = passwordInput.value;
    const segments = strengthBar.querySelectorAll('.strength-segment');
    const label    = document.getElementById('strengthLabel');
    let score = 0;

    if (val.length >= 8)                        score++;
    if (/[A-Z]/.test(val))                      score++;
    if (/[0-9]/.test(val))                      score++;
    if (/[^A-Za-z0-9]/.test(val))               score++;

    const levels = ['', 'weak', 'fair', 'good', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    segments.forEach((seg, i) => {
      seg.className = 'strength-segment' + (i < score ? ` ${levels[score]}` : '');
    });

    if (label) label.textContent = val.length ? labels[score] : '';
  });
}

// ── Forgot password ───────────────────────────────────────

const forgotLink = document.getElementById('forgotLink');

if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value.trim();
    if (!email || !validateEmail(email)) {
      showError('emailError', 'Enter your email above first.');
      return;
    }
    // TODO: call forgot password API
    showAlert('loginError', `Reset link sent to ${email}`, 'success');
    const el = document.getElementById('loginError');
    if (el) el.className = 'alert alert-success';
  });
}

// ── Google OAuth (placeholder) ────────────────────────────

document.getElementById('googleLogin')?.addEventListener('click', () => {
  window.location.href = `${API_BASE}/auth/google`;
});

// ── Logout ────────────────────────────────────────────────

function logout() {
  clearToken();
  window.location.href = 'login.html';
}

// Attach logout to any element with data-logout
document.querySelectorAll('[data-logout]').forEach(el => {
  el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
});