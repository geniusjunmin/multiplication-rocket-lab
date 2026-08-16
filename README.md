# Multiplication Rocket Lab 🚀 (乘法火箭实验室 v3.0.0)

[![GitHub Pages Deployment](https://img.shields.io/badge/Live_Demo-GitHub_Pages-6366f1?style=for-the-badge&logo=github)](https.geniusjunmin.github.io/multiplication-rocket-lab/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Multiplication Rocket Lab** is a production-grade, gamified 3D math learning application designed for primary school children (UK National Curriculum & Worldwide, Ages 6-12). Combining multiplication & division practice with procedural Three.js 3D rocket construction and interplanetary space exploration, it inspires children to accomplish genuine interstellar space missions through positive reinforcement.

---

## 🌟 What's New in Version 3.0.0

### 1. 🧮 Flexible Math Challenge System & Free Presets
Decouples **Learning Content** (what questions are asked) from **Challenge Difficulty** (how you answer: Easy choices/hints, Normal keypad, Hard timer).
- **Curriculum Mode**: UK Year 2 (×2, ×5, ×10), Year 3 (×3, ×4, ×8), Year 4 (×1~×12).
- **Free Challenge Mode**:
  - ⭐ **Starter (9×9)**: 1×1 to 9×9 multiplication.
  - 🚀 **Standard (12×12)**: 1×1 to 12×12 multiplication.
  - 🔥 **Advanced (20×20)**: High-range facts (e.g. 14×6, 17×8, 12×16, 19×7).
  - ⚡ **Multiply & Divide (× & ÷)**: Mixed multiplication and exact integer division (e.g. 7×8=56, 56÷7=8, 56÷8=7).
  - 🧠 **Expert (20×20 × & ÷)**: High-level 20×20 multiplication and division.
  - 🛠️ **Custom Range**: Custom Factor A (1-30), Factor B (1-20), and Operations.

### 2. 👨‍👩‍👧 Fact Family Engine & Division Mastery
- **Fact Family Linkage**: Unifies `7×8=56`, `8×7=56`, `56÷7=8`, `56÷8=7` into a conceptual **Fact Family key (`family:7:8`)**.
- **Operation-Specific Statistics**: Independently tracks Multiplication Mastery % vs Division Mastery % in the Parent Dashboard.
- **Division Smart Hints**: Reverse multiplication hints (e.g. `56 ÷ 7 = ?` → `Think: 7 × ? = 56`).
- **Easy Mode Visual Helpers**: Visual arrays for multiplication and grouped dot objects for division.

### 3. 🪐 6 Interplanetary Destinations & Space Passport
Decouples Math Challenge from Space Destinations so children can pair any math level with any space mission!
- 🌍 **Earth Orbit**: Low Earth Orbit station mission (400 km).
- 🌙 **Moon Base**: Lunar orbit and crater surface approach.
- 🔴 **Mars Colony**: Red Planet atmospheric descent and canyon approach.
- 🪐 **Jupiter Flyby**: Gas giant flyby with Great Red Spot & moons.
- 🪐 **Saturn Ring Explorer**: Traversal of Saturn's magnificent 3D translucent rings.
- 🌌 **Deep Space Explorer**: Journey beyond the Solar System into interstellar nebulae.
- 🎫 **Space Passport Stamps**: Interactive passport tracking completed planetary visits (`🌍 ✓`, `🌙 ✓`, `🔴 ✓`, `🪐 ✓`, `🌌 ✓`).

### 4. 🎬 Cinematic Launch & Arrival Sequence
- **Multi-Layer Engine Flame**: Inner white/yellow core, main orange flame, outer red aura, pointlight glow, exhaust particles, smoke pool, shock diamonds.
- **Cinematic Camera Director**: 9 camera angles with smooth interpolation, altitude cloud layer, star field parallax, and atmosphere transition (Blue ➔ Dark Blue ➔ Deep Space Black).
- **Planet Arrival Scenes**: Destination-specific 3D scenes (Saturn 3D Rings, Mars Red Canyons, Cratered Moon, Jupiter Gas Bands).

---

## 🧪 Automated Testing Suite

Comprehensive automated test runner with **25 unit & integration assertions**:

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
