/**
 * Multiplication Rocket Lab - Progression, Daily Expeditions & Reward Engine (js/progression.js)
 * Version 4.1.0 — Gameplay Integration & Progression Integrity
 * Single Source of Truth for XP, Stars, RP, Collectibles, Unlocks, Daily Missions, Weekly Expeditions,
 * and Idempotent Mission Settlement.
 */
class ProgressionManager {
  constructor() {
    this.ranks = CONFIG.COMMANDER_RANKS;
  }

  getProfile() {
    if (window.profileManager) {
      return window.profileManager.getActiveProfile();
    }
    return null;
  }

  saveProfile() {
    if (window.profileManager) {
      window.profileManager.save();
    }
  }

  /**
   * Get Commander Level Info from total XP
   */
  getLevelInfo(totalXP = 0) {
    let currentLevel = 1;
    let currentRank = this.ranks[0];

    for (let i = this.ranks.length - 1; i >= 0; i--) {
      if (totalXP >= this.ranks[i].xpRequired) {
        currentLevel = this.ranks[i].level;
        currentRank = this.ranks[i];
        break;
      }
    }

    const nextRank = this.ranks.find(r => r.level === currentLevel + 1);
    const xpForCurrent = currentRank.xpRequired;
    const xpForNext = nextRank ? nextRank.xpRequired : currentRank.xpRequired;
    const xpInLevel = totalXP - xpForCurrent;
    const xpNeededForLevel = nextRank ? (xpForNext - xpForCurrent) : 1;
    const progressPercent = nextRank ? Math.min(100, Math.round((xpInLevel / xpNeededForLevel) * 100)) : 100;

    return {
      level: currentLevel,
      rankTitleEn: currentRank.titleEn,
      rankTitleZh: currentRank.titleZh,
      rankIcon: currentRank.icon,
      xpTotal: totalXP,
      xpInLevel,
      xpNeededForLevel,
      progressPercent,
      isMaxRank: !nextRank,
      nextLevelXP: nextRank ? xpForNext : null
    };
  }

  /**
   * Check if a planetary destination is unlocked based on Commander Level
   */
  isPlanetUnlocked(destId) {
    const profile = this.getProfile();
    if (!profile) return true;

    const levelReq = (CONFIG.DESTINATION_LEVEL_REQUIREMENTS && CONFIG.DESTINATION_LEVEL_REQUIREMENTS[destId]) || 1;
    const xp = profile.progression ? (profile.progression.xp || 0) : 0;
    const currentLevel = this.getLevelInfo(xp).level;
    return currentLevel >= levelReq;
  }

  /**
   * Add XP to active profile with level-up detection
   */
  addXP(amount, source = "") {
    const profile = this.getProfile();
    if (!profile) return { levelUp: false, newXP: 0, newLevel: 1 };

    if (!profile.progression) {
      profile.progression = { commanderLevel: 1, xp: 0, totalStars: 0, researchPoints: 0 };
    }

    const prevXP = profile.progression.xp || 0;
    const prevLevelInfo = this.getLevelInfo(prevXP);

    const newXP = prevXP + Math.max(0, amount);
    profile.progression.xp = newXP;

    const newLevelInfo = this.getLevelInfo(newXP);
    profile.progression.commanderLevel = newLevelInfo.level;

    const levelUp = newLevelInfo.level > prevLevelInfo.level;
    if (levelUp && window.audioManager) {
      window.audioManager.playLevelUp();
    }

    this.saveProfile();
    this.evaluateUnlocks();

    return {
      levelUp,
      prevLevel: prevLevelInfo.level,
      newLevel: newLevelInfo.level,
      newXP,
      amountAdded: amount,
      source
    };
  }

  /**
   * Add Mission Stars (Non-consumable badge currency)
   */
  addStars(amount) {
    const profile = this.getProfile();
    if (!profile) return 0;
    if (!profile.progression) profile.progression = { commanderLevel: 1, xp: 0, totalStars: 0, researchPoints: 0 };

    profile.progression.totalStars = (profile.progression.totalStars || 0) + Math.max(0, amount);
    this.saveProfile();
    this.evaluateUnlocks();
    return profile.progression.totalStars;
  }

  /**
   * Award Research Points (Consumable currency for cosmetic visual unlocks)
   */
  addResearchPoints(amount) {
    const profile = this.getProfile();
    if (!profile) return 0;
    if (!profile.progression) profile.progression = { commanderLevel: 1, xp: 0, totalStars: 0, researchPoints: 0 };

    profile.progression.researchPoints = (profile.progression.researchPoints || 0) + Math.max(0, amount);
    this.saveProfile();
    return profile.progression.researchPoints;
  }

  /**
   * Unlock Space Museum Collectible Item
   */
  unlockCollectible(collectibleId) {
    const profile = this.getProfile();
    if (!profile || !collectibleId) return false;
    if (!Array.isArray(profile.collectibles)) profile.collectibles = [];

    if (!profile.collectibles.includes(collectibleId)) {
      profile.collectibles.push(collectibleId);
      this.saveProfile();
      this.evaluateUnlocks();
      return true;
    }
    return false;
  }

  /**
   * SINGLE SOURCE OF TRUTH: Finalize Mission Run (Idempotent Settlement)
   * Guaranteed to execute exactly ONCE per mission run.
   */
  finalizeMissionRun(options = {}) {
    const profile = this.getProfile();
    if (!profile) return null;

    const missionRunId = options.missionRunId || `${profile.id || 'default'}_${options.missionId || 'mission'}_${Date.now()}`;
    
    // 1. Idempotency Check: Return previously settled result if already processed
    if (!profile._settledRuns) profile._settledRuns = {};
    if (profile._settledRuns[missionRunId]) {
      return profile._settledRuns[missionRunId];
    }

    const missionId = options.missionId || "moon_crater_survey";
    const mission = CONFIG.MISSION_DEFINITIONS[missionId] || CONFIG.MISSION_DEFINITIONS.moon_crater_survey;
    const sessionStats = options.sessionStats || {};
    const objectivesStatus = options.objectivesStatus || [];
    const routeOption = options.routeOption || "safe";
    const routeConfig = options.routeConfig || CONFIG.ROUTE_CONFIGS[routeOption] || CONFIG.ROUTE_CONFIGS.safe;
    const gameMode = options.gameMode || "normal";
    const dailyMissionContext = options.dailyMissionContext || null;

    if (!profile.missionRecords) profile.missionRecords = {};

    const isFirstClear = !profile.missionRecords[missionId] || profile.missionRecords[missionId].completedCount === 0;
    const prevRecord = profile.missionRecords[missionId] || {
      completedCount: 0,
      bestStars: 0,
      bestFirstTryAccuracy: 0,
      bestScore: 0,
      bestCombo: 0,
      bestGrade: "C"
    };

    // Calculate Stars Earned (1 base star + bonus objective stars)
    let starsEarned = 1;
    objectivesStatus.forEach(obj => {
      if (obj.completed && obj.id !== "primary") {
        starsEarned += (obj.stars || 1);
      }
    });
    starsEarned = Math.min(3, Math.max(1, starsEarned));

    const firstTryAcc = sessionStats.firstTryAccuracy !== undefined ? sessionStats.firstTryAccuracy : 100;
    const score = sessionStats.score || 0;
    const maxCombo = sessionStats.maxCombo || 0;

    // Calculate Grade: S (≥90% first-try + all objectives), A (≥80%), B (≥65%), C (completed)
    let grade = "C";
    const allObjectivesMet = objectivesStatus.length > 0 && objectivesStatus.every(o => o.completed);
    if (firstTryAcc >= 90 && allObjectivesMet) grade = "S";
    else if (firstTryAcc >= 80) grade = "A";
    else if (firstTryAcc >= 65) grade = "B";

    // Rewards Calculation with Route Multipliers
    const baseXP = mission.reward.xp || 100;
    const baseRP = mission.reward.researchPoints || 10;
    const routeMultiplier = routeConfig.rewardMultiplier || 1.0;

    let xpEarned = Math.round(baseXP * routeMultiplier);
    let rpEarned = Math.round(baseRP * routeMultiplier);

    // Route flat bonuses
    if (routeConfig.bonusXP) xpEarned += routeConfig.bonusXP;
    if (routeConfig.bonusRP) rpEarned += routeConfig.bonusRP;

    // In-Flight Event Bonus XP
    if (sessionStats.eventBonusXP) {
      xpEarned += sessionStats.eventBonusXP;
    }

    let collectibleUnlocked = false;

    if (isFirstClear) {
      if (mission.reward.firstClearBonus) {
        xpEarned += (mission.reward.firstClearBonus.xp || 0);
        rpEarned += (mission.reward.firstClearBonus.researchPoints || 0);
      }
      if (mission.reward.collectible) {
        collectibleUnlocked = this.unlockCollectible(mission.reward.collectible);
      }
    }

    // Record destination visit in passport
    if (window.profileManager) {
      window.profileManager.recordDestinationVisited(mission.destination);
    }

    // Daily Mission Handling (+50 XP for 1st daily clear of that task)
    let dailyBonusAwarded = 0;
    const todayStr = this.getTodayDateString();
    if (!profile.dailyMissionState || profile.dailyMissionState.date !== todayStr) {
      profile.dailyMissionState = { date: todayStr, completedIds: [] };
    }

    const isDailyRun = (gameMode === "daily_mission") || (dailyMissionContext && dailyMissionContext.missionId === missionId);
    if (isDailyRun || this.isTodayDailyMission(missionId)) {
      if (!profile.dailyMissionState.completedIds.includes(missionId)) {
        profile.dailyMissionState.completedIds.push(missionId);
        dailyBonusAwarded = 50;
        xpEarned += 50;
      }
    }

    // Stars economy update (awards delta for improvement)
    const starImprovement = Math.max(0, starsEarned - prevRecord.bestStars);
    if (starImprovement > 0) {
      this.addStars(starImprovement);
    }

    // Grant XP and RP
    this.addXP(xpEarned, `Mission: ${mission.titleEn}`);
    this.addResearchPoints(rpEarned);

    // Update Mission Record
    profile.missionRecords[missionId] = {
      missionId,
      destination: mission.destination,
      completedCount: prevRecord.completedCount + 1,
      bestStars: Math.max(prevRecord.bestStars, starsEarned),
      bestFirstTryAccuracy: Math.max(prevRecord.bestFirstTryAccuracy, firstTryAcc),
      bestScore: Math.max(prevRecord.bestScore, score),
      bestCombo: Math.max(prevRecord.bestCombo, maxCombo),
      bestGrade: this.compareGrades(grade, prevRecord.bestGrade) > 0 ? grade : prevRecord.bestGrade,
      lastPlayedAt: Date.now()
    };

    // Update Global Profile Totals (ONLY ONCE HERE!)
    profile.gamesCompleted = (profile.gamesCompleted || 0) + 1;
    if (maxCombo > (profile.maxComboAllTime || 0)) {
      profile.maxComboAllTime = maxCombo;
    }

    // Append to Mission History (Capped at 100 entries)
    if (!Array.isArray(profile.missionHistory)) profile.missionHistory = [];
    profile.missionHistory.unshift({
      missionRunId,
      missionId,
      destination: mission.destination,
      titleEn: mission.titleEn,
      titleZh: mission.titleZh,
      completedAt: Date.now(),
      firstTryAccuracy: firstTryAcc,
      questionsPresented: sessionStats.questionsPresented || 15,
      wrongAttempts: sessionStats.wrongAttempts || 0,
      maxCombo,
      stars: starsEarned,
      grade,
      route: routeOption,
      payload: options.selectedPayload || "probe",
      xpEarned,
      rpEarned,
      dailyBonusAwarded,
      collectibleEarned: collectibleUnlocked ? mission.reward.collectible : null
    });
    if (profile.missionHistory.length > 100) {
      profile.missionHistory = profile.missionHistory.slice(0, 100);
    }

    // Update Weekly Expedition
    this.updateWeeklyExpedition(mission.destination);

    // Evaluate Unlocks (returns any new models/themes)
    const newUnlocks = this.evaluateUnlocks();

    this.saveProfile();

    const settlementResult = {
      missionRunId,
      mission,
      isFirstClear,
      starsEarned,
      grade,
      firstTryAccuracy: firstTryAcc,
      xpEarned,
      rpEarned,
      dailyBonusAwarded,
      collectibleUnlocked,
      collectibleId: mission.reward.collectible,
      newUnlocks,
      routeOption,
      selectedPayload: options.selectedPayload || "probe",
      settledAt: Date.now()
    };

    // Cache settlement to guarantee idempotency
    profile._settledRuns[missionRunId] = settlementResult;
    const settledKeys = Object.keys(profile._settledRuns);
    if (settledKeys.length > 50) {
      delete profile._settledRuns[settledKeys[0]];
    }
    this.saveProfile();

    return settlementResult;
  }

  // Backward compatibility alias for tests
  recordMissionComplete(missionId, sessionStats = {}, objectivesStatus = []) {
    return this.finalizeMissionRun({
      missionId,
      sessionStats,
      objectivesStatus,
      routeOption: "safe"
    });
  }

  compareGrades(g1, g2) {
    const score = { "S": 4, "A": 3, "B": 2, "C": 1 };
    return (score[g1] || 0) - (score[g2] || 0);
  }

  /**
   * Deterministic Seeded Random Number Generator (PRNG)
   */
  seededRandom(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  }

  getTodayDateString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  isTodayDailyMission(missionId) {
    const daily = this.getDailyMissions();
    return daily.some(m => m.id === missionId);
  }

  /**
   * Offline Deterministic Daily Missions Generator
   */
  getDailyMissions(dateStr = null, profileId = null) {
    const profile = this.getProfile();
    const todayStr = dateStr || this.getTodayDateString();
    const pId = profileId || (profile ? profile.id : "default");

    // Maintain daily mission completion state
    if (profile) {
      if (!profile.dailyMissionState || profile.dailyMissionState.date !== todayStr) {
        profile.dailyMissionState = { date: todayStr, completedIds: [] };
        this.saveProfile();
      }
    }

    const completedIds = (profile && profile.dailyMissionState && profile.dailyMissionState.date === todayStr)
      ? (profile.dailyMissionState.completedIds || [])
      : [];

    const allMissions = Object.values(CONFIG.MISSION_DEFINITIONS);
    const dailyMissions = [];

    // Deterministic selection of 3 unique missions
    const count = 3;
    const usedIndices = new Set();

    for (let slot = 0; slot < count; slot++) {
      let attempt = 0;
      let chosen = null;

      while (attempt < 50) {
        const seed = `${pId}_daily_${todayStr}_slot_${slot}_att_${attempt}`;
        const rnd = this.seededRandom(seed);
        const idx = Math.floor(rnd * allMissions.length);

        if (!usedIndices.has(idx)) {
          usedIndices.add(idx);
          chosen = allMissions[idx];
          break;
        }
        attempt++;
      }

      if (!chosen) chosen = allMissions[slot % allMissions.length];

      dailyMissions.push({
        ...chosen,
        dailySlot: slot + 1,
        dailyBonusXP: 50,
        isCompleted: completedIds.includes(chosen.id)
      });
    }

    return dailyMissions;
  }

  /**
   * Weekly Expedition State & Advancement
   */
  getWeeklyExpeditionState() {
    const profile = this.getProfile();
    if (!profile) return { weekId: "2026-W34", progress: 0, isCompleted: false, claimed: false, completedDestinations: [] };

    const currentWeekId = this.getCurrentWeekId();
    if (!profile.weeklyExpedition || profile.weeklyExpedition.weekId !== currentWeekId) {
      profile.weeklyExpedition = {
        weekId: currentWeekId,
        completedDestinations: [],
        claimed: false
      };
      this.saveProfile();
    }

    const completedDests = profile.weeklyExpedition.completedDestinations || [];
    const totalRequired = CONFIG.WEEKLY_EXPEDITION_DEFINITIONS.route.length;
    const progress = Math.min(totalRequired, completedDests.length);
    const isCompleted = progress >= totalRequired;

    return {
      weekId: currentWeekId,
      completedDestinations: completedDests,
      route: CONFIG.WEEKLY_EXPEDITION_DEFINITIONS.route,
      progress,
      totalRequired,
      isCompleted,
      claimed: Boolean(profile.weeklyExpedition.claimed)
    };
  }

  getCurrentWeekId() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  updateWeeklyExpedition(destId) {
    const profile = this.getProfile();
    if (!profile || !destId) return;

    const currentWeekId = this.getCurrentWeekId();
    if (!profile.weeklyExpedition || profile.weeklyExpedition.weekId !== currentWeekId) {
      profile.weeklyExpedition = { weekId: currentWeekId, completedDestinations: [], claimed: false };
    }

    const route = CONFIG.WEEKLY_EXPEDITION_DEFINITIONS.route;
    if (route.includes(destId) && !profile.weeklyExpedition.completedDestinations.includes(destId)) {
      profile.weeklyExpedition.completedDestinations.push(destId);
      this.saveProfile();
    }
  }

  claimWeeklyExpeditionReward() {
    const state = this.getWeeklyExpeditionState();
    if (!state.isCompleted || state.claimed) return { success: false };

    const profile = this.getProfile();
    if (!profile) return { success: false };

    const reward = CONFIG.WEEKLY_EXPEDITION_DEFINITIONS.reward;
    this.addXP(reward.xp || 300, "Weekly Expedition Master");
    this.addResearchPoints(reward.researchPoints || 50);

    profile.weeklyExpedition.claimed = true;
    this.saveProfile();

    return {
      success: true,
      reward
    };
  }

  /**
   * Unlock Cosmetic Engine Trails using Research Points
   */
  unlockResearch(trailId) {
    const profile = this.getProfile();
    if (!profile || !trailId) return { success: false, reason: "invalid" };

    if (!Array.isArray(profile.unlockedResearch)) {
      profile.unlockedResearch = ["trail_standard"];
    }

    if (profile.unlockedResearch.includes(trailId)) {
      return { success: true, alreadyUnlocked: true };
    }

    const trailDef = CONFIG.RESEARCH_TREE_DEFINITIONS.trails.find(t => t.id === trailId);
    if (!trailDef) return { success: false, reason: "not_found" };

    const currentRP = (profile.progression && profile.progression.researchPoints) || 0;
    if (currentRP < trailDef.cost) {
      return { success: false, reason: "insufficient_rp", cost: trailDef.cost, currentRP };
    }

    profile.progression.researchPoints -= trailDef.cost;
    profile.unlockedResearch.push(trailId);
    this.saveProfile();

    return { success: true, trail: trailDef, remainingRP: profile.progression.researchPoints };
  }

  /**
   * Dynamic Milestone Unlock Evaluator
   */
  evaluateUnlocks() {
    const profile = this.getProfile();
    if (!profile) return { newRockets: [], newThemes: [] };

    if (!Array.isArray(profile.unlockedRocketModels)) profile.unlockedRocketModels = ["classic"];
    if (!Array.isArray(profile.unlockedRocketThemes)) profile.unlockedRocketThemes = ["explorer"];

    const newRockets = [];
    const newThemes = [];

    // Evaluate Rocket Models
    Object.entries(CONFIG.ROCKET_UNLOCK_RULES).forEach(([modelId, rule]) => {
      if (!profile.unlockedRocketModels.includes(modelId)) {
        let isMet = false;
        if (typeof rule.check === "function") {
          isMet = rule.check(profile);
        } else if (rule.type === "stars") {
          const stars = (profile.progression && profile.progression.totalStars) || 0;
          isMet = stars >= rule.threshold;
        } else if (rule.type === "destinations") {
          const visited = Object.keys(profile.destinationsVisited || {}).filter(k => profile.destinationsVisited[k]).length;
          isMet = visited >= rule.threshold;
        } else if (rule.type === "collectibles") {
          const count = (profile.collectibles || []).length;
          isMet = count >= rule.threshold;
        }

        if (isMet) {
          profile.unlockedRocketModels.push(modelId);
          newRockets.push(modelId);
        }
      }
    });

    // Evaluate Rocket Themes
    Object.entries(CONFIG.THEME_UNLOCK_RULES).forEach(([themeId, rule]) => {
      if (!profile.unlockedRocketThemes.includes(themeId)) {
        let isMet = false;
        if (typeof rule.check === "function") {
          isMet = rule.check(profile);
        } else if (rule.type === "streak") {
          const maxCombo = profile.maxComboAllTime || 0;
          isMet = maxCombo >= rule.threshold;
        } else if (rule.type === "mastery") {
          const math = window.mathEngine;
          if (math) {
            const sum = math.getOperationMasterySummary();
            isMet = (sum.multiplication >= rule.threshold);
          }
        } else if (rule.type === "collectibles_set") {
          const owned = new Set(profile.collectibles || []);
          const setReq = rule.setItems || [];
          isMet = setReq.length > 0 && setReq.every(it => owned.has(it));
        }

        if (isMet) {
          profile.unlockedRocketThemes.push(themeId);
          newThemes.push(themeId);
        }
      }
    });

    if (newRockets.length > 0 || newThemes.length > 0) {
      this.saveProfile();
    }

    return { newRockets, newThemes };
  }

  /**
   * Planetary Exploration Progress
   */
  getPlanetProgress(destinationId) {
    const profile = this.getProfile();
    const missions = Object.values(CONFIG.MISSION_DEFINITIONS).filter(m => m.destination === destinationId);
    if (!profile || missions.length === 0) return { completedMissions: 0, totalMissions: missions.length, starsEarned: 0, maxStars: missions.length * 3, isCompleted: false };

    const records = profile.missionRecords || {};
    let completedCount = 0;
    let starsEarned = 0;

    missions.forEach(m => {
      const rec = records[m.id];
      if (rec && rec.completedCount > 0) {
        completedCount++;
        starsEarned += (rec.bestStars || 0);
      }
    });

    return {
      completedMissions: completedCount,
      totalMissions: missions.length,
      starsEarned,
      maxStars: missions.length * 3,
      isCompleted: completedCount >= missions.length
    };
  }

  /**
   * Get Recommended Mission tailored to the child's learning needs
   */
  getRecommendedMission() {
    const profile = this.getProfile();
    const allMissions = Object.values(CONFIG.MISSION_DEFINITIONS);
    if (!profile) return allMissions[0];

    const records = profile.missionRecords || {};
    const uncompleted = allMissions.filter(m => !records[m.id] || records[m.id].completedCount === 0);

    // Prioritize unlocked destination missions
    const unlockedUncompleted = uncompleted.filter(m => this.isPlanetUnlocked(m.destination));
    if (unlockedUncompleted.length > 0) {
      return unlockedUncompleted[0];
    }

    // If all completed, recommend one with <3 stars
    const imperfect = allMissions.filter(m => records[m.id] && records[m.id].bestStars < 3 && this.isPlanetUnlocked(m.destination));
    if (imperfect.length > 0) {
      return imperfect[0];
    }

    return allMissions[0];
  }
}

// Export singleton instance
window.progressionManager = new ProgressionManager();
if (typeof module !== "undefined") {
  module.exports = { ProgressionManager };
}
