// ── api.js ───────────────────────────────────────────────
// Centralized fetch wrapper for all backend calls

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = 'login.html';
    return null;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.detail || 'Something went wrong');
  }

  return data;
}

// ── Dashboard ─────────────────────────────────────────────

function getDashboardStats() {
  return apiRequest('/results/stats');
}

function getRecentDetections(limit = 5) {
  return apiRequest(`/results/recent?limit=${limit}`);
}

// ── Upload & Detection ────────────────────────────────────

function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/upload`);

    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        xhr.status >= 200 && xhr.status < 300 ? resolve(data) : reject(new Error(data.detail));
      } catch {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

function startDetection(jobId, detectionType) {
  return apiRequest('/detect', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId, type: detectionType }),
  });
}

function getDetectionResult(jobId) {
  return apiRequest(`/results/${jobId}`);
}

function getDetectionHistory(page = 1, limit = 20) {
  return apiRequest(`/results?page=${page}&limit=${limit}`);
}