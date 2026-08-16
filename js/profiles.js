/**
 * Multiplication Rocket Lab - Multi-Player Profile & Storage Manager (js/profiles.js)
 */
class ProfileManager {
  constructor() {
    this.STORAGE_KEY = "multiplication_rocket_profiles_v2";
    this.profiles = [];
    this.activeProfileId = null;
    this.initStorage();
  }

  createDefaultProfile(name = "Alex", yearPreset = "year2") {
    const id = "p_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const preset = CONFIG.CURRICULUM_PRESETS[yearPreset] || CONFIG.CURRICULUM_PRESETS.year2;

    const facts = {};
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        const key = `${a}x${b}`;
        facts[key] = {
          id: key,
          factorA: a,
          factorB: b,
          answer: a * b,
          attempts: 0,
          firstTryCorrect: 0,
          wrongCount: 0,
          totalResponseTimeMs: 0,
          averageResponseTime: 0,
          lastAnsweredAt: null,
          lastWrongAt: null,
          streak: 0,
          masteryScore: 0,
          nextReviewAt: 0
        };
      }
    }

    return {
      id,
      schemaVersion: CONFIG.SCHEMA_VERSION || 2,
      name: this.sanitizeText(name),
      yearPreset,
      selectedTables: [...preset.tables],
      difficulty: "normal",
      timerSeconds: 8,
      reducedMotion: false,
      soundEnabled: true,
      
      score: 0,
      currentRocketModel: "classic",
      currentRocketTheme: "explorer",
      unlockedParts: [],
      installedParts: [],
      unlockedRocketModels: ["classic"],
      unlockedRocketThemes: ["explorer"],
      badges: [],
      
      gamesCompleted: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0,
      maxComboAllTime: 0,
      totalPracticeTimeMs: 0,
      
      facts,
      sessions: [],
      activeSession: null,
      createdTimestamp: Date.now()
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
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
          this.profiles = parsed.profiles.map(p => this.migrateProfile(p));
          this.activeProfileId = parsed.activeProfileId || this.profiles[0].id;
          return;
        }
      }
    } catch (e) {
      console.warn("ProfileManager: Failed to parse LocalStorage, creating default profile.", e);
    }

    // Fallback or legacy v1 data migration
    this.migrateV1Data();
  }

  migrateV1Data() {
    let legacyData = null;
    try {
      const rawV1 = localStorage.getItem("multiplication_rocket_save_v1");
      if (rawV1) legacyData = JSON.parse(rawV1);
    } catch (e) {}

    const defaultProfile = this.createDefaultProfile(
      legacyData ? legacyData.playerName : "Alex",
      "year2"
    );

    if (legacyData) {
      defaultProfile.score = legacyData.score || 0;
      defaultProfile.unlockedParts = legacyData.unlockedParts || [];
      defaultProfile.installedParts = legacyData.installedParts || [];
      defaultProfile.badges = legacyData.badges || [];
      defaultProfile.gamesCompleted = legacyData.gamesCompleted || 0;
      defaultProfile.totalCorrectAnswers = legacyData.totalCorrectAnswers || 0;
      defaultProfile.totalQuestionsAnswered = legacyData.totalQuestionsAnswered || 0;
      if (legacyData.selectedTables) defaultProfile.selectedTables = legacyData.selectedTables;
    }

    this.profiles = [defaultProfile];
    this.activeProfileId = defaultProfile.id;
    this.save();
  }

  migrateProfile(profile) {
    const defaultObj = this.createDefaultProfile(profile.name || "Alex", profile.yearPreset || "year2");
    const merged = { ...defaultObj, ...profile };
    merged.schemaVersion = CONFIG.SCHEMA_VERSION || 2;
    
    // Ensure all 144 facts exist
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        const key = `${a}x${b}`;
        if (!merged.facts[key]) {
          merged.facts[key] = defaultObj.facts[key];
        }
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
    let csv = "Fact ID,Factor A,Factor B,Answer,Attempts,First Try Correct,Wrong Count,Mastery Score (%),Avg Response Time (ms)\n";
    
    Object.values(active.facts).forEach(f => {
      csv += `"${f.id}",${f.factorA},${f.factorB},${f.answer},${f.attempts},${f.firstTryCorrect},${f.wrongCount},${f.masteryScore},${f.averageResponseTime}\n`;
    });
    return csv;
  }
}

window.profileManager = new ProfileManager();
