# Весы — Starter Code Pack (Wave 1)

Этот пакет создаёт стартовый каркас для **Wave 1** проекта **«Весы»**.

Внутри:
- monorepo skeleton
- FastAPI backend scaffold
- SQLite migration
- purchase flow seed config
- frontend scaffold
- intro screen
- auth/config vertical slice

## Что уже работает

### Backend
- `GET /healthz`
- `POST /api/v1/auth/telegram`
- `GET /api/v1/config/purchase-flow`

### Frontend
- boot flow
- Telegram bridge wrapper
- auth request on startup
- config request on startup
- intro screen with validation
- local session draft after клика `На весы`

## Локальный запуск

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
python scripts/init_db.py
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
python -m http.server 8080
```

Открывай:
- frontend: `http://localhost:8080`
- backend health: `http://localhost:8000/healthz`

## Что отдавать Codex следующим
1. реализовать реальную валидацию `/auth/telegram`
2. сделать `GET /config/purchase-flow` production-ready
3. добавить `POST /sessions/start`
4. собрать `intro -> question 1` vertical slice
5. добавить smoke test
