/**
 * Multiplication Rocket Lab - Badges & Achievements System (js/achievements.js)
 */
class AchievementManager {
  constructor() {
    this.badges = {
      first_launch: { id: "first_launch", titleKey: "badgeFirstLaunch", icon: "🚀", descEn: "Complete your 1st Space Launch", descZh: "完成首次火箭发射升空" },
      combo_5: { id: "combo_5", titleKey: "badgeCombo5", icon: "🔥", descEn: "Achieve 5 correct answers in a row", descZh: "连续答对 5 道乘法题" },
      combo_10: { id: "combo_10", titleKey: "badgeCombo10", icon: "🌟", descEn: "Achieve 10 correct answers in a row", descZh: "连续答对 10 道乘法题" },
      master_2: { id: "master_2", titleKey: "badgeMaster2", icon: "🧠", descEn: "Master the ×2 multiplication table (90%+)", descZh: "完全掌握 2 的乘法表" },
      master_5: { id: "master_5", titleKey: "badgeMaster5", icon: "🧠", descEn: "Master the ×5 multiplication table (90%+)", descZh: "完全掌握 5 的乘法表" },
      master_10: { id: "master_10", titleKey: "badgeMaster10", icon: "🧠", descEn: "Master the ×10 multiplication table (90%+)", descZh: "完全掌握 10 的乘法表" },
      speed_pilot: { id: "speed_pilot", titleKey: "badgeSpeed", icon: "⚡", descEn: "Answer a Hard mode question under 3 seconds", descZh: "在挑战模式 3 秒内答对题目" },
      perfect_round: { id: "perfect_round", titleKey: "badgePerfect", icon: "🎯", descEn: "Complete a round with 100% accuracy", descZh: "以 100% 正确率完成一轮练习" },
      q_100: { id: "q_100", titleKey: "badge100Q", icon: "🌌", descEn: "Answer 100 total questions", descZh: "累计练习 100 道乘法题" }
    };
  }

  checkAndAward(context = {}) {
    const newlyAwarded = [];
    if (!window.storageManager) return newlyAwarded;

    const stats = {
      gamesCompleted: window.storageManager.get("gamesCompleted") || 0,
      totalCorrectAnswers: window.storageManager.get("totalCorrectAnswers") || 0,
      totalQuestionsAnswered: window.storageManager.get("totalQuestionsAnswered") || 0,
      maxCombo: context.comboCount || 0,
      accuracy: context.accuracy || 0,
      lastResponseTime: context.responseTimeMs || 9999
    };

    if (stats.gamesCompleted >= 1) {
      if (window.storageManager.awardBadge("first_launch")) newlyAwarded.push(this.badges.first_launch);
    }
    if (stats.maxCombo >= 5) {
      if (window.storageManager.awardBadge("combo_5")) newlyAwarded.push(this.badges.combo_5);
    }
    if (stats.maxCombo >= 10) {
      if (window.storageManager.awardBadge("combo_10")) newlyAwarded.push(this.badges.combo_10);
    }
    if (stats.totalQuestionsAnswered >= 100) {
      if (window.storageManager.awardBadge("q_100")) newlyAwarded.push(this.badges.q_100);
    }
    if (context.isHardMode && stats.lastResponseTime < 3000 && context.isCorrect) {
      if (window.storageManager.awardBadge("speed_pilot")) newlyAwarded.push(this.badges.speed_pilot);
    }
    if (stats.accuracy >= 100 && context.totalRoundQuestions >= 10) {
      if (window.storageManager.awardBadge("perfect_round")) newlyAwarded.push(this.badges.perfect_round);
    }

    // Check table mastery
    if (window.mathEngine) {
      const report = window.mathEngine.getTableMasteryReport();
      const t2 = report.find(r => r.table === 2);
      const t5 = report.find(r => r.table === 5);
      const t10 = report.find(r => r.table === 10);

      if (t2 && t2.percentage >= 90) {
        if (window.storageManager.awardBadge("master_2")) newlyAwarded.push(this.badges.master_2);
      }
      if (t5 && t5.percentage >= 90) {
        if (window.storageManager.awardBadge("master_5")) newlyAwarded.push(this.badges.master_5);
      }
      if (t10 && t10.percentage >= 90) {
        if (window.storageManager.awardBadge("master_10")) newlyAwarded.push(this.badges.master_10);
      }
    }

    return newlyAwarded;
  }
}

window.achievementManager = new AchievementManager();
