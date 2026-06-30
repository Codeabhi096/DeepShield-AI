// ── history.js ───────────────────────────────────────────

requireAuth();

let currentPage = 1;
let currentFilter = 'all';
let currentSearch = '';
const PAGE_SIZE = 8;

// ── Avatar dropdown (shared logic) ────────────────────────

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

// ── Load history ───────────────────────────────────────────

async function loadHistory() {
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Loading...</td></tr>';

  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: PAGE_SIZE,
      ...(currentFilter !== 'all' && { type: currentFilter }),
      ...(currentSearch && { search: currentSearch }),
    });

    const data = await apiRequest(`/results?${params}`);
    const items = data?.results || [];
    const total = data?.total ?? 0;

    document.getElementById('totalCount').textContent = `${total} total detections`;

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No detections found.</td></tr>';
      renderPagination(0, 0);
      return;
    }

    tbody.innerHTML = items.map(renderRow).join('');
    renderPagination(total, Math.ceil(total / PAGE_SIZE));

    // Attach view button listeners
    document.querySelectorAll('[data-view-job]').forEach(btn => {
      btn.addEventListener('click', () => openResultModal(btn.dataset.viewJob));
    });

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Could not load history.</td></tr>';
  }
}

function renderRow(item) {
  const statusBadge =
    item.status === 'processing'
      ? `<span class="badge badge-process">Processing</span>`
      : item.is_deepfake
      ? `<span class="badge badge-fake">Deepfake</span>`
      : `<span class="badge badge-real">Authentic</span>`;

  const confidence = item.status === 'processing'
    ? '—'
    : `<span class="${item.confidence_score > 70 ? 'score-high' : item.confidence_score > 40 ? 'score-mid' : 'score-low'}">${item.confidence_score}%</span>`;

  return `
    <tr>
      <td>
        <div class="file-cell">
          <div class="file-icon">${typeIcon(item.detection_type)}</div>
          <span class="td-file">${truncate(item.file_name, 28)}</span>
        </div>
      </td>
      <td>${formatType(item.detection_type)}</td>
      <td>${statusBadge}</td>
      <td>${confidence}</td>
      <td>${formatDate(item.created_at)}</td>
      <td><button class="table-link" data-view-job="${item.job_id}" style="background:none;border:none;cursor:pointer;font-family:inherit">View</button></td>
    </tr>
  `;
}

function typeIcon(type) {
  const icons = {
    video: '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    image: '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    audio: '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>',
    face_swap: '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>',
  };
  return icons[type] || icons.video;
}

function formatType(type) {
  const labels = { video: 'Video', image: 'Image', audio: 'Audio', face_swap: 'Face swap' };
  return labels[type] || type;
}

// ── Pagination ──────────────────────────────────────────────

function renderPagination(total, totalPages) {
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);
  document.getElementById('pageInfo').textContent =
    total > 0 ? `Showing ${start}-${end} of ${total}` : 'Showing 0 of 0';

  const btnsEl = document.getElementById('pageBtns');
  if (totalPages <= 1) { btnsEl.innerHTML = ''; return; }

  let html = `<button class="page-btn" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="page-btn" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
  btnsEl.innerHTML = html;

  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { currentPage = +btn.dataset.page; loadHistory(); });
  });
  document.getElementById('prevPage')?.addEventListener('click', () => { currentPage--; loadHistory(); });
  document.getElementById('nextPage')?.addEventListener('click', () => { currentPage++; loadHistory(); });
}

// ── Filters ─────────────────────────────────────────────────

document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilter = pill.dataset.filter;
    currentPage = 1;
    loadHistory();
  });
});

// ── Search ──────────────────────────────────────────────────

const searchInput = document.getElementById('searchInput');
searchInput?.addEventListener('input', debounce((e) => {
  currentSearch = e.target.value.trim();
  currentPage = 1;
  loadHistory();
}, 400));

// ── Result modal ────────────────────────────────────────────

const resultModal  = document.getElementById('resultModal');
const modalContent = document.getElementById('modalContent');

async function openResultModal(jobId) {
  resultModal.classList.add('open');
  modalContent.innerHTML = '<p style="color:var(--color-text-muted);font-size:14px">Loading result...</p>';

  try {
    const result = await getDetectionResult(jobId);
    modalContent.innerHTML = renderModalContent(result);
  } catch (err) {
    modalContent.innerHTML = '<p style="color:#FCA5A5;font-size:14px">Could not load result.</p>';
  }
}

function renderModalContent(r) {
  const isFake = r.is_deepfake;
  return `
    <h2 class="modal-title">${r.file_name}</h2>
    <p class="modal-meta">${formatType(r.detection_type)} · Analyzed ${formatDate(r.created_at)}</p>

    <div class="modal-score-row">
      <div class="modal-score-box">
        <div class="modal-score-num ${isFake ? 'fake' : 'real'}">${isFake ? 'Deepfake' : 'Authentic'}</div>
        <div class="modal-score-label">Verdict</div>
      </div>
      <div class="modal-score-box">
        <div class="modal-score-num ${isFake ? 'fake' : 'real'}">${r.confidence_score}%</div>
        <div class="modal-score-label">Confidence</div>
      </div>
      <div class="modal-score-box">
        <div class="modal-score-num">${r.authenticity_score ?? '—'}</div>
        <div class="modal-score-label">Authenticity score</div>
      </div>
    </div>

    ${r.explanation?.heatmap_url ? `
      <div class="modal-section-title">Heatmap analysis</div>
      <img src="${r.explanation.heatmap_url}" alt="Detection heatmap" class="modal-heatmap" />
    ` : ''}

    <div class="modal-section-title">Explanation</div>
    <p class="modal-explanation">
      ${r.explanation?.summary || 'The model analyzed frame-level and pixel-level patterns to determine authenticity. No detailed explanation available for this result.'}
    </p>
  `;
}

document.getElementById('closeModal')?.addEventListener('click', () => resultModal.classList.remove('open'));
resultModal?.addEventListener('click', (e) => { if (e.target === resultModal) resultModal.classList.remove('open'); });

// ── Open modal if URL has ?job= param ─────────────────────

const urlParams = new URLSearchParams(window.location.search);
const jobParam = urlParams.get('job');
if (jobParam) openResultModal(jobParam);

// ── Init ────────────────────────────────────────────────────

loadHistory();