# Rawdah — A Living Garden for Quranic Growth

## Introduction

Rawdah is a web application that helps users build a consistent relationship with the Quran through behavioral intelligence. It models engagement as a time-series process, predicts when a user is likely to disengage, and delivers gentle, personalized interventions to support continuity.

At the center of the experience is a dynamic 3D virtual garden that evolves based on reading habits — flourishing with consistency, slowing with irregular activity. Users read the Quran within the app, access translations, explore authentic tafsir, write personal reflections, track streaks, and bookmark meaningful verses — all synced with the Quran Foundation's official APIs.

---

## Quran Foundation API Usage

This project uses the **Quran Foundation API** (`https://api-docs.quran.foundation/`) and satisfies **both** API requirements of the hackathon.

### Content APIs (Requirement 1)

All content is fetched from the Quran Foundation's CDN endpoint (`https://api.qurancdn.com/api/qdc`) in `backend/services/quran_api.py`:

| API | Endpoint | Usage |
|-----|----------|-------|
| **Chapters API** | `GET /chapters` | Surah names and metadata |
| **Verses API** | `GET /verses/by_chapter/{n}` | Daily verse selection with Arabic text |
| **Verses API** | `GET /verses/by_key/{key}` | Fetch specific verse by key (e.g. `2:255`) |
| **Translation API** | `translations` param (ID `131`) | Dr. Mustafa Khattab — The Clear Quran (English) |
| **Tafsir API** | `GET /tafsirs/169/by_ayah/{key}` | Tafsir Ibn Kathir (English, abridged) |
| **Audio Recitation API** | `audio` param (reciter ID `7`) | Mishary Rashid Al-Afasy recitations |

These power the daily verse display (Arabic + translation + audio player), the tafsir shown after user reflections, and verse-by-key lookups throughout the app.

### User APIs (Requirement 2)

User bookmarks are synced with the **Quran Foundation User API** (`https://apis.quran.foundation/auth/v1/`) in `backend/services/qf_user_api.py` and `backend/routes/bookmarks.py`:

| API | Endpoint | Usage |
|-----|----------|-------|
| **Bookmarks — Add** | `POST /auth/v1/bookmarks` | When user bookmarks a verse, it is saved to QF |
| **Bookmarks — List** | `GET /auth/v1/bookmarks` | Retrieve user's QF bookmarks |
| **Bookmarks — Delete** | `DELETE /auth/v1/bookmarks/{id}` | Remove bookmark from QF |

Authentication uses the **Quran Foundation OAuth 2.0** flow (PKCE / authorization code):
- `GET /api/auth/qf-connect` — redirects user to QF login
- `GET /api/auth/qf-callback` — exchanges code for tokens, stored per user
- `DELETE /api/auth/qf-disconnect` — unlinks QF account

When a user connects their QF account and bookmarks a verse in Rawdah, the bookmark is created locally **and** synced to their official Quran Foundation account — so their bookmarks follow them across any QF-connected app.

**Environment variables required for QF User API:**
```
QF_CLIENT_ID=<your registered QF client id>
QF_CLIENT_SECRET=<your registered QF client secret>
```

---

## Features

- Machine learning model predicting engagement and disengagement risk
- Behavioral tracking: streaks, reading time, session consistency
- Gamified 3D garden that grows with every reading session
- Daily verse with Arabic text, English translation, and audio recitation (QF Content API)
- Tafsir Ibn Kathir shown for every verse reflection (QF Tafsir API)
- Verse bookmarks synced to the Quran Foundation User API
- Personal reflections saved and compared against scholarly tafsir
- Spaced-repetition review queue for revisiting reflections
- Reading buddy matching and accountability messaging
- Milestone awards (streaks, verses read, first reflection, etc.)

---

## Technologies

| Layer | Stack |
|-------|-------|
| Frontend | React + TypeScript, Vite, Tailwind CSS, Three.js (3D garden) |
| Backend | FastAPI (Python), SQLAlchemy, PostgreSQL (Render) |
| Auth | JWT (internal) + OAuth 2.0 (Quran Foundation) |
| APIs | Quran Foundation Content API, Quran Foundation User API |
| ML | scikit-learn (engagement prediction), pandas |
| Deploy | Vercel (frontend), Render (backend + PostgreSQL) |

---

## Live Demo

- **Frontend:** https://rawdah-quran-hackathon-project-81v3-4s90zqiib.vercel.app
- **Backend API:** https://rawdah-quran-hackathon-project-7.onrender.com
- **API Docs:** https://rawdah-quran-hackathon-project-7.onrender.com/docs

---

## Local Setup

```bash
git clone https://github.com/feltanedounia/Rawdah-Quran-Hackathon-project.git
cd Rawdah-Quran-Hackathon-project
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in SECRET_KEY, and optionally QF_CLIENT_ID/SECRET
uvicorn app:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)
```
SECRET_KEY=<random secret for JWT signing>
DATABASE_URL=                    # leave blank for local SQLite
FRONTEND_URL=http://localhost:5173

# Quran Foundation User API (optional — enables bookmark sync)
QF_CLIENT_ID=
QF_CLIENT_SECRET=
```

### Frontend (`frontend/.env.production`)
```
VITE_API_URL=https://rawdah-quran-hackathon-project-7.onrender.com/api
```

---

## Project Structure

```
Rawdah-Quran-Hackathon-project/
├── backend/
│   ├── app.py                  # FastAPI app + CORS + DB init
│   ├── models.py               # SQLAlchemy models
│   ├── routes/
│   │   ├── auth.py             # Login, register, QF OAuth connect
│   │   ├── verses.py           # Daily verse, interpretations, review
│   │   ├── bookmarks.py        # Bookmark CRUD + QF User API sync
│   │   ├── reading.py          # Session logging, streaks
│   │   ├── garden.py           # Garden state
│   │   ├── milestones.py       # Milestone tracking
│   │   └── buddies.py          # Buddy matching + messaging
│   └── services/
│       ├── quran_api.py        # Quran Foundation Content API calls
│       ├── qf_user_api.py      # Quran Foundation User API calls (bookmarks)
│       ├── ai.py               # Tafsir-based interpretation feedback
│       └── milestones.py       # Milestone award logic
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── bookmarks.ts    # Bookmark API (calls /api/bookmarks)
│       │   ├── verses.ts       # Verse/tafsir API
│       │   └── ...
│       └── pages/
│           ├── SessionPage.tsx # Session timer + bookmark button
│           └── ...
├── model/                      # Trained ML engagement model
├── data/                       # Training dataset
├── render.yaml                 # Render deployment config
└── README.md
```

---

## License

This project is for educational and hackathon purposes.
