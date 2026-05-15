# Rawdah: An Intelligent Garden for Quranic Growth

## Introduction

A web application that helps users build a consistent relationship with the Quran through behavioral intelligence. It models engagement as a time-series process, predicts when a user is likely to disengage, and delivers gentle, personalized interventions to support continuity.

"Rawdah" is an interactive system that combines an immersive 3D experience with intelligent behavioral modeling to encourage consistent engagement with the Quran. At the center of the experience is a dynamic virtual garden that evolves based on the user’s reading habits. Each action contributes to the growth, health, and richness of the garden, transforming consistency into visible progress. The environment responds in real time, creating a deeply engaging and motivating experience that reflects the user’s spiritual journey. Alongside this, users can read the Quran seamlessly within the application, access translations, and explore authentic tafsir, making the experience both visually immersive and intellectually meaningful.

Beyond reading, users are encouraged to reflect on the verses they engage with by writing personal insights. These reflections are saved over time, allowing users to revisit their thoughts and observe how their understanding develops. The system then responds with verified tafsir-based explanations, helping align personal interpretations with established scholarship while preserving a sense of individual connection.

At the core of the system, machine learning models user behavior as a time-series process. By analyzing patterns such as reading frequency, session duration, streak consistency, and recent activity trends, the model predicts the likelihood of disengagement. Based on these predictions, the system delivers subtle, personalized interventions and dynamically adjusts the state of the garden, turning behavioral insights into a meaningful and motivating visual experience.

---

## Features

* Machine learning model predicting engagement and disengagement risk
* Behavioral tracking (streaks, reading time, consistency)
* Gamified garden growth system based on user activity
* Real-time behavioral signals through session tracking
* User interaction with a variety translations
* Verses and reminders of the day
* Reading (translation), Reciting (khatma), memorization
* Backend API for real-time predictions

---

## Technologies Used

* Python
* Flask (backend API)
* scikit-learn (machine learning)
* pandas (data processing)
* HTML / CSS / JavaScript (frontend)
* Git & GitHub (version control)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/quran-hackathon.git
cd quran-hackathon
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## How to Run

Start the backend server:

```bash
cd backend
python app.py
```

The server will run on:

```
http://127.0.0.1:5000/
```

---

## How to Use

1. The user presses  a start button to start their Quran reading activity.
2. The frontend sends the user's daily log to the backend `/predict` endpoint.
3. The machine learning model evaluates engagement patterns and returns a disengagement risk score.
4. Based on the result:

* The garden dynamically evolves as a whole ecosystem — flourishing with consistent engagement, slowing down with irregular activity, or gradually weakening when disengagement is detected
* Different elements of the garden (plants, colors, environment) respond to user behavior, making progress and decline visually meaningful
* A personalized, context-aware message is displayed to gently guide the user back to consistency

5. Users can optionally write reflections on the ayah they read.
6. The system also has tafsir-based explanations and stores past reflections, allowing users to revisit and track how their understanding evolves over time.


---

## Project Structure

```
quran-hackathon/
│
├── backend/          # Flask API
├── models/           # Trained ML model (.pkl)
├── data/             # Dataset (synthetic or real)
├── frontend/         # UI (plant visualization)
├── 3d-design/        # 3D assets and visuals
├── requirements.txt
└── README.md
```

---

## API Usage

### External Quran APIs (fulfills contest requirement)
- Quran Foundation / Quran CDN (documentation: https://api-docs.quran.foundation/). The backend uses the Quran CDN base endpoint `https://api.qurancdn.com/api/qdc` (see `backend/services/quran_api.py`) to fetch:
	- Chapters and metadata
	- Verses by chapter and by key (translations and Arabic text)
	- Translation text (Translation ID configured in the service)
	- Tafsir text (Tafsir ID configured in the service)
	- Audio recitation URLs (reciter ID used to request recitations)

This satisfies the requirement to use at least one of the Quran APIs (translation, tafsir, audio, verses).

### AI / Language model
- Anthropic (Claude) via the `anthropic` Python client is used for interpretation feedback and personalized nudges (`backend/services/ai.py`). Set `ANTHROPIC_API_KEY` in your environment to enable AI features.

### Internal user-facing APIs (our REST endpoints)
The frontend communicates with the backend via an axios client (`frontend/src/api/client.ts`, base `/api`). Key endpoints exposed by the backend include:
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me`, `POST /auth/me/photo`
- Verses / Tafsir features: `GET /verses/daily`, `POST /verses/interpret`, `GET /verses/interpretations`, `GET /verses/review-queue`, `POST /verses/review/{id}`
- Reading / user tracking: `POST /reading/session`, `POST /reading/session/{id}/photo`, `GET /reading/sessions`, `GET /reading/streak`, `GET /reading/engagement`
- Garden: `GET /garden/`
- Milestones: `GET /milestones/`, `POST /milestones/{id}/share`
- Buddies / social: `POST /buddies/request`, `GET /buddies/me`, `POST /buddies/message`, `GET /buddies/messages`, `DELETE /buddies/leave`, `GET /buddies/sadaqa`, `POST /buddies/sadaqa`

These endpoints provide the required "user APIs" for bookmarks/streaks/reading tracking and personalization (streaks, sessions, milestones, buddy sharing).

### Environment & notes
- To enable AI features, add `ANTHROPIC_API_KEY` to `backend/.env` or your environment.
- The Quran endpoints and IDs are defined in `backend/services/quran_api.py` (`BASE_URL`, `TRANSLATION_ID`, `TAFSIR_ID`, `RECITER_ID`).

### Compliance summary
- Meets contest requirements: uses Quran APIs (translation/tafsir/audio) and app-level user APIs (streaks, sessions, interpretations) to build habit-forming, accessible, and personalized experiences.

---

## Future Improvements

* Real user data integration
* Advanced time-series modeling (LSTM / sequence models)
* More personalized interventions
* Mobile app version
* Enhanced 3D interactive plant visualization

---

## License

This project is for educational and hackathon purposes.

