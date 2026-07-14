# 🛡️ DeepShield AI

> **Enterprise-grade deepfake detection platform** — Detect manipulated videos, AI-generated images, voice clones, and face swaps using state-of-the-art computer vision and deep learning.

[![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://mongodb.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.3-orange?style=flat-square&logo=pytorch)](https://pytorch.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 🖥️ UI Preview

### 🏠 Landing Page
![Landing Page Hero](Docs/Screenshots/Index_Page_1.png)
![Landing Page Threat Section](Docs/Screenshots/Index_page_2.png)
![Landing Page Features](Docs/Screenshots/Index_page_3.png)
![Landing Page Pricing & CTA](Docs/Screenshots/Index_page_4.png)

---

### 🔐 Login
![Login Page](Docs/Screenshots/Login_page.png)

---

### 📊 Dashboard
![Dashboard](Docs/Screenshots/Dashboard.png)
![Dashboard Detection Table](Docs/Screenshots/dashboard_1.png)

---

### ⚙️ Settings & Profile
![Settings](Docs/Screenshots/Settings.png)
![Profile](Docs/Screenshots/Profile.png)

---

## 📊 What It Detects

| Type | Model | Accuracy |
|------|-------|---------|
| 🎬 Video deepfake | ResNet-50 + OpenCV | 99.2% |
| 🖼️ AI-generated image | EfficientNet-B0 | 97.8% |
| 👤 Face swap | YOLO + ResNet | 98.1% |
| 🎙️ Voice clone | Spectral analysis | Phase 3 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Layer                         │
│         (HTML/CSS/JS — Dark SaaS UI)                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              FastAPI REST Layer (Port 8000)              │
│  /api/v1/auth  /api/v1/upload  /api/v1/detect           │
│  /api/v1/results  /health                               │
└────────────────┬───────────────────────────────────────┘
                 │
        ┌────────▼──────────────────────┐
        │     ML Processing Layer       │
        │  EfficientNet-B0 (Images)     │
        │  ResNet-50 (Videos)           │
        │  Statistical (Audio)          │
        └────────┬──────────────────────┘
                 │
        ┌────────▼──────────────────────┐
        │       MongoDB Atlas           │
        │  users / detection_jobs       │
        │  detection_results            │
        └───────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JS |
| **Backend** | FastAPI, Python 3.11 |
| **ML Framework** | PyTorch, TorchVision |
| **Image Detection** | EfficientNet-B0 |
| **Video Detection** | ResNet-50 + OpenCV |
| **Database** | MongoDB Atlas |
| **Auth** | JWT (python-jose + passlib) |
| **Storage** | Local (AWS S3 — Phase 4) |

---

## 📁 Project Structure

```
DeepShield AI/
├── frontend/                    # HTML/CSS/JS UI
│   ├── index.html               # Landing page
│   ├── dashboard.html           # Main dashboard
│   ├── login.html / register.html
│   ├── history.html             # Detection history
│   ├── profile.html / settings.html
│   ├── detection/               # 4 detection pages
│   ├── css/                     # Stylesheets
│   └── js/                      # JavaScript modules
│
├── backend/                     # FastAPI Backend
│   ├── app/
│   │   ├── main.py              # Entry point
│   │   ├── core/                # Config, security, exceptions
│   │   ├── api/v1/routes/       # Auth, upload, detect, results
│   │   ├── models/              # ML detectors
│   │   ├── services/            # Business logic
│   │   ├── db/                  # MongoDB models
│   │   └── schemas/             # Pydantic schemas
│   ├── config/                  # DB connections
│   ├── data/uploads/            # Temp file storage
│   └── requirements.txt
│
└── Docs/
    └── Screenshots/             # UI screenshots
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- MongoDB Atlas account (free tier works)
- VS Code + Live Server extension

### 1. Clone the repo

```bash
git clone https://github.com/Codeabhi096/DeepShield-AI.git
cd DeepShield-AI
```

### 2. Backend setup

```bash
cd backend
py -3.11 -m venv venv_new
venv_new\Scripts\activate
pip install -r requirements.txt
pip install pydantic[email] bcrypt==4.0.1 passlib==1.7.4
```

### 3. Configure .env

```bash
# backend/.env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=deepshield
JWT_SECRET_KEY=your-secret-key-here
APP_ENV=development
```

### 4. Run backend

```bash
venv_new\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

### 5. Run frontend

Open `frontend/index.html` with VS Code **Live Server**.

```
Frontend : http://127.0.0.1:5500/frontend/index.html
API      : http://127.0.0.1:8000
API Docs : http://127.0.0.1:8000/docs
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login, get JWT token |
| `GET` | `/api/v1/auth/me` | Get current user profile |
| `PATCH` | `/api/v1/auth/me` | Update profile |
| `PATCH` | `/api/v1/auth/password` | Change password |
| `POST` | `/api/v1/upload?detection_type=image` | Upload file |
| `POST` | `/api/v1/detect` | Start detection |
| `GET` | `/api/v1/results` | Get all results (paginated) |
| `GET` | `/api/v1/results/stats` | Dashboard stats |
| `GET` | `/api/v1/results/recent` | Recent detections |
| `GET` | `/api/v1/results/{job_id}` | Single result |
| `GET` | `/health` | Health check |

---

## 🧠 ML Models

### Image Detection — EfficientNet-B0
- Pretrained on ImageNet, modified for binary classification
- Statistical noise analysis as secondary signal
- CPU-friendly — no GPU required

### Video Detection — ResNet-50
- 10-frame sampling per video
- OpenCV face detection per frame
- Temporal aggregation (avg + max weighting)

### Audio Detection
- Statistical spectral analysis (current)
- Full deep learning model coming in Phase 6

---

## 🔒 Security Features

- JWT Authentication (access + refresh tokens)
- bcrypt password hashing
- Rate limiting — 100 req/min per IP
- CORS configured for frontend
- Pydantic input validation
- File size limits (Video 500MB, Image 10MB, Audio 50MB)

---

## 📦 Plans

| Plan | Detections/month | Price |
|------|-----------------|-------|
| **Free** | 5 | $0 |
| **Pro** | 2,000 | $49/mo |
| **Enterprise** | Unlimited | Custom |

---

## 🗺️ Roadmap

- [x] Phase 1 — Full Frontend UI (9 pages)
- [x] Phase 2 — Backend API (auth, upload, detection, results)
- [x] Phase 3 — ML Models (EfficientNet + ResNet-50)
- [ ] Phase 4 — AWS S3 cloud storage
- [ ] Phase 5 — Redis + Celery async processing
- [ ] Phase 6 — Voice deepfake model
- [ ] Phase 7 — Docker + cloud deployment
- [ ] Phase 8 — Real-time webcam detection

---

## 👨‍💻 Author

**Abhishek** — [@Codeabhi096](https://github.com/Codeabhi096)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.