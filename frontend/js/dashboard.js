// ── dashboard.js ─────────────────────────────────────────

requireAuth();

// ── Greeting + date ───────────────────────────────────────

(function setGreeting() {
  const user = JSON.parse(localStorage.getItem('ds_user') || '{}');
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('greeting');
  if (el) el.textContent = user.firstName ? `${greet}, ${user.firstName}` : 'Dashboard';

  const dateEl = document.getElementById('dashDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  const avatar = document.getElementById('userAvatar');
  if (avatar && user.firstName) {
    avatar.textContent = (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase();
  }
})();

// ── Avatar dropdown ───────────────────────────────────────

const userAvatar    = document.getElementById('userAvatar');
const avatarDropdown = document.getElementById('avatarDropdown');

userAvatar?.addEventListener('click', (e) => {
  e.stopPropagation();
  avatarDropdown?.classList.toggle('open');
});
document.addEventListener('click', () => avatarDropdown?.classList.remove('open'));

// ── Load stats ─────────────────────────────────────────────

async function loadStats() {
  try {
    const stats = await getDashboardStats();
    if (!stats) return;

    setText('statTotal', stats.total_detections ?? 0);
    setText('statTotalSub', `↑ ${stats.this_week ?? 0} this week`);

    setText('statFakes', stats.fakes_found ?? 0);
    const fakePct = stats.total_detections ? ((stats.fakes_found / stats.total_detections) * 100).toFixed(1) : 0;
    setText('statFakesSub', `${fakePct}% of total`);

    setText('statConfidence', `${stats.avg_confidence ?? 0}%`);
    setText('statConfSub', `${stats.confidence_trend >= 0 ? '↑' : '↓'} ${Math.abs(stats.confidence_trend ?? 0)}% vs last week`);

    setText('statLeft', stats.detections_left ?? 0);
    setText('statLeftSub', stats.detections_left < 10 ? 'Upgrade for more' : 'Plenty remaining');

    const usageEl = document.getElementById('usageText');
    if (usageEl) usageEl.textContent = `${stats.detections_used ?? 0} / ${stats.detections_limit ?? 50} detections`;

  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── Load recent activity ──────────────────────────────────

async function loadActivity() {
  const list = document.getElementById('activityList');
  if (!list) return;

  try {
    const items = await getRecentDetections(4);
    if (!items || items.length === 0) {
      list.innerHTML = '<div class="activity-empty">No detections yet. Upload a file to get started.</div>';
      return;
    }
    list.innerHTML = items.map(renderActivityItem).join('');
  } catch {
    list.innerHTML = '<div class="activity-empty">Could not load activity.</div>';
  }
}

function renderActivityItem(item) {
  const isFake = item.is_deepfake;
  return `
    <div class="activity-item">
      <div class="activity-icon ${isFake ? 'fake' : 'real'}">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
      <div class="activity-info">
        <div class="activity-name">${item.file_name}</div>
        <div class="activity-meta">${item.detection_type} · ${timeAgo(item.created_at)}</div>
      </div>
      <span class="badge ${isFake ? 'badge-fake' : 'badge-real'}">${isFake ? 'Deepfake' : 'Authentic'}</span>
    </div>
  `;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return formatDate(dateStr);
}

// ── Load detections table ─────────────────────────────────

async function loadDetectionsTable() {
  const tbody = document.getElementById('detectionsBody');
  if (!tbody) return;

  try {
    const data  = await getDetectionHistory(1, 5);
    const items = data?.results || [];

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No detections yet.</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(renderTableRow).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Could not load detections.</td></tr>';
  }
}

function renderTableRow(item) {
  const statusBadge = item.is_deepfake
    ? `<span class="badge badge-fake">Deepfake</span>`
    : `<span class="badge badge-real">Authentic</span>`;

  const confidence = `<span class="${item.confidence_score > 70 ? 'score-high' : item.confidence_score > 40 ? 'score-mid' : 'score-low'}">${item.confidence_score}%</span>`;

  return `
    <tr>
      <td class="td-file">${truncate(item.file_name, 30)}</td>
      <td>${item.detection_type}</td>
      <td>${statusBadge}</td>
      <td>${confidence}</td>
      <td>${formatDate(item.created_at)}</td>
      <td><a href="history.html?job=${item.job_id}" class="table-link">View</a></td>
    </tr>
  `;
}

// ── Detection type tabs ────────────────────────────────────

let selectedType = 'video';

const hints = {
  video:     'Supports MP4, AVI, MOV up to 500MB',
  image:     'Supports JPG, PNG, WEBP up to 10MB',
  audio:     'Supports WAV, MP3, FLAC up to 50MB',
  face_swap: 'Supports MP4, JPG up to 500MB',
};

document.querySelectorAll('.detect-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.detect-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    selectedType = tab.dataset.type;
    const hintEl = document.getElementById('uploadHint');
    if (hintEl) hintEl.textContent = hints[selectedType];
  });
});

// ── Upload zone logic ──────────────────────────────────────

const uploadZone     = document.getElementById('uploadZone');
const fileInput      = document.getElementById('fileInput');
const browseBtn      = document.getElementById('browseBtn');
const uploadSelected = document.getElementById('uploadSelected');
const uploadProgress = document.getElementById('uploadProgress');
let selectedFile = null;

browseBtn?.addEventListener('click', () => fileInput?.click());
uploadZone?.addEventListener('click', () => fileInput?.click());

fileInput?.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

['dragover', 'dragleave', 'drop'].forEach(evt => {
  uploadZone?.addEventListener(evt, (e) => {
    e.preventDefault();
    uploadZone.classList.toggle('dragover', evt === 'dragover');
    if (evt === 'drop') handleFileSelect(e.dataTransfer.files[0]);
  });
});

function handleFileSelect(file) {
  if (!file) return;
  selectedFile = file;
  const nameEl = document.getElementById('selectedFileName');
  const sizeEl = document.getElementById('selectedFileSize');
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
  if (uploadZone) uploadZone.style.display = 'none';
  if (uploadSelected) uploadSelected.style.display = 'block';
}

document.getElementById('clearFile')?.addEventListener('click', () => {
  selectedFile = null;
  if (fileInput) fileInput.value = '';
  if (uploadZone) uploadZone.style.display = 'block';
  if (uploadSelected) uploadSelected.style.display = 'none';
});

document.getElementById('analyzeBtn')?.addEventListener('click', async () => {
  if (!selectedFile) return;

  if (uploadSelected) uploadSelected.style.display = 'none';
  if (uploadProgress) uploadProgress.style.display = 'block';

  try {
    // selectedType pass karo — image/video/audio/face_swap
    const uploaded = await uploadFile(selectedFile, selectedType, (pct) => {
      const fill  = document.getElementById('progressFill');
      const label = document.getElementById('progressLabel');
      if (fill)  fill.style.width = `${pct}%`;
      if (label) label.textContent = pct < 100 ? `Uploading... ${pct}%` : 'Starting analysis...';
    });

    const job = await startDetection(uploaded.job_id, selectedType);
    window.location.href = `history.html?job=${job.job_id}`;

  } catch (err) {
    const label = document.getElementById('progressLabel');
    if (label) label.textContent = 'Upload failed. Try again.';
    setTimeout(() => {
      if (uploadProgress) uploadProgress.style.display = 'none';
      if (uploadZone) uploadZone.style.display = 'block';
    }, 2000);
  }
});

// ── Init ───────────────────────────────────────────────────

loadStats();
loadActivity();
loadDetectionsTable();