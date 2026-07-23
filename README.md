# SmartScan AI — Barcode Scanner & Product Assistant

A full-stack application for scanning barcodes, extracting product data with OCR,
and running AI-powered product/nutrition analysis — built with **FastAPI**,
**PostgreSQL**, **SQLModel**, **Groq**, and a **React + TypeScript** frontend.

## Features

| Area | Highlights |
|---|---|
| Auth | Signup/login, bcrypt hashing, JWT access + refresh tokens |
| Barcode | EAN-13/UPC/QR/Code-128 and more via `zxing-cpp` — camera, upload, manual, batch |
| OCR | Groq vision model reads expiry/mfg dates, ingredients, nutrition labels |
| AI Analysis | Summary, pros/cons, health score, recommendations, similar products, harmful additives, allergy warnings |
| Nutrition | Calories, protein, fat, carbs, sugar, sodium, allergens, vegan/halal flags |
| Shopping | Shopping list, scan-while-shopping, price estimates |
| Search | Barcode, name, brand, category, ingredient search with pagination/sorting |
| Dashboard | Scan trends, most-scanned products, recent scan history |
| Admin | User management, all-products view, Excel & PDF report export (backend routes ready; no UI yet) |
| Cross-cutting | Rate limiting, request logging, global error handling |
## Architecture

Clean, modular, layered architecture. Each backend domain is a self-contained
package with its own `router.py` (HTTP layer) and `service.py` (business logic),
decoupled from the ORM models and Pydantic schemas.

```
LabelLens/
├── backend/
│   ├── app/
│   │   ├── main.py                # App factory, middleware & router registration
│   │   ├── config.py              # Environment-driven settings (pydantic-settings)
│   │   ├── database.py            # SQLModel engine/session, auto-creates tables on startup
│   │   ├── dependencies.py        # get_current_user / require_admin
│   │   ├── models/                # SQLModel table definitions
│   │   ├── schemas/                # Pydantic request/response DTOs
│   │   ├── middleware/             # Logging, rate limiting, global error handlers
│   │   ├── auth/                  # Signup, login, JWT issuing
│   │   ├── users/                 # Profile, password change, scan history
│   │   ├── barcode/                # zxing-cpp decoding: camera, upload, manual, batch
│   │   ├── ocr/                    # Groq vision label/date/ingredient extraction
│   │   ├── ai/                     # Groq LLM product analysis & health scoring
│   │   ├── products/                # Product CRUD + search/filter/pagination
│   │   ├── shopping/                # Shopping list + scan-while-shopping
│   │   ├── dashboard/               # Aggregated stats for charts
│   │   ├── admin/                   # User management, Excel/PDF product reports
│   │   └── utils/                   # File storage, logging
│   ├── api/index.py                # Vercel serverless entrypoint
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                        # React + TypeScript (Vite)
    ├── src/
    │   ├── api/client.ts            # Typed REST client — every backend call lives here
    │   ├── context/AuthContext.tsx  # JWT auth state (localStorage, silent refresh on 401)
    │   ├── components/
    │   │   ├── Layout.tsx           # Sidebar navigation shell
    │   │   ├── RequireAuth.tsx      # Route guard for authenticated pages
    │   │   ├── ProductPanel.tsx     # Product detail + OCR + AI analysis
    │   │   └── WebcamCapture.tsx    # getUserMedia camera capture component
    │   ├── pages/
    │   │   ├── Account.tsx          # Login / signup / welcome+stats
    │   │   ├── Dashboard.tsx        # Charts (recharts) + scan history
    │   │   ├── Scanner.tsx          # Camera / upload / manual barcode entry
    │   │   └── ShoppingList.tsx     # Add/toggle/delete items, running total
    │   ├── types.ts                 # TS types mirroring backend Pydantic schemas
    │   ├── App.tsx, main.tsx, index.css
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```
### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env            # fill in DATABASE_URL and GROQ_API_KEY
```

Create the Postgres database if it doesn't exist yet (tables are created
automatically on first run — no migrations to run manually):
```sql
CREATE DATABASE barcode_scanner;
```

Then start the server:
```bash
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs` (Swagger) and `/redoc`.

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local      # set VITE_API_BASE_URL if backend isn't on localhost:8000
npm run dev
```

Opens at `http://localhost:5173`. Make sure the backend's `CORS_ORIGINS` includes
this origin — set `CORS_ORIGINS=http://localhost:5173` in `backend/.env` (or leave
it as `*` for local dev).

## Environment variables

See `backend/.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret used to sign access/refresh tokens |
| `GROQ_API_KEY` | Enables OCR and AI analysis endpoints |
| `GROQ_TEXT_MODEL` | Groq model used for AI product analysis |
| `GROQ_VISION_MODEL` | Groq vision model used for OCR label reading |
| `RATE_LIMIT_PER_MINUTE` | Per-client request cap |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |

> **Note on Groq models:** Groq periodically deprecates model IDs. If OCR or AI
> analysis returns a `model_not_found` error, check
> [console.groq.com/docs/models](https://console.groq.com/docs/models) for the
> current model names available to your account and update `GROQ_VISION_MODEL` /
> `GROQ_TEXT_MODEL` in `backend/.env` (no code change needed — these are
> environment-overridable via `pydantic-settings`).
