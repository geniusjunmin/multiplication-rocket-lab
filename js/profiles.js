/**
 * Multiplication Rocket Lab - Multi-Player Profile & Storage Manager (js/profiles.js)
 * Schema Version 3.0.0 (Fact Families, Mixed Operations, Interplanetary Destinations & Space Passport)
 */
class ProfileManager {
  constructor() {
    this.STORAGE_KEY = "multiplication_rocket_profiles_v3";
    this.profiles = [];
    this.activeProfileId = null;
    this.initStorage();
  }

  createDefaultProfile(name = "Alex", yearPreset = "year2") {
    const id = "p_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const preset = CONFIG.CURRICULUM_PRESETS[yearPreset] || CONFIG.CURRICULUM_PRESETS.year2;

    const facts = {};
    const factFamilies = {};

    for (let a = 1; a <= 20; a++) {
      for (let b = 1; b <= 20; b++) {
        const prod = a * b;
        const mulKey = `mul:${a}x${b}`;
        const divKeyA = `div:${prod}/${a}`;
        const divKeyB = `div:${prod}/${b}`;
        const famKey = `family:${Math.min(a, b)}:${Math.max(a, b)}`;

        facts[mulKey] = this.createEmptyFactRecord(mulKey, "multiply", a, b, prod);
        facts[divKeyA] = this.createEmptyFactRecord(divKeyA, "divide", prod, a, b);
        facts[divKeyB] = this.createEmptyFactRecord(divKeyB, "divide", prod, b, a);

        if (!factFamilies[famKey]) {
          factFamilies[famKey] = {
            id: famKey,
            factorA: Math.min(a, b),
            factorB: Math.max(a, b),
            product: prod,
            overallMastery: 0
          };
        }
      }
    }

    return {
      id,
      schemaVersion: CONFIG.SCHEMA_VERSION || 3,
      name: this.sanitizeText(name),
      yearPreset,
      selectedTables: [...preset.tables],
      selectedMathChallenge: "times12",
      selectedDestination: "moon",
      operations: ["multiply"],
      customRange: { factorAMin: 1, factorAMax: 12, factorBMin: 1, factorBMax: 12 },
      
      difficulty: "normal",
      timerSeconds: 8,
      timerEnabled: false,
      reducedMotion: false,
      soundEnabled: true,
      graphicsQuality: "auto",
      
      score: 0,
      currentRocketModel: "classic",
      currentRocketTheme: "explorer",
      unlockedParts: [],
      installedParts: [],
      unlockedRocketModels: ["classic"],
      unlockedRocketThemes: ["explorer"],
      badges: [],

      destinationsVisited: { earthOrbit: true },
      missionHistory: [],

      gamesCompleted: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0,
      totalMultiplicationAnswered: 0,
      totalMultiplicationCorrect: 0,
      totalDivisionAnswered: 0,
      totalDivisionCorrect: 0,
      maxComboAllTime: 0,
      totalPracticeTimeMs: 0,
      
      facts,
      factFamilies,
      createdTimestamp: Date.now()
    };
  }

  createEmptyFactRecord(id, operation, opA, opB, ans) {
    return {
      id,
      operation, // "multiply" | "divide"
      operandA: opA,
      operandB: opB,
      answer: ans,
      attempts: 0,
      firstTryCorrect: 0,
      wrongCount: 0,
      averageResponseTime: 0,
      lastAnsweredAt: null,
      lastWrongAt: null,
      streak: 0,
      masteryScore: 0
    };
  }

  sanitizeText(str) {
    if (!str) return "Child Player";
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML.slice(0, 24);
  }

  initStorage() {
    try {
      const rawV3 = localStorage.getItem(this.STORAGE_KEY);
      if (rawV3) {
        const parsed = JSON.parse(rawV3);
        if (parsed && Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
          this.profiles = parsed.profiles.map(p => this.migrateProfile(p));
          this.activeProfileId = parsed.activeProfileId || this.profiles[0].id;
          return;
        }
      }
    } catch (e) {
      console.warn("ProfileManager: Failed to parse V3 LocalStorage, checking V2 migration.", e);
    }

    this.migrateV2Data();
  }

  migrateV2Data() {
    let v2Data = null;
    try {
      const rawV2 = localStorage.getItem("multiplication_rocket_profiles_v2");
      if (rawV2) v2Data = JSON.parse(rawV2);
    } catch (e) {}

    if (v2Data && Array.isArray(v2Data.profiles) && v2Data.profiles.length > 0) {
      this.profiles = v2Data.profiles.map(p => this.migrateProfile(p));
      this.activeProfileId = v2Data.activeProfileId || this.profiles[0].id;
    } else {
      const defaultProfile = this.createDefaultProfile("Alex", "year2");
      this.profiles = [defaultProfile];
      this.activeProfileId = defaultProfile.id;
    }
    this.save();
  }

  migrateProfile(profile) {
    const defaultObj = this.createDefaultProfile(profile.name || "Alex", profile.yearPreset || "year2");
    const merged = { ...defaultObj, ...profile };
    merged.schemaVersion = CONFIG.SCHEMA_VERSION || 3;

    // Migrate old keys like "7x8" to "mul:7x8"
    if (profile.facts) {
      Object.keys(profile.facts).forEach(k => {
        if (!k.includes(":")) {
          const newKey = `mul:${k}`;
          merged.facts[newKey] = {
            ...this.createEmptyFactRecord(newKey, "multiply", profile.facts[k].factorA || 1, profile.facts[k].factorB || 1, profile.facts[k].answer || 1),
            ...profile.facts[k]
          };
          merged.facts[newKey].id = newKey;
          merged.facts[newKey].operation = "multiply";
        }
      });
    }

    // Ensure all 1~20 facts exist
    for (let a = 1; a <= 20; a++) {
      for (let b = 1; b <= 20; b++) {
        const prod = a * b;
        const mulKey = `mul:${a}x${b}`;
        const divKeyA = `div:${prod}/${a}`;
        const divKeyB = `div:${prod}/${b}`;
        const famKey = `family:${Math.min(a, b)}:${Math.max(a, b)}`;

        if (!merged.facts[mulKey]) merged.facts[mulKey] = defaultObj.facts[mulKey];
        if (!merged.facts[divKeyA]) merged.facts[divKeyA] = defaultObj.facts[divKeyA];
        if (!merged.facts[divKeyB]) merged.facts[divKeyB] = defaultObj.facts[divKeyB];
        if (!merged.factFamilies[famKey]) merged.factFamilies[famKey] = defaultObj.factFamilies[famKey];
      }
    }

    return merged;
  }

  save() {
    try {
      const payload = {
        profiles: this.profiles,
        activeProfileId: this.activeProfileId
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("ProfileManager: Save failed:", e);
    }
  }

  getActiveProfile() {
    let active = this.profiles.find(p => p.id === this.activeProfileId);
    if (!active) {
      if (this.profiles.length === 0) {
        active = this.createDefaultProfile("Alex", "year2");
        this.profiles.push(active);
      } else {
        active = this.profiles[0];
      }
      this.activeProfileId = active.id;
      this.save();
    }
    return active;
  }

  addProfile(name, yearPreset = "year2") {
    const profile = this.createDefaultProfile(name, yearPreset);
    this.profiles.push(profile);
    this.activeProfileId = profile.id;
    this.save();
    return profile;
  }

  switchProfile(id) {
    const exists = this.profiles.find(p => p.id === id);
    if (exists) {
      this.activeProfileId = id;
      this.save();
      return true;
    }
    return false;
  }

  deleteProfile(id) {
    if (this.profiles.length <= 1) return false;
    this.profiles = this.profiles.filter(p => p.id !== id);
    if (this.activeProfileId === id) {
      this.activeProfileId = this.profiles[0].id;
    }
    this.save();
    return true;
  }

  updateActiveProfile(partialObj) {
    const active = this.getActiveProfile();
    Object.assign(active, partialObj);
    this.save();
  }

  recordDestinationVisited(destId) {
    const active = this.getActiveProfile();
    if (!active.destinationsVisited) active.destinationsVisited = {};
    active.destinationsVisited[destId] = true;
    this.save();
  }

  exportDataJson() {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      schemaVersion: CONFIG.SCHEMA_VERSION,
      profiles: this.profiles,
      activeProfileId: this.activeProfileId
    };
    return JSON.stringify(payload, null, 2);
  }

  importDataJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
        throw new Error("Invalid JSON format: missing profiles array.");
      }

      this.profiles = parsed.profiles.map(p => this.migrateProfile(p));
      this.activeProfileId = parsed.activeProfileId || this.profiles[0].id;
      this.save();
      return { success: true, message: "Import successful!" };
    } catch (e) {
      return { success: false, message: e.message || "Failed to import JSON data." };
    }
  }

  exportReportCsv() {
    const active = this.getActiveProfile();
    let csv = "Fact ID,Operation,Operand A,Operand B,Answer,Attempts,First Try Correct,Wrong Count,Mastery Score (%),Avg Response Time (ms)\n";
    
    Object.values(active.facts).forEach(f => {
      csv += `"${f.id}",${f.operation},${f.operandA},${f.operandB},${f.answer},${f.attempts},${f.firstTryCorrect},${f.wrongCount},${f.masteryScore},${f.averageResponseTime}\n`;
    });
    return csv;
  }
}

window.profileManager = new ProfileManager();
