/**
 * Multiplication Rocket Lab - Centralized Configuration (js/config.js)
 * Version 2.0.0
 */
const CONFIG = {
  APP_VERSION: "2.0.0",
  SCHEMA_VERSION: 2,
  MAX_TABLE: 12,
  MIN_TABLE: 1,
  PART_COUNT: 10,
  DEFAULT_QUESTION_COUNT: 15,

  // UK National Curriculum Presets
  CURRICULUM_PRESETS: {
    year2: {
      nameEn: "Year 2 (Ages 6-7)",
      nameZh: "Year 2 (6-7岁)",
      tables: [2, 5, 10],
      descriptionEn: "Focus on ×2, ×5, ×10 tables",
      descriptionZh: "重点掌握 2、5、10 的乘法表"
    },
    year3: {
      nameEn: "Year 3 (Ages 7-8)",
      nameZh: "Year 3 (7-8岁)",
      tables: [2, 3, 4, 5, 8, 10],
      descriptionEn: "Master ×3, ×4, ×8 & review ×2, ×5, ×10",
      descriptionZh: "掌握 3、4、8 并复习 2、5、10 乘法表"
    },
    year4: {
      nameEn: "Year 4 (Ages 8-9)",
      nameZh: "Year 4 (8-9岁)",
      tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      descriptionEn: "Full 1×1 to 12×12 Multiplication Tables",
      descriptionZh: "完整覆盖 1×1 到 12×12 乘法表"
    },
    custom: {
      nameEn: "Custom Selection",
      nameZh: "自定义乘法表",
      tables: [2, 3, 4, 5],
      descriptionEn: "Choose specific multiplication tables",
      descriptionZh: "自由勾选需要的乘法表"
    }
  },

  // Mastery Score Thresholds (0 ~ 100)
  MASTERY_LEVELS: {
    NEEDS_PRACTICE: { min: 0, max: 39, labelEn: "Needs Practice", labelZh: "需要练习", color: "#f87171" },
    LEARNING: { min: 40, max: 69, labelEn: "Learning", labelZh: "正在学习", color: "#fbbf24" },
    GOOD: { min: 70, max: 89, labelEn: "Good", labelZh: "掌握良好", color: "#60a5fa" },
    MASTERED: { min: 90, max: 100, labelEn: "Mastered", labelZh: "完全掌握", color: "#34d399" }
  },

  // Rocket Model Unlock Conditions
  ROCKET_UNLOCK_RULES: {
    classic: { reqEn: "Unlocked by default", reqZh: "默认可用", check: () => true },
    starship: { reqEn: "Complete 1 Space Launch", reqZh: "完成 1 次太空发射", check: (stats) => (stats.gamesCompleted || 0) >= 1 },
    longMarch: { reqEn: "Answer 50 questions correctly", reqZh: "累计答对 50 道题", check: (stats) => (stats.totalCorrectAnswers || 0) >= 50 },
    falconHeavy: { reqEn: "Master 3 multiplication tables", reqZh: "完全掌握 3 个乘法表", check: (stats) => (stats.masteredTablesCount || 0) >= 3 },
    cyber: { reqEn: "Answer 200 questions correctly", reqZh: "累计答对 200 道题", check: (stats) => (stats.totalCorrectAnswers || 0) >= 200 }
  },

  // Rocket Theme Unlock Conditions
  THEME_UNLOCK_RULES: {
    explorer: { reqEn: "Unlocked by default", reqZh: "默认涂装", check: () => true },
    fire: { reqEn: "Achieve a 5-streak combo", reqZh: "达成 5 连胜答对", check: (stats) => (stats.maxComboAllTime || 0) >= 5 },
    forest: { reqEn: "Complete 3 Space Launches", reqZh: "完成 3 次太空发射", check: (stats) => (stats.gamesCompleted || 0) >= 3 },
    lightning: { reqEn: "Achieve a 10-streak combo", reqZh: "达成 10 连胜答对", check: (stats) => (stats.maxComboAllTime || 0) >= 10 },
    galaxy: { reqEn: "Earn 5 Badges", reqZh: "获得 5 枚勋章", check: (stats) => (stats.badgeCount || 0) >= 5 }
  }
};

if (typeof module !== "undefined") {
  module.exports = { CONFIG };
} else {
  window.CONFIG = CONFIG;
}
