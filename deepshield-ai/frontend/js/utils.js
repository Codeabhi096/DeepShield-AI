// ── utils.js ─────────────────────────────────────────────

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Format file size — e.g. 1048576 → "1.0 MB"
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Format date — e.g. "Jun 28, 2025"
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Truncate long text
function truncate(str, maxLen = 60) {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

// Debounce — limit rapid function calls
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('ds_token') || null;
}

// Save auth token
function setToken(token) {
  localStorage.setItem('ds_token', token);
}

// Remove auth token (logout)
function clearToken() {
  localStorage.removeItem('ds_token');
  localStorage.removeItem('ds_user');
}

// Check if user is logged in
function isLoggedIn() {
  return !!getToken();
}

// Redirect if not logged in
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
  }
}