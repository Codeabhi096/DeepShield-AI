# ⚙️ DeepShield AI — Backend

FastAPI backend with ML inference, Celery async tasks, MongoDB, Redis, and AWS S3.

---

## 📁 Structure

```
backend/
├── app/
│   ├── main.py             # FastAPI entry point
│   ├── core/               # Config, security, exceptions, enums
│   ├── api/v1/routes/      # Auth, upload, detection, results, health
│   ├── db/                 # MongoDB models + repositories
│   ├── schemas/            # Pydantic request/response schemas
│   ├── models/             # ML detector classes
│   ├── services/           # Business logic
│   ├── tasks/              # Celery async tasks
│   ├── utils/              # Helpers, validators, logger
│   └── middleware/         # Auth, CORS, rate limiting, logging
├── ml_models/
│   ├── pretrained/         # Downloaded model weights (gitignored)
│   ├── inference/          # Batch processing, GPU utils
│   └── training/           # Fine-tuning scripts
├── config/                 # DB, Redis, S3, Celery connections
├── tests/                  # Unit, integration, performance tests
├── requirements.txt
└── .env.example
```

---

## ⚙️ Setup

### 1. Virtual environment banao

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
```

### 2. Dependencies install karo

```bash
pip install -r requirements.txt
```

### 3. Environment variables set karo

```bash
cp .env.example .env
# .env mein apni values fill karo
```

### 4. ML Models download karo

```bash
python ml_models/pretrained/download_models.py
```

### 5. Server run karo

```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Celery worker run karo (alag terminal mein)

```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

---

## 🌐 API Endpoints

| Method | Endpoint | Kaam |
|---|---|---|
| POST | `/api/v1/auth/register` | User register |
| POST | `/api/v1/auth/login` | User login, JWT token |
| POST | `/api/v1/upload` | File upload to S3 |
| POST | `/api/v1/detect/video` | Video deepfake detect |
| POST | `/api/v1/detect/image` | Image manipulation detect |
| POST | `/api/v1/detect/voice` | Voice deepfake detect |
| GET | `/api/v1/results/{job_id}` | Detection result fetch |
| GET | `/health` | Health check |

Full docs: `http://localhost:8000/docs`

---

## 🧪 Tests

```bash
# Saare tests
pytest tests/ -v

# Sirf unit tests
pytest tests/unit/ -v

# Sirf integration tests
pytest tests/integration/ -v

# Coverage report
pytest tests/ --cov=app --cov-report=html
```

---

## 🔑 Key Environment Variables

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DB_NAME=deepshield

# Redis
REDIS_URL=redis://localhost:6379

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket
AWS_REGION=ap-south-1

# JWT
JWT_SECRET_KEY=your_secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```