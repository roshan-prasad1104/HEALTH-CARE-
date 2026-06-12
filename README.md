# Prescrypto 🛡️

**Prescrypto** is a production-ready, full-stack HealthTech platform designed to improve health literacy, make prescriptions and lab panels legible, and combat viral medical misinformation safely.

Developed with a premium, venture-backed startup design system (Glassmorphism + Dark/Light Theme), the platform empowers patients while adhering to strict clinical guidelines: **No Diagnosis, No Prescribing, and No Doctor Replacement.**

---

## 🚀 Key Features & Hero Modules

### 1. WhatsApp Medical Misinformation Scanner
Built to stop the spread of alternative medicine rumors on chat networks (WhatsApp, Telegram, Facebook):
- **Text-Based Paste Box**: Deprecated complex file uploads to allow users to directly copy-paste text forwards for instant checks.
- **Fear-Manipulation Meter**: Evaluates the text's tone and rates it based on panic-inducing or manipulative keywords.
- **Dangerous Remedy Detection**: Instantly flags hazardous home recipes, toxic herbal cures, or messages urging patients to ignore vaccines/cancer treatments.
- **One-Click Debunk Generation**: Automatically generates emoji-rich fact-checking messages citing official authorities (WHO, CDC, NHS) and embeds a **"Share on WhatsApp"** button.

### 2. Prescription Decoder & Drug Safety Pipeline
Translates unreadable doctor prescriptions into clear instructions:
- **Clinical AI Processing**: Decodes drug names, generic mappings, dosages, frequencies, and durations.
- **Drug Database & openFDA Integration**: Matches extracted drugs against local database structures and queries the openFDA API in real-time to fetch safety labels, pregnancy warnings, and side effects.
- **Gemini Safety Cache**: If offline or not in external databases, falls back to Gemini API to resolve pharmacological metrics.

### 3. Lab Report Analyzer (Ophthalmology & Hematology)
Compares lab values against standard clinical databases:
- **Category Isolation**:
  - **🩸 Blood Biomarkers**: Analyzes general metabolic panels (Fasting Glucose, HbA1c, Cholesterol, etc.).
  - **👁️ Eye Sight / Vision**: Specially tuned for visual health parameters: Visual Acuity (Right & Left Eyes in decimal form) and Intraocular Pressure (mmHg).
- **Client-Side Keyword Routing**: Features a lightweight local keyword-matching array (checking for terms like "sugar", "blood", "hba1c" vs "sph", "cyl", "eye", "vision") to handle category routing and cross-validation alerts cleanly without heavy external NIH/LOINC API lookups.
- **Multi-Zone Range Visualizer**: Displays a responsive gradient bar highlighting **Low** (sky blue), **Normal** (emerald), and **Elevated/High** (rose) zones, placing the user's specific value as a dynamic node.
- **Clinical Prompts Isolation**: Prevents cross-contamination by routing the analysis through dedicated vision prompts or blood panels depending on the active selector.

### 4. Accessibility & Multilingual Engine
Provides universal access, especially for senior citizens:
- **i18next Multilingual Framework**: Instant UI translation into 10 regional languages (English, Hindi, Telugu, Tamil, Bengali, Kannada, Malayalam, Marathi, Gujarati, Punjabi).
- **Elderly Mode**: Activates large font sizes (17px+), simplifies layouts, and initiates automatic auditory narration.
- **Text-to-Speech (TTS) Proxy**: Built-in speech synthesis streaming engine that converts text analysis to voice narration in regional accents.

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **React.js (Vite)**: Clean state routing and fast bundler speeds.
- **Tailwind CSS**: Glassmorphism effects, dynamic CSS transitions, and HSL custom colors.
- **Redux Toolkit**: Syncs user sessions, settings, and active accessibility profiles.
- **Lucide React**: High-fidelity vector iconography.

### Backend
- **Node.js (Express)**: Modular MVC structure.
- **Unified Gemini SDK Integration**: Integrates the official `@google/generative-ai` SDK supporting both standard (`AIza`) and Google Cloud/Pro-tier (`AQ.`) keys.
- **Robust Model Fallback Loop**: Automatically falls back through `gemini-2.5-flash` ➔ `gemini-1.5-flash` ➔ `gemini-flash-latest` to ensure service continuity regardless of key restrictions.
- **Prisma ORM**: Interfaces SQLite locally and PostgreSQL in production for profile storage and claim lookup.

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # SQLite Schema (Local Development)
│   │   ├── schema.prod.prisma  # PostgreSQL Schema (Vercel Production)
│   │   └── seed.js             # Seeding claims and lab range markers (Vision & Blood)
│   ├── scripts/
│   │   └── prisma-generate.js  # Dedicated script to select correct database schema automatically
│   ├── src/
│   │   ├── config/             # Gemini connection and DB client configuration
│   │   ├── middleware/         # JWT authentication and user session filters
│   │   ├── modules/
│   │   │   ├── auth/           # Registration & Login endpoints
│   │   │   ├── ai/             # Prescription decoders and Gemini prompts logic
│   │   │   ├── health/         # Lab report routing and OpenAI fallback
│   │   │   └── misinformation/ # WhatsApp scanner debunking APIs
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # UI elements (Navbar, Layouts)
│   │   ├── pages/              # Dashboard, Scanner, Lab Analyzer, Decoder, Learning Hub
│   │   ├── store/              # Redux Store configuration
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── vercel.json                 # Core Vercel configuration with unified asset routing rules
└── README.md
```

---

## ⚡ Setup & Installation

### Option A: Local Run (SQLite)

#### Prerequisites
- Node.js (v18+)

#### Step 1: Initialize Database (Prisma)
Configure your `backend/.env` file. Then run:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

#### Step 2: Start Backend API
```bash
npm run dev
```
The Express server will launch at `http://localhost:5000`.

#### Step 3: Start Frontend Dev Server
```bash
cd ../frontend
npm install
npm run dev
```
The React app will launch at `http://localhost:3000`.

---

### Option B: Production Vercel Deployment

PresCrypto is pre-configured to build and deploy to Vercel without manual configuration.

1. **Prisma Generation**: The custom script `prisma-generate.js` automatically compiles the client targeting PostgreSQL on Vercel and SQLite locally.
2. **Environment Fallback**: If no database URL is present, the app automatically transitions to a robust mock database state, enabling seamless zero-config trials.
3. **Routing**: `vercel.json` maps frontend static assets (`/assets/*`), static files (`/background.png`), API calls (`/api/*`), and routes SPA requests back to `/index.html`.

#### Trigger Vercel Deploy:
```bash
npx vercel --prod --yes
```

---

## 🛡️ Strict Safety Guidelines & Blocking Rules
The system contains pre-compiled filters to block dangerous user prompts:
1. **Diagnosis Block**: Any queries containing words like "diagnose my chest pain", "do I have cancer", etc., are rejected. Response: *"Diagnosis Blocked: The platform cannot diagnose diseases. Please consult a qualified health professional."*
2. **Prescription Block**: Requests like "write me a prescription", "give me dosage for", etc., return: *"Prescription Blocked: The platform cannot prescribe medicines or direct dosages."*

---

## 📊 PowerPoint Presentation (PPT) Slide-by-Slide Outline

This section serves as a direct reference to construct presentation slides and prep speaker notes for the platform:

---

### 🛝 Slide 1: Title & Executive Summary
- **Title**: Prescrypto: AI-Powered Healthcare Literacy & Misinformation Shield
- **Subtitle**: Bridging the gap in prescription clarity, lab reports, and social media medical claims.
- **Key Message**: Empowering patients with clinical clarity while enforcing strict boundaries (No Doctor Replacement).
- **Slide Layout**:
  - Dark minimalist background with glowing indigo/cyan accents.
  - Left: Platform Name ("Prescrypto") and tagline.
  - Right: Large abstract health-shield icon.
- **⏱️ Timing**: `0:00 - 0:45` (45s)
- **🎤 Speaker Script**:
  > "Good morning, panel. Today, we are presenting Prescrypto. In an era where patients receive their lab reports online and read health tips on social media, healthcare literacy has become a major challenge. Prescrypto is a platform designed to bridge this gap, translating complex lab panels and prescriptions into clear insights, while acting as a shield against medical rumors—all while strictly enforcing clinical boundaries."

---

### 🛝 Slide 2: The Problem Statement
- **Medical Legibility**: illegible handwritten scripts cause dispensing errors and dose confusion.
- **Complex Lab Panels**: Blood and vision lab indicators use clinical units that leave patients confused or anxious.
- **WhatsApp Misinformation epidemic**: Fake home remedies, vaccine misinformation, and dangerous health rumors spread rapidly, leading to delayed medical care.
- **Slide Layout**:
  - Split grid: Left column (Patient confusion), Right column (Rumor spreading).
  - Highlighting negative impacts of incorrect self-treatment.
- **⏱️ Timing**: `0:45 - 1:30` (45s)
- **🎤 Speaker Script**:
  > "The problems in patient health literacy are threefold. First, handwritten medical orders or Latin abbreviations are unreadable for general patients. Second, lab reports show raw numbers with no context, leading to premature anxiety or wrong assumptions. Third, chat networks like WhatsApp are filled with viral home remedies claiming to cure severe chronic illnesses, causing patients to ignore professional medical advice."

---

### 🛝 Slide 3: The Prescrypto Ecosystem
- **Clinical AI Engine**: Interprets and clarifies doctor commands into patient-friendly directives.
- **Debunking Tool**: Analyzes social media messages, scores panic indicators, and shares citation-backed debunking cards in one click.
- **Slide Layout**:
  - A clean, centralized flowchart showing the three pillars: **Scan**, **Decode**, and **Verify**.
  - Glassmorphic panels with subtle glowing borders.
- **⏱️ Timing**: `1:30 - 2:15` (45s)
- **🎤 Speaker Script**:
  > "Prescrypto resolves this through three core modules. First, our Misinformation Scanner evaluates social media claims and drafts emoji-rich debunks referencing the WHO and CDC. Second, our Prescription Decoder parses doctor shorthand into a patient-friendly calendar, complete with side effect alerts. Third, our Lab Analyzer isolates vision parameters from blood panels, displaying results on clean range graphs so patients understand their scores at a glance."

---

### 🛝 Slide 4: WhatsApp Misinformation Scanner
- **Step 1**: Copy-paste a forwarded message claim.
- **Step 2**: The parser assesses the "Fear-Manipulation Meter" (analyzing stress/alarm language).
- **Step 3**: Generates a standard rebuttal template referencing the WHO, CDC, or NIH.
- **Step 4**: One-click sharing back to WhatsApp.
- **Slide Layout**:
  - Screenshot of the misinformation scan result panel (showing the Fear manipulation index meter and the rebuttal text).
- **⏱️ Timing**: `2:15 - 3:15` (60s)
- **🎤 Speaker Script**:
  > "Our flagship module is the WhatsApp Misinformation Scanner. When a user receives a suspicious message, they copy and paste the claim here. The system extracts the text, scores the claim's danger level, and runs it against a checklist of dangerous remedies. It then crafts a factual check citing official sources (WHO, CDC) and provides a simple 'Share' button to send it back to the chat group, stopping rumors at their source."

---

### 🛝 Slide 5: Prescription Decoder & Drug Database
- **Advanced Parsing**: Resolves doctor shorthand (Rx, bid, tid, hs) to explicit daily dosage logs.
- **RAG & Drug Database**: Cross-references medicines in our seeded directory.
- **openFDA API Integration**: Connects to FDA databases to extract official pregnancy categories and side effects.
- **Slide Layout**:
  - Before/After visual: A messy prescription decoded into a clean medication schedule list.
- **⏱️ Timing**: `3:15 - 4:00` (45s)
- **🎤 Speaker Script**:
  > "Next is our Prescription Decoder. AI interprets the prescription text, extracting drug names, dosage limits, and frequencies. Rather than leaving the patient to decode abbreviations, the system maps out an explicit daily calendar. Furthermore, we query the openFDA database in real-time to fetch official pregnancy warnings and side effects, helping prevent dangerous drug interactions."

---

### 🛝 Slide 6: Lab Report Analyzer (Isolating Blood vs. Vision)
- **Problem**: General AI prompts confuse eyesight metrics (IOP, visual acuity) with blood panel metrics (HbA1c, glucose).
- **Prescrypto Solution**: A tabbed category selector separating "Blood Biomarkers" and "Eye Sight / Vision".
- **Design Excellence**: Dynamically colors the UI, selects category-specific normal intervals, and draws a beautiful gradient zone map showing exact patient markers.
- **Slide Layout**:
  - Highlight of the category toggle ("🩸 Blood Biomarkers" vs "👁️ Eye Sight / Vision").
  - Visual of the multi-colored range indicator graph with a user value pin.
- **⏱️ Timing**: `4:00 - 5:00` (60s)
- **🎤 Speaker Script**:
  > "Our Lab Report Analyzer features complete category isolation. In general medical systems, vision metrics like visual acuity or intraocular pressure often get mapped incorrectly to blood panels. In Prescrypto, users select the appropriate mode. For Eye Sight/Vision, the system isolates inputs and plots visual acuity and tonometry results on a color-coded zone graph. The AI checks these against standard ophthalmic indicators, recommending specialist exams if values show critical elevations like risk of glaucoma."

---

### 🛝 Slide 7: Accessibility: Inclusivity by Design
- **Elderly Mode**: Scaled typography, simplified interfaces, and reduced distraction triggers.
- **Multilingual Support**: Supports 10 regional Indian languages with automatic locale translations.
- **Read Aloud TTS**: Streamlines text summaries to high-fidelity localized audio narration.
- **Slide Layout**:
  - Side-by-side view of normal dashboard vs. Simplified Elderly Mode with enlarged font.
- **⏱️ Timing**: `5:00 - 5:45` (45s)
- **🎤 Speaker Script**:
  > "Accessibility is key to health tech. We implemented 'Elderly Mode', which scales the text size to 17px+ and simplifies layouts. We also built a regional Text-to-Speech proxy, allowing the system to read out lab analyses and warnings. Combined with our 10-language translation support, this ensures that non-English speakers and older patients can understand their health data without barriers."

---

### 🛝 Slide 8: Technical Architecture & Security
- **Modern Frameworks**: React.js (Vite) + Node.js (Express) + SQLite/PostgreSQL (Prisma).
- **Local Fallback Design**: Works seamlessly using offline seed databases even when cloud connections fail.
- **Double Safety Shield**: Pre-compiled regex filters block diagnosis requests or prescription writing queries.
- **Slide Layout**:
  - List of safety rules and a QR code/link to the live app.
- **⏱️ Timing**: `5:45 - 6:30` (45s)
- **🎤 Speaker Script**:
  > "Finally, let's talk about safety. The platform has pre-compiled filters that reject direct diagnosis or prescription requests. Prescrypto is a learning and informational tool, not a doctor replacement. The system runs on Vercel, and our database fallbacks guarantee 100% uptime. We will now show a brief demo of the Lab Analyzer and WhatsApp Scanner. Thank you, and we welcome your questions."

---

## 💻 Live Demo Walkthrough Script

Follow these steps for a live demonstration of the platform:

### Step 1: The Misinformation Scanner
1. Open the **WhatsApp Scanner** tab (`/scanner`).
2. Paste the following claim in the text box:
   > *"URGENT WARNING: Drink boiled papaya leaf juice three times a day to cure cancer immediately. Doctors are hiding this cure!"*
3. Click **Scan Claims**.
4. Show the panel the **Fear-Manipulation Meter** score (which will evaluate to a high score due to keywords like "urgent warning" and "doctors are hiding").
5. Show the generated factual debunk message citing NIH/WHO guidelines.
6. Hover over the text to show how **Elderly Mode** reads the fact-check out loud.

### Step 2: The Lab Analyzer (Eye Sight / Vision Mode)
1. Navigate to the **Lab Analyzer** tab (`/lab`).
2. Point out the selector tabs and click on **Eye Sight / Vision**.
3. In the text area, paste:
   > *"Visual Acuity Right: 0.6, IOP Left: 25 mmHg, Visual Acuity Left: 0.8"*
4. Click **Analyze Report**.
5. Once loaded, scroll to show the panel:
   - The sky-blue top accent border.
   - The visual range visualizer bar showing **Visual Acuity (Right Eye)** at `0.6` marked as **LOW** and **Intraocular Pressure (Left Eye)** at `25 mmHg` marked as **ELEVATED**.
   - Show that no blood/glucose metrics leaked into the result card.

---

## ❓ Frequently Asked Questions (Q&A Prep)

#### Q1: What happens if the internet connection is lost or generative APIs fail?
> **Answer**: Prescrypto has robust fallback logic. If the local database is unreachable, it defaults to structured in-memory mock arrays. If the translation API fails, it falls back to the original text. The platform maintains core rendering capabilities under offline settings.

#### Q2: How does the system handle patient privacy and HIPAA compliance?
> **Answer**: All text analysis is processed dynamically and securely. Since screenshot uploads have been deprecated, patient exposure is minimized as users only input the forwarded medical rumors, maintaining complete anonymity. We do not store patient health identifiers.

#### Q3: How do you prevent the AI from generating incorrect range information?
> **Answer**: We enforce strict range comparisons. Instead of letting the AI guess reference values, the backend queries the database (or hardcoded fallbacks) for standard physiological boundaries. The AI's role is strictly confined to clarifying what those boundaries mean, rather than generating the boundaries themselves.