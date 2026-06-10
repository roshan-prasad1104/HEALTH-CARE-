# Prescrypto 🛡️

**Prescrypto** is a production-ready, full-stack HealthTech platform designed to improve health literacy, make prescriptions/lab panels legible, and combat viral medical misinformation safely.

Developed with a premium, venture-backed startup design system (Glassmorphism + Dark Mode), the platform empowers patients while adhering to strict clinical guidelines: **No Diagnosis, No Prescribing, and No Doctor Replacement.**

---

## 🚀 Hero Differentiator: WhatsApp Medical Misinformation Scanner

The flagship feature of this platform targets the viral spread of alternative medicine rumors on chat networks (like WhatsApp, Telegram, or Facebook). 
- **Screenshot Parsing**: Users can upload forwarded message screenshots. Tesseract.js extracts the textual claim with fallback support to Google Vision API.
- **Scaremongering Assessment**: An analysis layer scores the text on the "Fear-Manipulation Meter" (indicating whether the language attempts to panic-induce).
- **Dangerous Remedy Flags**: The engine detects toxic home recipes or messages urging patients to ignore professional vaccines/cancer cures.
- **One-Click Debunk Templates**: Instantly generates emojis-embedded fact-checks citing official medical authorities (WHO, CDC, NIH) and offers a direct **"Share on WhatsApp"** button.

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **React.js (Vite)**: Clean state routing.
- **Tailwind CSS**: HSL color schemes, custom scrollbars, and premium hover micro-animations.
- **Redux Toolkit**: Centralized store tracking user authentication and Accessibility metrics.
- **i18next**: Support for 10 languages (English, Hindi, Telugu, Tamil, Bengali, Kannada, Malayalam, Marathi, Gujarati, Punjabi) with auto-locale detection.
- **SpeechSynthesis Integration**: Built-in voice narrator and hover-triggered auditory guides for Elderly Mode.

### Backend
- **Node.js (Express)**: Modular MVC router structure.
- **Tesseract.js**: Server-side OCR engine.
- **Google Generative AI SDK**: Integrates Gemini-1.5-flash with automated Claude/OpenAI mock fallbacks.
- **Prisma ORM**: Interfaces PostgreSQL for storing user profiles, verified claim databases, and uploads.

---

## 📁 Repository Structure

```
c:\Users\ROSHAN PRASAD\OneDrive\Desktop\Prescrypto
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # PostgreSQL structures
│   │   └── seed.js         # Seeding claims and lab range markers
│   ├── src/
│   │   ├── config/         # Gemini, Prisma, and database connectors
│   │   ├── middleware/     # JWT authentication and Role checks
│   │   ├── modules/
│   │   │   ├── auth/       # Registration & Login endpoints
│   │   │   ├── ocr/        # Tesseract engine wrapper
│   │   │   ├── ai/         # RAG embeddings pipeline and safety checks
│   │   │   ├── health/     # Prescription decoders and lab analyzes
│   │   │   └── misinformation/ # WhatsApp debunking APIs
│   │   ├── app.js
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # UI elements (Navbar)
│   │   ├── context/        # Speech and hover accessibility context
│   │   ├── i18n/           # 10 languages translation sets
│   │   ├── pages/          # Dashboard, Scanner, Lab Analyzer, Decoder, Learning Hub
│   │   ├── store/          # Redux Store config
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## ⚡ Setup & Installation

### Option A: Local Run (No Docker)

#### Prerequisites
- Node.js (v18+)
- PostgreSQL (Optional; if offline, database actions default to seeded mock arrays)

#### Step 1: Initialize Database (Prisma)
Configure your PostgreSQL link in `backend/.env`. Then run:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

#### Step 2: Start Backend API
```bash
cd backend
npm run dev
```
The Express server will launch at `http://localhost:5000`.

#### Step 3: Start Frontend Dev Server
```bash
cd ../frontend
npm run dev
```
The React app will launch at `http://localhost:3000`.

---

### Option B: Orchestrated Run (Docker Compose)

Simply boot up the entire stack (PostgreSQL, Redis, Backend, Frontend) with a single command:
```bash
docker-compose up --build
```
- **React Frontend**: `http://localhost:3000`
- **Express Backend**: `http://localhost:5000`
- **Postgres Database Port**: `5432`

---

## 🛡️ Strict Safety Guidelines & Blocking Rules
The system contains pre-compiled filters to block dangerous user prompts:
1. **Diagnosis Block**: Any queries containing words like "diagnose my chest pain", "do I have cancer", etc., are rejected. Response: *"Diagnosis Blocked: The platform cannot diagnose diseases. Please consult a qualified health professional."*
2. **Prescription Block**: Requests like "write me a prescription", "give me dosage for", etc., return: *"Prescription Blocked: The platform cannot prescribe medicines or direct dosages."*
