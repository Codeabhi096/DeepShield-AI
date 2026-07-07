// ── detection.js ─────────────────────────────────────────
// Shared logic for video/image/voice/face-swap detection pages

requireAuth();

// Auto-detect type from current page filename
const PAGE_TYPE = (() => {
  const path = window.location.pathname;
  if (path.includes('image')) return 'image';
  if (path.includes('voice')) return 'audio';
  if (path.includes('face-swap')) return 'face_swap';
  return 'video';
})();

// ── Avatar dropdown ────────────────────────────────────────

const userAvatar = document.getElementById('userAvatar');
const avatarDropdown = document.getElementById('avatarDropdown');

userAvatar?.addEventListener('click', (e) => {
  e.stopPropagation();
  avatarDropdown?.classList.toggle('open');
});
document.addEventListener('click', () => avatarDropdown?.classList.remove('open'));

(function setAvatarInitials() {
  const user = JSON.parse(localStorage.getItem('ds_user') || '{}');
  if (userAvatar && user.firstName) {
    userAvatar.textContent = (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase();
  }
})();

// ── Elements ────────────────────────────────────────────────

const dropzone       = document.getElementById('dropzone');
const fileInput       = document.getElementById('fileInput');
const browseBtn       = document.getElementById('browseBtn');
const videoPreview    = document.getElementById('videoPreview');
const previewPlayer   = document.getElementById('previewPlayer');
const uploadProgress  = document.getElementById('uploadProgress');

const resultEmpty      = document.getElementById('resultEmpty');
const resultProcessing = document.getElementById('resultProcessing');
const resultContent    = document.getElementById('resultContent');

let selectedFile = null;

// ── File selection ─────────────────────────────────────────

browseBtn?.addEventListener('click', () => fileInput.click());
dropzone?.addEventListener('click', () => fileInput.click());

fileInput?.addEventListener('change', (e) => handleFile(e.target.files[0]));

['dragover', 'dragleave', 'drop'].forEach(evt => {
  dropzone?.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.toggle('dragover', evt === 'dragover');
    if (evt === 'drop') handleFile(e.dataTransfer.files[0]);
  });
});

function handleFile(file) {
  if (!file) return;
  selectedFile = file;

  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatFileSize(file.size);

  // Show preview for video files
  if (file.type.startsWith('video/') && previewPlayer) {
    previewPlayer.style.display = 'block';
    previewPlayer.src = URL.createObjectURL(file);
  }

  // Show preview for image files
  const previewImage = document.getElementById('previewImage');
  if (file.type.startsWith('image/') && previewImage) {
    previewImage.style.display = 'block';
    previewImage.src = URL.createObjectURL(file);
  }

  // Show preview for audio files
  const previewAudio = document.getElementById('previewAudio');
  if (file.type.startsWith('audio/') && previewAudio) {
    previewAudio.src = URL.createObjectURL(file);
  }

  dropzone.style.display = 'none';
  videoPreview.style.display = 'block';
}

document.getElementById('removeFile')?.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  if (previewPlayer) previewPlayer.src = '';
  dropzone.style.display = 'block';
  videoPreview.style.display = 'none';
  resetResultPanel();
});

// ── Analyze flow ────────────────────────────────────────────

document.getElementById('analyzeBtn')?.addEventListener('click', async () => {
  if (!selectedFile) return;

  videoPreview.style.display = 'none';
  uploadProgress.style.display = 'block';
  showResultState('processing');

  try {
    const uploaded = await uploadFile(selectedFile, (pct) => {
      document.getElementById('progressFill').style.width = `${pct}%`;
      document.getElementById('progressLabel').textContent =
        pct < 100 ? `Uploading... ${pct}%` : 'Upload complete. Starting analysis...';
    });

    const job = await startDetection(uploaded.job_id, PAGE_TYPE);
    const result = await pollForResult(job.job_id);

    uploadProgress.style.display = 'none';
    renderResult(result);

  } catch (err) {
    uploadProgress.style.display = 'none';
    showResultState('empty');
    alert('Analysis failed: ' + err.message);
  }
});

// Poll job status every 2s until completed (max 60s)
async function pollForResult(jobId, attempts = 0) {
  if (attempts > 30) throw new Error('Analysis timed out');

  const result = await getDetectionResult(jobId);

  if (result.status === 'completed') return result;
  if (result.status === 'failed') throw new Error(result.error_message || 'Detection failed');

  await new Promise(r => setTimeout(r, 2000));
  return pollForResult(jobId, attempts + 1);
}

// ── Result rendering ────────────────────────────────────────

function showResultState(state) {
  resultEmpty.style.display      = state === 'empty'      ? 'flex' : 'none';
  resultProcessing.style.display = state === 'processing' ? 'flex' : 'none';
  resultContent.style.display    = state === 'content'    ? 'block' : 'none';
}

function resetResultPanel() { showResultState('empty'); }

function renderResult(r) {
  showResultState('content');

  const isFake = r.is_deepfake;
  const banner = document.getElementById('verdictBanner');
  banner.className = `verdict-banner ${isFake ? 'fake' : 'real'}`;

  document.getElementById('verdictIcon').innerHTML = isFake
    ? '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    : '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

  document.getElementById('verdictText').textContent = isFake ? 'Deepfake detected' : 'Likely authentic';
  document.getElementById('verdictSub').textContent =
    `Analyzed using ${r.model_version || 'ensemble model'}`;

  document.getElementById('confidenceScore').textContent = `${r.confidence_score}%`;
  document.getElementById('authenticityScore').textContent = r.authenticity_score ?? '—';
  document.getElementById('processingTime').textContent =
    r.processing_time_ms ? `${(r.processing_time_ms / 1000).toFixed(1)}s` : '—';

  const heatmapSection = document.getElementById('heatmapSection');
  if (r.explanation?.heatmap_url) {
    document.getElementById('heatmapImg').src = r.explanation.heatmap_url;
    heatmapSection.style.display = 'block';
  } else {
    heatmapSection.style.display = 'none';
  }

  document.getElementById('resultExplanation').textContent =
    r.explanation?.summary ||
    `Our model analyzed temporal and spatial inconsistencies across frames. ${isFake ? 'Manipulation artifacts were detected in facial regions.' : 'No significant manipulation artifacts were found.'}`;
}

document.getElementById('newAnalysisBtn')?.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  dropzone.style.display = 'block';
  videoPreview.style.display = 'none';
  resetResultPanel();
});

// ── Recent analyses for this type ───────────────────────────

async function loadRecentForType() {
  const list = document.getElementById('recentVideos');
  if (!list) return;

  try {
    const data = await apiRequest(`/results?type=${PAGE_TYPE}&limit=4`);
    const items = data?.results || [];

    if (items.length === 0) {
      list.innerHTML = '<div class="activity-empty">No analyses yet for this type.</div>';
      return;
    }

    list.innerHTML = items.map(item => `
      <div class="activity-item">
        <div class="activity-icon ${item.is_deepfake ? 'fake' : 'real'}">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div class="activity-info">
          <div class="activity-name">${item.file_name}</div>
          <div class="activity-meta">${timeAgo(item.created_at)} · ${item.confidence_score}% confidence</div>
        </div>
        <span class="badge ${item.is_deepfake ? 'badge-fake' : 'badge-real'}">
          ${item.is_deepfake ? 'Deepfake' : 'Authentic'}
        </span>
      </div>
    `).join('');

  } catch (err) {
    list.innerHTML = '<div class="activity-empty">Could not load recent analyses.</div>';
  }
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return formatDate(dateStr);
}

loadRecentForType();