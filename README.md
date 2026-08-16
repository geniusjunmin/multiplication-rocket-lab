# Multiplication Rocket Lab 🚀 (乘法火箭实验室 v2.0.0)

[![GitHub Pages Deployment](https://img.shields.io/badge/Live_Demo-GitHub_Pages-6366f1?style=for-the-badge&logo=github)](https.geniusjunmin.github.io/multiplication-rocket-lab/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Multiplication Rocket Lab** is a production-grade, gamified 3D math learning application designed specifically for primary school children in the **UK National Curriculum (Year 2 to Year 4, Ages 6-9)**. Combining times table practice with procedural Three.js 3D rocket construction, space launches, and an adaptive spaced-repetition learning engine, it inspires children to master multiplication facts through positive reinforcement without frustration.

---

## 🌟 Key Features & Improvements in v2.0.0

### 1. 🇬🇧 UK National Curriculum Presets & 1×1 to 12×12 Multiplication
- **Year 2 (Ages 6-7)**: Focus on ×2, ×5, ×10 tables.
- **Year 3 (Ages 7-8)**: Master ×3, ×4, ×8 & review ×2, ×5, ×10.
- **Year 4 (Ages 8-9)**: Full 1×1 to 12×12 multiplication tables.
- **Custom Preset**: Select any custom combination of 1 to 12 tables.

### 2. 🧠 Fact-Level Adaptive Learning Engine
- Tracks mastery for all **144 individual multiplication facts** (`1x1` to `12x12`).
- Computes fact-level **Mastery Scores (0-100%)** based on first-try accuracy, streaks, response speed, and recency.
- Spaced-repetition priority weighting ensures weak facts appear more frequently while preventing repetitive consecutive prompts.
- **Smart Strategy Hints**: Fact-tailored hints (e.g. ×2 double, ×5 count, ×9 = 10-1, ×10 add 0, near known facts like 6×7=42 → 7×7=42+7).

### 3. 👨‍🚀 Multi-Child Player Profiles
- Local profile manager ("Who's playing? 🚀 Alex | Amy | ➕ Add Player").
- Independent stats, year presets, unlocked badges, 3D rockets, and settings per child.
- **Zero Internet / Zero Server**: All data stays 100% locally on the device (privacy guaranteed).

### 4. 📊 Comprehensive Parent Dashboard & 12×12 Heatmap Matrix
- **Today's Stats**: Answered count, first-try accuracy %, avg response speed (s), highest streak.
- **Lifetime Stats**: Total answered, practice time, space launches, overall accuracy.
- **12×12 Fact Matrix**: Interactive color-coded heatmap grid representing all 144 facts. Click any cell to inspect attempts, accuracy, speed, and last practice date.
- **Data Portability**: Export/Import JSON data and Export CSV summary report.

### 5. 🌐 Internationalization (Bilingual English & Chinese)
- Default **UK English (`en`)** experience for UK students.
- One-click toggle to **Chinese (`zh`)** for bilingual households.

### 6. 🚀 5 Procedural 3D Rocket Models & 5 Themes
- 🚀 **Classic Explorer**
- 🛰️ **SpaceX Starship** (Stainless steel, aero flaps, Super Heavy booster base)
- ⚡ **Falcon Heavy** (Triple-core booster, grid fins)
- 🇨🇳 **Long March 5** (5m core & strap-on boosters)
- 🌌 **Cyber Starship** (Neon energy rings, ring engine)

### 7. 📱 PWA & Offline Tablet Play
- Includes `manifest.webmanifest` and Service Worker (`sw.js`).
- Full support for iPad, iPhone, Android tablets, and Desktop (touch targets ≥ 48px, 100dvh layout, reduced motion support).

---

## 🧪 Automated Testing Suite

Comprehensive automated test runner with **24 unit & integration assertions**:

```bash
# Run CLI test suite via Node.js
npm test
```

Or open `test.html` in your browser for the **Interactive Web E2E Dashboard**.

---

## 🚀 Live Demo & Installation

- **Live Web App**: [https://geniusjunmin.github.io/multiplication-rocket-lab/](https://geniusjunmin.github.io/multiplication-rocket-lab/)
- **Automated Test Dashboard**: [https://geniusjunmin.github.io/multiplication-rocket-lab/test.html](https://geniusjunmin.github.io/multiplication-rocket-lab/test.html)
- **GitHub Repository**: [https://github.com/geniusjunmin/multiplication-rocket-lab](https://github.com/geniusjunmin/multiplication-rocket-lab)

---

## 🔒 Privacy & Safety Statement

This game contains **no ads, no tracking analytics, no user accounts, and no backend servers**. All data stays on the local device browser.
