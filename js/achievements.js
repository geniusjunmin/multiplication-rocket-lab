/**
 * Multiplication Rocket Lab - Badges & Achievements System (js/achievements.js)
 * Version 4.0.0 Space Adventure Progression Architecture
 */
class AchievementManager {
  constructor() {
    this.badges = {
      // 1. Learning Badges
      master_2: { id: "master_2", category: "learning", titleKey: "badgeMaster2", icon: "🧠", descEn: "Master the ×2 multiplication table (90%+)", descZh: "完全掌握 2 的乘法表 (≥90%)" },
      master_3: { id: "master_3", category: "learning", titleKey: "badgeMaster3", icon: "🧠", descEn: "Master the ×3 multiplication table (90%+)", descZh: "完全掌握 3 的乘法表 (≥90%)" },
      master_5: { id: "master_5", category: "learning", titleKey: "badgeMaster5", icon: "🧠", descEn: "Master the ×5 multiplication table (90%+)", descZh: "完全掌握 5 的乘法表 (≥90%)" },
      master_7: { id: "master_7", category: "learning", titleKey: "badgeMaster7", icon: "🧠", descEn: "Master the ×7 multiplication table (90%+)", descZh: "完全掌握 7 的乘法表 (≥90%)" },
      master_8: { id: "master_8", category: "learning", titleKey: "badgeMaster8", icon: "🧠", descEn: "Master the ×8 multiplication table (90%+)", descZh: "完全掌握 8 的乘法表 (≥90%)" },
      master_10: { id: "master_10", category: "learning", titleKey: "badgeMaster10", icon: "🧠", descEn: "Master the ×10 multiplication table (90%+)", descZh: "完全掌握 10 的乘法表 (≥90%)" },
      division_navigator: { id: "division_navigator", category: "learning", titleKey: "badgeDivNav", icon: "➗", descEn: "Answer 25 division facts correctly", descZh: "累计正确完成 25 道整除法计算" },

      // 2. Mission Badges
      first_launch: { id: "first_launch", category: "mission", titleKey: "badgeFirstLaunch", icon: "🚀", descEn: "Complete your 1st Space Mission", descZh: "完成首次太空探索任务" },
      missions_5: { id: "missions_5", category: "mission", titleKey: "badge5Missions", icon: "🛸", descEn: "Complete 5 Space Missions", descZh: "累计完成 5 次太空任务" },
      missions_10: { id: "missions_10", category: "mission", titleKey: "badge10Missions", icon: "🌌", descEn: "Complete 10 Space Missions", descZh: "累计完成 10 次太空任务" },
      stars_15: { id: "stars_15", category: "mission", titleKey: "badge15Stars", icon: "⭐", descEn: "Earn 15 Mission Stars", descZh: "累计获得 15 颗任务之星" },
      stars_30: { id: "stars_30", category: "mission", titleKey: "badge30Stars", icon: "🌟", descEn: "Earn 30 Mission Stars", descZh: "累计获得 30 颗任务之星" },

      // 3. Exploration Badges
      moon_landing: { id: "moon_landing", category: "exploration", titleKey: "badgeMoonLand", icon: "🌙", descEn: "Complete a Lunar Mission", descZh: "成功降落月球表面" },
      mars_landing: { id: "mars_landing", category: "exploration", titleKey: "badgeMarsLand", icon: "🔴", descEn: "Complete a Mars Mission", descZh: "成功抵达火星先锋基地" },
      jupiter_explorer: { id: "jupiter_explorer", category: "exploration", titleKey: "badgeJupiterExp", icon: "🪐", descEn: "Fly by Jupiter and the Great Red Spot", descZh: "完成木星大红斑近距离飞掠" },
      saturn_explorer: { id: "saturn_explorer", category: "exploration", titleKey: "badgeSaturnExp", icon: "💍", descEn: "Traverse Saturn's 3D Rings", descZh: "穿越土星壮丽冰晶光环" },
      deep_space_explorer: { id: "deep_space_explorer", category: "exploration", titleKey: "badgeDeepSpace", icon: "🌌", descEn: "Pioneer beyond into Deep Space", descZh: "开拓进入太阳系外深空星云" },

      // 4. Collection & Museum Badges
      sample_collector_5: { id: "sample_collector_5", category: "exploration", titleKey: "badge5Samples", icon: "🪨", descEn: "Collect 5 Space Museum Samples", descZh: "收集 5 件太空博物馆藏品" },
      museum_set_moon: { id: "museum_set_moon", category: "exploration", titleKey: "badgeMoonSet", icon: "🏛️", descEn: "Complete the Lunar Museum Collection", descZh: "集齐月球博物馆全部 3 件专属藏品" },

      // 5. Skill & Streak Badges
      combo_5: { id: "combo_5", category: "skill", titleKey: "badgeCombo5", icon: "🔥", descEn: "Achieve a 5-answer streak", descZh: "达成 5 连胜答对" },
      combo_10: { id: "combo_10", category: "skill", titleKey: "badgeCombo10", icon: "⚡", descEn: "Achieve a 10-answer streak", descZh: "达成 10 连胜答对" },
      speed_pilot: { id: "speed_pilot", category: "skill", titleKey: "badgeSpeed", icon: "⏱️", descEn: "Answer a Hard mode question under 3s", descZh: "在挑战模式 3 秒内答对题目" },
      perfect_round: { id: "perfect_round", category: "skill", titleKey: "badgePerfect", icon: "🎯", descEn: "Complete a mission with 100% first-try accuracy", descZh: "以 100% 首答正确率完美通关任务" },
      q_100: { id: "q_100", category: "skill", titleKey: "badge100Q", icon: "📖", descEn: "Answer 100 total questions", descZh: "累计练习 100 道数学题" }
    };
  }

  checkAndAward(context = {}) {
    const newlyAwarded = [];
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return newlyAwarded;

    const stats = {
      gamesCompleted: profile.gamesCompleted || 0,
      totalCorrectAnswers: profile.totalCorrectAnswers || 0,
      totalQuestionsAnswered: profile.totalQuestionsAnswered || 0,
      totalDivisionCorrect: profile.totalDivisionCorrect || 0,
      maxCombo: Math.max(context.comboCount || 0, profile.maxComboAllTime || 0),
      firstTryAccuracy: context.firstTryAccuracy || context.accuracy || 0,
      lastResponseTime: context.responseTimeMs || 9999,
      totalStars: profile.progression ? (profile.progression.totalStars || 0) : 0,
      collectiblesCount: profile.collectibles ? profile.collectibles.length : 0,
      destinationsVisited: profile.destinationsVisited || {},
      missionRecords: profile.missionRecords || {}
    };

    const award = (badgeId) => {
      if (!profile.badges.includes(badgeId)) {
        profile.badges.push(badgeId);
        if (window.profileManager) window.profileManager.save();
        if (this.badges[badgeId]) newlyAwarded.push(this.badges[badgeId]);
        return true;
      }
      return false;
    };

    if (stats.gamesCompleted >= 1) award("first_launch");
    if (stats.gamesCompleted >= 5) award("missions_5");
    if (stats.gamesCompleted >= 10) award("missions_10");
    if (stats.totalStars >= 15) award("stars_15");
    if (stats.totalStars >= 30) award("stars_30");

    if (stats.maxCombo >= 5) award("combo_5");
    if (stats.maxCombo >= 10) award("combo_10");
    if (stats.totalQuestionsAnswered >= 100) award("q_100");
    if (stats.totalDivisionCorrect >= 25) award("division_navigator");

    if (context.isHardMode && stats.lastResponseTime < 3000 && context.isCorrect) {
      award("speed_pilot");
    }
    if (stats.firstTryAccuracy >= 100 && (context.totalRoundQuestions || 0) >= 10) {
      award("perfect_round");
    }

    // Planetary exploration
    if (stats.destinationsVisited.moon) award("moon_landing");
    if (stats.destinationsVisited.mars) award("mars_landing");
    if (stats.destinationsVisited.jupiter) award("jupiter_explorer");
    if (stats.destinationsVisited.saturn) award("saturn_explorer");
    if (stats.destinationsVisited.deepSpace) award("deep_space_explorer");

    // Collectibles & Museum sets
    if (stats.collectiblesCount >= 5) award("sample_collector_5");
    const moonCollectibles = ["moon_basalt_rock", "moon_rover_wheel", "moon_far_side_map"];
    if (moonCollectibles.every(c => profile.collectibles && profile.collectibles.includes(c))) {
      award("museum_set_moon");
    }

    // Check table mastery report accurately
    if (window.mathEngine) {
      const report = window.mathEngine.getTableMasteryReport();
      const checkTable = (tblNum, badgeKey) => {
        const item = report.find(r => r.table === tblNum);
        const score = item ? (item.averageMastery !== undefined ? item.averageMastery : item.percentage) : 0;
        if (score >= 90) {
          award(badgeKey);
        }
      };

      checkTable(2, "master_2");
      checkTable(3, "master_3");
      checkTable(5, "master_5");
      checkTable(7, "master_7");
      checkTable(8, "master_8");
      checkTable(10, "master_10");
    }

    return newlyAwarded;
  }
}

window.achievementManager = new AchievementManager();
if (typeof module !== "undefined") {
  module.exports = { AchievementManager };
}
