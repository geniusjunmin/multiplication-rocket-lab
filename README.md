# Multiplication Rocket Lab 🚀 (乘法火箭实验室 v4.2.1)

[![GitHub Pages Deployment](https://img.shields.io/badge/Live_Demo-GitHub_Pages-6366f1?style=for-the-badge&logo=github)](https://geniusjunmin.github.io/multiplication-rocket-lab/)
[![Automated Tests](https://img.shields.io/badge/Tests-72%2F72%20Passing-10b981?style=for-the-badge&logo=node.js)](https://geniusjunmin.github.io/multiplication-rocket-lab/test.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Multiplication Rocket Lab** is a gamified 3D math learning adventure designed for primary school children (UK National Curriculum & Worldwide, Ages 6-12). Combining times tables and division practice with procedural Three.js 3D rocket engineering and solar system exploration, it empowers children to level up as Space Commanders through daily space adventures.

---

## 🌟 What's New in Version 4.2.1 — Cinematic Integration & Spectacle Pass

### 1. 🪐 Interplanetary Mission Board & Story Objectives
- **18+ Interplanetary Missions**: Unique, story-driven missions across Earth Orbit, Moon, Mars, Jupiter, Saturn, and Deep Space (e.g. *Copernicus Crater Mineral Survey*, *Jezero Rover Deployment*, *Great Red Spot Radiation Flight*).
- **Non-Punitive Multi-Star Objectives**: Each mission features a primary clear star plus optional stars for accuracy (≥80%, ≥90%), combo streaks, or time limits.
- **Planetary Progression Gates**: Unlock deeper solar system destinations by leveling up your Commander Rank (`Lv.1 Earth/Moon`, `Lv.2 Mars`, `Lv.4 Jupiter`, `Lv.5 Saturn`, `Lv.8 Deep Space`).

### 2. 📅 Deterministic Offline Daily Missions & Weekly Solar Expedition
- **Daily Mission System**: Generates 3 unique daily challenges based on a deterministic seeded PRNG per date. Completing daily missions awards **+50 Bonus XP** once per day.
- **Weekly Solar Expedition**: Progress through the solar system along `Earth ➔ Moon ➔ Mars ➔ Jupiter ➔ Saturn`. Completing the full weekly route awards **+300 XP** and **+50 Research Points (RP)**.

### 3. ☄️ In-Flight Dynamic Space Events & Math Calculations
- **Mid-Flight Space Events**: Triggers dynamically during interplanetary transfer flight (e.g. *Asteroid Proximity Alert*, *Engine Core Overheat*, *Solar Flare Storm*, *Trajectory Correction*).
- **Pauses Flight Timeline**: Displays emergency telemetry alert, asks the child to solve quick math calculations, and grants instant bonus XP before resuming smooth flight.

### 4. 🛰️ Scientific Payloads & Custom Landing Animations
- **Custom Payloads**: Equip *Science Probe*, *Surface Rover*, *Cargo Module*, or *Solar Satellite*.
- **3D Animated Deployments**: Rovers roll out onto planetary surfaces, probes detach and scan target worlds, and satellites deploy solar panels in orbit.

### 5. ⚡ Safe vs Boost Route Decision
- **Safe Route**: Standard math facts, standard flight profile, 100% rewards.
- **Boost Route**: High-risk high-reward flight profile with harder facts, elevated space event frequency, **135% XP multiplier**, and **+10 RP bonus**.

### 6. 🏛️ Space Museum & 🚀 Rocket Garage
- **18 Space Museum Collectibles**: Collect unique planetary geological samples and historical artifacts (e.g. *Lunar Basalt Rock*, *Jezero Clay*, *Io Sulfur Crystal*, *Titan Methane Ice*).
- **3D Rocket Models & Skins**: Unlock and equip *SpaceX Starship*, *Falcon Heavy*, *Long March 5*, and *Cyber Starship* via star milestones, combo achievements, and destination visits.
- **Research Lab**: Spend Research Points (RP) to unlock cosmetic engine trails (*Standard*, *Plasma Blue*, *Solar Gold*, *Starlight Rainbow*).

### 7. 🛡️ Progression Integrity & Single-Settlement Architecture
- **Single Settlement Rule (`finalizeMissionRun`)**: Guaranteed to execute exactly once per mission run with idempotency cache (`_settledRuns`), permanently eliminating duplicate stat counting.
- **Immediate Settlement**: Saves mission rewards immediately upon touchdown/flyby, so rewards are never lost even if the child refreshes or navigates away.

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive 60-assertion test suite covering math generation, 3D landing physics, state machines, progression idempotency, daily missions, and unlock milestones:

```bash
# Run automated CLI test suite via Node.js
npm test
```

Or open `test.html` directly in any web browser for the **Interactive Visual Test Dashboard**.

---

## 🚀 Live Demo & Repository

- **Live Web Application**: [https://geniusjunmin.github.io/multiplication-rocket-lab/](https://geniusjunmin.github.io/multiplication-rocket-lab/)
- **Automated Test Dashboard**: [https://geniusjunmin.github.io/multiplication-rocket-lab/test.html](https://geniusjunmin.github.io/multiplication-rocket-lab/test.html)
- **GitHub Repository**: [https://github.com/geniusjunmin/multiplication-rocket-lab](https://github.com/geniusjunmin/multiplication-rocket-lab)

---

## 🔒 Privacy & Kid-Safe Statement

This application is strictly **offline-first and kid-safe**:
- ❌ No ads
- ❌ No user tracking or analytics
- ❌ No external cloud databases
- ✅ All learning progress is stored locally in the browser (`LocalStorage`).
