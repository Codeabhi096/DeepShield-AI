# 🖥️ DeepShield AI — Frontend

Vanilla HTML/CSS/JS frontend for the DeepShield AI platform.

---

## 📁 Structure

```
frontend/
├── index.html              # Landing page
├── dashboard.html          # Main dashboard
├── login.html / register.html
├── history.html            # Detection history
├── profile.html / settings.html
├── detection/              # Detection pages (video, image, voice, face-swap)
├── css/                    # Stylesheets
├── js/                     # JavaScript modules
├── components/             # Reusable HTML components (navbar, modal etc.)
├── assets/                 # Images, fonts, videos
└── lib/                    # Third-party JS utilities
```

---

## ⚙️ Setup

No build step needed — plain HTML/CSS/JS hai.

### 1. Backend chal raha ho pehle

```bash
# Root folder se
docker-compose -f docker-compose.dev.yml up
```

### 2. API URL set karo

```bash
cp .env.example .env
# .env mein API base URL set karo
```

### 3. Browser mein kholo

```
frontend/index.html   # seedha open karo
# ya Live Server use karo VS Code mein
```

---

## 🔑 Key JS Files

| File | Kaam |
|---|---|
| `js/config.js` | API base URL aur constants |
| `js/auth.js` | Login, register, logout, JWT token |
| `js/api.js` | Saare HTTP requests ka wrapper |
| `js/upload.js` | File upload handling |
| `js/detection.js` | Detection API calls |
| `js/results.js` | Results + heatmap display |
| `js/webcam.js` | Real-time webcam detection |

---

## 🌐 Pages

| Page | Route |
|---|---|
| Landing | `index.html` |
| Login / Register | `login.html` / `register.html` |
| Dashboard | `dashboard.html` |
| Video Detection | `detection/video-detection.html` |
| Image Detection | `detection/image-detection.html` |
| Voice Detection | `detection/voice-detection.html` |
| Face Swap | `detection/face-swap-detection.html` |
| History | `history.html` |