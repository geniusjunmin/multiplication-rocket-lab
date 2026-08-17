/**
 * Multiplication Rocket Lab - Progression & Long-Term Meta Engine (js/progression.js)
 * Version 4.0.0 Space Adventure Progression Architecture
 * Handles Commander XP & Levels, Mission Records, Star Economy, Museum Collectibles,
 * Deterministic Daily Missions, Weekly Expeditions, Research Lab & Unlock Evaluations.
 */
class ProgressionManager {
  constructor() {
    this.ranks = CONFIG.COMMANDER_RANKS;
  }

  getProfile() {
    return window.profileManager ? window.profileManager.getActiveProfile() : null;
  }

  saveProfile() {
    if (window.profileManager) {
      window.profileManager.save();
    }
  }

  /**
   * Calculate level info from total XP
   */
  getLevelInfo(xp = 0) {
    let currentRank = this.ranks[0];
    let nextRank = this.ranks[1] || null;

    for (let i = this.ranks.length - 1; i >= 0; i--) {
      if (xp >= this.ranks[i].xpRequired) {
        currentRank = this.ranks[i];
        nextRank = this.ranks[i + 1] || null;
        break;
      }
    }

    const currentLevel = currentRank.level;
    const currentBaseXp = currentRank.xpRequired;
    const nextLevelXp = nextRank ? nextRank.xpRequired : (currentRank.xpRequired + 1000);
    const xpInLevel = Math.max(0, xp - currentBaseXp);
    const xpNeededForLevel = nextLevelXp - currentBaseXp;
    const progressPercent = Math.min(100, Math.round((xpInLevel / xpNeededForLevel) * 100));

    return {
      level: currentLevel,
      rankTitleEn: currentRank.titleEn,
      rankTitleZh: currentRank.titleZh,
      rankIcon: currentRank.icon,
      currentXP: xp,
      currentBaseXp,
      nextLevelXp,
      xpInLevel,
      xpNeededForLevel,
      progressPercent,
      isMaxRank: !nextRank
    };
  }

  /**
   * Award XP and check for Commander Level Up
   */
  addXP(amount, reason = "") {
    const profile = this.getProfile();
    if (!profile) return { addedXP: 0, currentXP: 0, leveledUp: false, oldLevel: 1, newLevel: 1 };

    if (!profile.progression) {
      profile.progression = { commanderLevel: 1, xp: 0, totalStars: 0, researchPoints: 0 };
    }

    const oldLevel = profile.progression.commanderLevel || 1;
    profile.progression.xp = (profile.progression.xp || 0) + Math.max(0, amount);

    const levelInfo = this.getLevelInfo(profile.progression.xp);
    profile.progression.commanderLevel = levelInfo.level;

    const leveledUp = (levelInfo.level > oldLevel);
    this.saveProfile();

    if (leveledUp) {
      this.evaluateUnlocks();
    }

    return {
      addedXP: amount,
      currentXP: profile.progression.xp,
      oldLevel,
      newLevel: levelInfo.level,
      leveledUp,
      levelInfo,
      reason
    };
  }

  /**
   * Award Mission Stars (Non-consumable permanent milestone counter)
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
   * Record Mission Completion with Objectives, Grades, XP, Stars, and Collectibles
   */
  recordMissionComplete(missionId, sessionStats = {}, objectivesStatus = []) {
    const profile = this.getProfile();
    if (!profile) return null;

    const mission = CONFIG.MISSION_DEFINITIONS[missionId] || CONFIG.MISSION_DEFINITIONS.moon_crater_survey;
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
    const allObjectivesMet = objectivesStatus.every(o => o.completed);
    if (firstTryAcc >= 90 && allObjectivesMet) grade = "S";
    else if (firstTryAcc >= 80) grade = "A";
    else if (firstTryAcc >= 65) grade = "B";

    // Rewards Calculation
    let xpEarned = mission.reward.xp || 100;
    let rpEarned = mission.reward.researchPoints || 10;
    let collectibleUnlocked = false;

    if (isFirstClear) {
      if (mission.reward.firstClearBonus) {
        xpEarned += (mission.reward.firstClearBonus.xp || 0);
        rpEarned += (mission.reward.firstClearBonus.researchPoints || 0);
      }
      if (mission.reward.collectible) {
        collectibleUnlocked = this.unlockCollectible(mission.reward.collectible);
      }
      // Record destination visit
      if (window.profileManager) {
        window.profileManager.recordDestinationVisited(mission.destination);
      }
    }

    // High score / star improvement calculations
    const starImprovement = Math.max(0, starsEarned - prevRecord.bestStars);
    if (starImprovement > 0) {
      this.addStars(starImprovement);
    }

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

    // Update Profile Totals
    profile.gamesCompleted = (profile.gamesCompleted || 0) + 1;
    if (maxCombo > (profile.maxComboAllTime || 0)) {
      profile.maxComboAllTime = maxCombo;
    }

    // Append to Mission History (Capped at 100)
    if (!Array.isArray(profile.missionHistory)) profile.missionHistory = [];
    profile.missionHistory.unshift({
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
      xpEarned,
      rpEarned,
      collectibleEarned: collectibleUnlocked ? mission.reward.collectible : null
    });
    if (profile.missionHistory.length > 100) {
      profile.missionHistory = profile.missionHistory.slice(0, 100);
    }

    // Check Weekly Expedition
    this.updateWeeklyExpedition(mission.destination);

    // Evaluate Unlocks
    const newUnlocks = this.evaluateUnlocks();

    this.saveProfile();

    return {
      mission,
      isFirstClear,
      starsEarned,
      grade,
      xpEarned,
      rpEarned,
      collectibleUnlocked,
      collectibleId: mission.reward.collectible,
      newUnlocks
    };
  }

  compareGrades(g1, g2) {
    const rank = { S: 4, A: 3, B: 2, C: 1 };
    return (rank[g1] || 0) - (rank[g2] || 0);
  }

  /**
   * Evaluate and trigger unlocks across all rocket models and themes
   */
  evaluateUnlocks() {
    const profile = this.getProfile();
    if (!profile) return { newRockets: [], newThemes: [] };

    if (!Array.isArray(profile.unlockedRocketModels)) profile.unlockedRocketModels = ["classic"];
    if (!Array.isArray(profile.unlockedRocketThemes)) profile.unlockedRocketThemes = ["explorer"];

    const newRockets = [];
    const newThemes = [];

    // Check Rocket Model Unlocks
    Object.keys(CONFIG.ROCKET_UNLOCK_RULES).forEach(modelId => {
      if (!profile.unlockedRocketModels.includes(modelId)) {
        const rule = CONFIG.ROCKET_UNLOCK_RULES[modelId];
        if (rule && rule.check(profile)) {
          profile.unlockedRocketModels.push(modelId);
          newRockets.push(modelId);
        }
      }
    });

    // Check Theme Unlocks
    Object.keys(CONFIG.THEME_UNLOCK_RULES).forEach(themeId => {
      if (!profile.unlockedRocketThemes.includes(themeId)) {
        const rule = CONFIG.THEME_UNLOCK_RULES[themeId];
        if (rule && rule.check(profile)) {
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
   * Deterministic Offline Seeded Daily Missions Generator (profileId + YYYY-MM-DD)
   */
  getDailyMissions(dateStr = null, profileId = null) {
    const profile = this.getProfile();
    const actId = profileId || (profile ? profile.id : "default_player");
    const todayStr = dateStr || new Date().toISOString().slice(0, 10);

    // Simple deterministic hash
    let seed = 0;
    const combined = `${actId}_${todayStr}`;
    for (let i = 0; i < combined.length; i++) {
      seed = (seed * 31 + combined.charCodeAt(i)) & 0xffffffff;
    }

    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const allMissionKeys = Object.keys(CONFIG.MISSION_DEFINITIONS);
    const weakTables = (window.mathEngine ? window.mathEngine.getRecommendedFocusTables(3) : [7, 8, 9]);

    // Pick 3 diverse daily missions
    const selectedKeys = [];
    const shuffled = [...allMissionKeys].sort(() => seededRandom() - 0.5);

    // Prioritize missions covering weak tables
    for (const key of shuffled) {
      const m = CONFIG.MISSION_DEFINITIONS[key];
      if (m.mathFocus && m.mathFocus.some(t => weakTables.includes(t))) {
        if (!selectedKeys.includes(key)) selectedKeys.push(key);
      }
      if (selectedKeys.length >= 2) break;
    }

    for (const key of shuffled) {
      if (!selectedKeys.includes(key)) selectedKeys.push(key);
      if (selectedKeys.length >= 3) break;
    }

    const dailyState = (profile && profile.dailyMissionState && profile.dailyMissionState.date === todayStr)
      ? profile.dailyMissionState.completedIds || []
      : [];

    return selectedKeys.map(k => {
      const def = CONFIG.MISSION_DEFINITIONS[k];
      return {
        ...def,
        isDaily: true,
        isCompleted: dailyState.includes(k),
        dailyBonusXP: 50
      };
    });
  }

  /**
   * Soft Weekly Expedition Progress (5 stages: Earth -> Moon -> Mars -> Jupiter -> Saturn)
   */
  updateWeeklyExpedition(destId) {
    const profile = this.getProfile();
    if (!profile) return;

    const stages = ["earthOrbit", "moon", "mars", "jupiter", "saturn"];
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
    const weekKey = `${now.getFullYear()}_W${weekNumber}`;

    if (!profile.weeklyExpedition || profile.weeklyExpedition.weekKey !== weekKey) {
      profile.weeklyExpedition = {
        weekKey,
        currentStageIdx: 0,
        stagesCompleted: []
      };
    }

    const exp = profile.weeklyExpedition;
    const currentTargetDest = stages[exp.currentStageIdx];

    if (destId === currentTargetDest && !exp.stagesCompleted.includes(destId)) {
      exp.stagesCompleted.push(destId);
      if (exp.currentStageIdx < stages.length - 1) {
        exp.currentStageIdx++;
      }
      this.saveProfile();
    }
  }

  /**
   * Smart Adaptive Recommended Mission
   */
  getRecommendedMission() {
    const profile = this.getProfile();
    const allMissions = Object.values(CONFIG.MISSION_DEFINITIONS);
    if (!profile) return allMissions[0];

    const records = profile.missionRecords || {};
    const weakTables = (window.mathEngine ? window.mathEngine.getRecommendedFocusTables(3) : [7, 8, 9]);

    // 1. Uncompleted missions matching weak tables
    const uncompletedWeak = allMissions.filter(m => {
      const isUncompleted = !records[m.id] || records[m.id].completedCount === 0;
      const matchesWeak = m.mathFocus && m.mathFocus.some(t => weakTables.includes(t));
      return isUncompleted && matchesWeak;
    });
    if (uncompletedWeak.length > 0) return uncompletedWeak[0];

    // 2. Any uncompleted mission
    const uncompleted = allMissions.filter(m => !records[m.id] || records[m.id].completedCount === 0);
    if (uncompleted.length > 0) return uncompleted[0];

    // 3. Missions with < 3 stars to improve
    const starImprove = allMissions.filter(m => records[m.id] && records[m.id].bestStars < 3);
    if (starImprove.length > 0) return starImprove[0];

    return allMissions[0];
  }

  /**
   * Get Planet Progression Statistics
   */
  getPlanetProgress(destId) {
    const profile = this.getProfile();
    const allMissions = Object.values(CONFIG.MISSION_DEFINITIONS).filter(m => m.destination === destId);
    const records = profile ? (profile.missionRecords || {}) : {};
    const userCollectibles = profile ? (profile.collectibles || []) : [];

    const planetCollectibles = Object.values(CONFIG.COLLECTIBLES_DEFINITIONS).filter(c => c.planet === destId);

    let completedMissions = 0;
    let earnedStars = 0;
    let maxStars = allMissions.length * 3;

    allMissions.forEach(m => {
      const rec = records[m.id];
      if (rec && rec.completedCount > 0) {
        completedMissions++;
        earnedStars += (rec.bestStars || 0);
      }
    });

    const collectedCount = planetCollectibles.filter(c => userCollectibles.includes(c.id)).length;

    return {
      totalMissions: allMissions.length,
      completedMissions,
      earnedStars,
      maxStars,
      totalCollectibles: planetCollectibles.length,
      collectedCount,
      isFullyExplored: (completedMissions === allMissions.length && earnedStars === maxStars && collectedCount === planetCollectibles.length)
    };
  }

  /**
   * Unlock Research Cosmetic
   */
  unlockResearch(trailId) {
    const profile = this.getProfile();
    if (!profile) return { success: false, msg: "No active profile" };

    const trail = CONFIG.RESEARCH_TREE_DEFINITIONS.trails.find(t => t.id === trailId);
    if (!trail) return { success: false, msg: "Item not found" };

    if (!Array.isArray(profile.unlockedResearch)) profile.unlockedResearch = ["trail_standard"];
    if (profile.unlockedResearch.includes(trailId)) return { success: true, msg: "Already unlocked" };

    const cost = trail.cost || 0;
    const currentRP = profile.progression ? (profile.progression.researchPoints || 0) : 0;

    if (currentRP < cost) {
      return { success: false, msg: "Not enough Research Points" };
    }

    profile.progression.researchPoints -= cost;
    profile.unlockedResearch.push(trailId);
    this.saveProfile();

    return { success: true, trail };
  }
}

window.progressionManager = new ProgressionManager();
if (typeof module !== "undefined") {
  module.exports = { ProgressionManager };
}
