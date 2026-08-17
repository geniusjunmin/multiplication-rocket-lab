/**
 * Multiplication Rocket Lab - Centralized Configuration (js/config.js)
 * Version 3.0.0 Product-Grade Architecture
 */
const CONFIG = {
  APP_VERSION: "3.0.0",
  SCHEMA_VERSION: 3,
  PART_COUNT: 10,
  DEFAULT_QUESTION_COUNT: 15,

  // UK National Curriculum Presets
  CURRICULUM_PRESETS: {
    year2: {
      nameEn: "Year 2 (Ages 6-7)",
      nameZh: "Year 2 (6-7岁)",
      tables: [2, 5, 10],
      operations: ["multiply"],
      descriptionEn: "Focus on ×2, ×5, ×10 tables",
      descriptionZh: "重点掌握 2、5、10 的乘法表"
    },
    year3: {
      nameEn: "Year 3 (Ages 7-8)",
      nameZh: "Year 3 (7-8岁)",
      tables: [2, 3, 4, 5, 8, 10],
      operations: ["multiply"],
      descriptionEn: "Master ×3, ×4, ×8 & review ×2, ×5, ×10",
      descriptionZh: "掌握 3、4、8 并复习 2、5、10 乘法表"
    },
    year4: {
      nameEn: "Year 4 (Ages 8-9)",
      nameZh: "Year 4 (8-9岁)",
      tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      operations: ["multiply"],
      descriptionEn: "Full 1×1 to 12×12 Multiplication Tables",
      descriptionZh: "完整覆盖 1×1 到 12×12 乘法表"
    }
  },

  // Free Challenge Math Presets
  MATH_CHALLENGE_PRESETS: {
    times9: {
      id: "times9",
      nameEn: "⭐ Starter — 9×9",
      nameZh: "⭐ 基础九九乘法 (9×9)",
      operations: ["multiply"],
      factorAMin: 1, factorAMax: 9,
      factorBMin: 1, factorBMax: 9,
      descEn: "1×1 to 9×9 multiplication facts",
      descZh: "1×1 至 9×9 基础乘法表练习"
    },
    times12: {
      id: "times12",
      nameEn: "🚀 Standard — 12×12",
      nameZh: "🚀 标准乘法表 (12×12)",
      operations: ["multiply"],
      factorAMin: 1, factorAMax: 12,
      factorBMin: 1, factorBMax: 12,
      descEn: "1×1 to 12×12 multiplication facts",
      descZh: "1×1 至 12×12 进阶乘法表"
    },
    times20: {
      id: "times20",
      nameEn: "🔥 Advanced — 20×20",
      nameZh: "🔥 极速高阶乘法 (20×20)",
      operations: ["multiply"],
      factorAMin: 1, factorAMax: 20,
      factorBMin: 1, factorBMax: 20,
      descEn: "Advanced facts up to 20×20 (e.g. 14×6, 17×8)",
      descZh: "1~20 范围高阶乘法 (如 14×6, 17×8)"
    },
    multDivide12: {
      id: "multDivide12",
      nameEn: "⚡ Multiply & Divide (1-12)",
      nameZh: "⚡ 乘除混合计算 (1-12)",
      operations: ["multiply", "divide"],
      factorAMin: 1, factorAMax: 12,
      factorBMin: 1, factorBMax: 12,
      exactDivisionOnly: true,
      descEn: "Mixed multiplication & exact integer division",
      descZh: "1~12 乘法与整除法混合练习"
    },
    expert20: {
      id: "expert20",
      nameEn: "🧠 Expert — 20×20 × & ÷",
      nameZh: "🧠 专家级乘除大挑战 (20×20)",
      operations: ["multiply", "divide"],
      factorAMin: 1, factorAMax: 20,
      factorBMin: 1, factorBMax: 20,
      exactDivisionOnly: true,
      descEn: "High-level 20×20 multiplication and division",
      descZh: "20×20 范围内乘法与整除法大师挑战"
    },
    custom: {
      id: "custom",
      nameEn: "🛠️ Custom Range",
      nameZh: "🛠️ 自定义数字与运算范围",
      operations: ["multiply"],
      factorAMin: 1, factorAMax: 12,
      factorBMin: 1, factorBMax: 12,
      exactDivisionOnly: true,
      descEn: "Configure custom ranges and operations",
      descZh: "自定义乘除法运算与因子区间"
    }
  },

  // Global Flight Timeline Standards (seconds)
  CINEMATIC_TIMING: {
    ignition: 2.0,
    liftoff: 4.0,
    atmosphere: 4.5,
    earthOrbit: 3.0
  },

  // 6 Interplanetary Destination Missions
  DESTINATIONS: {
    earthOrbit: {
      id: "earthOrbit",
      nameEn: "Earth Orbit",
      nameZh: "近地轨道",
      icon: "🌍",
      type: "orbit",
      distanceKm: "400 km",
      fuelRequired: 50,
      difficulty: 1,
      descEn: "Low Earth orbit station mission",
      descZh: "空间站近地轨道部署任务",
      recommendedPreset: "times9",
      color: "#0284c7",
      cinematic: {
        transferSeconds: 3.5,
        approachSeconds: 3.5,
        destinationSeconds: 4.5
      }
    },
    moon: {
      id: "moon",
      nameEn: "Moon Base",
      nameZh: "月球基地号",
      icon: "🌙",
      type: "landing",
      distanceKm: "384,400 km",
      fuelRequired: 70,
      difficulty: 2,
      descEn: "Lunar orbit and surface touchdown",
      descZh: "月球轨道环绕与环形山降落任务",
      recommendedPreset: "times9",
      color: "#94a3b8",
      cinematic: {
        transferSeconds: 4.5,
        approachSeconds: 4.5,
        destinationSeconds: 7.0
      }
    },
    mars: {
      id: "mars",
      nameEn: "Mars Colony",
      nameZh: "火星拓荒号",
      icon: "🔴",
      type: "landing",
      distanceKm: "225,000,000 km",
      fuelRequired: 100,
      difficulty: 3,
      descEn: "Red Planet orbital insertion and touchdown",
      descZh: "红色火星大气穿梭与基地降落任务",
      recommendedPreset: "times12",
      color: "#ef4444",
      cinematic: {
        transferSeconds: 5.5,
        approachSeconds: 5.0,
        destinationSeconds: 7.5
      }
    },
    jupiter: {
      id: "jupiter",
      nameEn: "Jupiter Flyby",
      nameZh: "木星风暴探险号",
      icon: "🪐",
      type: "flyby",
      distanceKm: "778,000,000 km",
      fuelRequired: 120,
      difficulty: 4,
      descEn: "Gas giant flyby & Great Red Spot study",
      descZh: "气态巨行星大红斑与卫群近距离飞掠",
      recommendedPreset: "multDivide12",
      color: "#f59e0b",
      cinematic: {
        transferSeconds: 6.0,
        approachSeconds: 5.5,
        destinationSeconds: 7.0
      }
    },
    saturn: {
      id: "saturn",
      nameEn: "Saturn Ring Explorer",
      nameZh: "土星光环探索者",
      icon: "🪐",
      type: "orbit",
      distanceKm: "1,400,000,000 km",
      fuelRequired: 140,
      difficulty: 5,
      descEn: "Traverse Saturn's 3D magnificent rings",
      descZh: "穿越土星壮丽的 3D 冰晶光环轨道",
      recommendedPreset: "times20",
      color: "#eab308",
      cinematic: {
        transferSeconds: 6.5,
        approachSeconds: 6.0,
        destinationSeconds: 8.0
      }
    },
    deepSpace: {
      id: "deepSpace",
      nameEn: "Deep Space Explorer",
      nameZh: "深空星云开拓号",
      icon: "🌌",
      type: "exploration",
      distanceKm: "Deep Space",
      fuelRequired: 160,
      difficulty: 6,
      descEn: "Journey beyond the Solar System into interstellar nebulae",
      descZh: "穿过太阳系边缘进入璀璨星云深处",
      recommendedPreset: "expert20",
      color: "#818cf8",
      cinematic: {
        transferSeconds: 7.0,
        approachSeconds: 6.5,
        destinationSeconds: 8.5
      }
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
