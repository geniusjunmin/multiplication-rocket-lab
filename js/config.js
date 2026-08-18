/**
 * Multiplication Rocket Lab - Centralized Configuration (js/config.js)
 * Version 4.0.0 Space Adventure Progression Architecture
 */
const CONFIG = {
  APP_VERSION: "4.1.0",
  SCHEMA_VERSION: 4,
  PART_COUNT: 10,
  DEFAULT_QUESTION_COUNT: 15,

  // Destination Commander Level Progression Gates
  DESTINATION_LEVEL_REQUIREMENTS: {
    earthOrbit: 1,
    moon: 1,
    mars: 2,
    jupiter: 4,
    saturn: 5,
    deepSpace: 8
  },

  // Safe vs Boost Route Profiles
  ROUTE_CONFIGS: {
    safe: {
      id: "safe",
      nameEn: "🟢 Safe Route",
      nameZh: "🟢 稳妥航线",
      questionMultiplier: 1.0,
      difficultyModifier: 0,
      rewardMultiplier: 1.0,
      eventChance: 0.35,
      bonusXP: 0,
      bonusRP: 0,
      bonusStarAvailable: false,
      descEn: "Standard math facts • 100% Rewards • Regular flight events",
      descZh: "标准难度题目 • 100% 基础奖励 • 常规空情事件"
    },
    boost: {
      id: "boost",
      nameEn: "⚡ Boost Route",
      nameZh: "⚡ 极速高能航线",
      questionMultiplier: 1.0,
      difficultyModifier: 1,
      rewardMultiplier: 1.35,
      eventChance: 0.70,
      bonusXP: 50,
      bonusRP: 10,
      bonusStarAvailable: true,
      descEn: "Harder facts & mixed math • +35% XP & +10 RP • High event rate • Bonus Star Chance",
      descZh: "高阶挑战题与混合运算 • +35% XP 及 +10 RP • 高频突发特情 • 额外星级机会"
    }
  },

  // Weekly Expedition Definition
  WEEKLY_EXPEDITION_DEFINITIONS: {
    route: ["earthOrbit", "moon", "mars", "jupiter", "saturn"],
    reward: {
      xp: 300,
      researchPoints: 50,
      badge: "expedition_master"
    }
  },

  // Commander Progression & Ranks
  COMMANDER_RANKS: [
    { level: 1, xpRequired: 0, titleEn: "Rookie Cadet", titleZh: "新手学员", icon: "🌱" },
    { level: 2, xpRequired: 200, titleEn: "Rocket Cadet", titleZh: "火箭学员", icon: "🚀" },
    { level: 3, xpRequired: 500, titleEn: "Lunar Pilot", titleZh: "探月领航员", icon: "🌙" },
    { level: 4, xpRequired: 900, titleEn: "Mars Navigator", titleZh: "火星开拓者", icon: "🔴" },
    { level: 5, xpRequired: 1400, titleEn: "Space Engineer", titleZh: "航天工程师", icon: "🛠️" },
    { level: 6, xpRequired: 2000, titleEn: "Planet Explorer", titleZh: "行星探索官", icon: "🪐" },
    { level: 7, xpRequired: 2700, titleEn: "Mission Commander", titleZh: "深空指挥官", icon: "⭐" },
    { level: 8, xpRequired: 3500, titleEn: "Galactic Commander", titleZh: "银河总司令", icon: "🌌" }
  ],

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

  // 6 Interplanetary Destinations with Sub-Destinations
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
      descEn: "Low Earth orbit station and satellite missions",
      descZh: "近地空间站与微重力卫星轨道任务",
      recommendedPreset: "times9",
      color: "#0284c7",
      subDestinations: [
        { id: "iss", nameEn: "Space Station Alpha", nameZh: "阿尔法空间站" },
        { id: "geo_orbit", nameEn: "Geostationary Ring", nameZh: "地球同步轨道环" }
      ],
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
      descEn: "Lunar surface exploration, crater surveying and rover delivery",
      descZh: "月球表面探索、环形山地质调查与月球车投放",
      recommendedPreset: "times9",
      color: "#94a3b8",
      subDestinations: [
        { id: "crater_copernicus", nameEn: "Copernicus Crater", nameZh: "哥白尼环形山" },
        { id: "moon_south_pole", nameEn: "Shackleton Crater Ice", nameZh: "月球南极永久阴影区" },
        { id: "moon_far_side", nameEn: "Lunar Far Side Base", nameZh: "月球背面着陆点" }
      ],
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
      descEn: "Red planet atmospheric entry, rover rescue and water-ice discovery",
      descZh: "红色火星大气穿越、漫游车救援与水冰层探测",
      recommendedPreset: "times12",
      color: "#ef4444",
      subDestinations: [
        { id: "jezero_crater", nameEn: "Jezero Crater Basin", nameZh: "耶泽罗古湖盆地" },
        { id: "olympus_mons", nameEn: "Olympus Foothills", nameZh: "奥林匹斯山麓" },
        { id: "valles_marineris", nameEn: "Valles Marineris Canyon", nameZh: "水手号大峡谷" }
      ],
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
      descEn: "Gas giant Great Red Spot telemetry and Jovian moon scans",
      descZh: "巨型气态行星大红斑风暴遥测与木星卫星探测",
      recommendedPreset: "multDivide12",
      color: "#f59e0b",
      subDestinations: [
        { id: "great_red_spot", nameEn: "Great Red Spot Core", nameZh: "大红斑风暴中心" },
        { id: "europa", nameEn: "Europa Ocean Flyby", nameZh: "木卫二欧罗巴冰下海" },
        { id: "io", nameEn: "Io Volcanic Ridge", nameZh: "木卫一伊奥火山群" }
      ],
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
      descEn: "Navigate Saturn's magnificent ring plane, Titan and Enceladus",
      descZh: "穿行土星冰晶光环缝隙，勘测土卫六泰坦与土卫二冰泉",
      recommendedPreset: "times20",
      color: "#eab308",
      subDestinations: [
        { id: "cassini_division", nameEn: "Cassini Ring Gap", nameZh: "卡西尼环缝" },
        { id: "titan", nameEn: "Titan Methane Lakes", nameZh: "土卫六泰坦甲烷湖" },
        { id: "enceladus", nameEn: "Enceladus Geysers", nameZh: "土卫二冰喷泉" }
      ],
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
      distanceKm: "Interstellar",
      fuelRequired: 160,
      difficulty: 6,
      descEn: "Interstellar expeditions, asteroid intercepts, and mystery beacon decoding",
      descZh: "太阳系外星际开拓、小行星拦截与未知宇宙深空信号解码",
      recommendedPreset: "expert20",
      color: "#818cf8",
      subDestinations: [
        { id: "asteroid_belt", nameEn: "Ceres Asteroid Hub", nameZh: "谷神星小行星中继站" },
        { id: "comet_wild2", nameEn: "Comet Tail Trajectory", nameZh: "彗星彗尾伴飞区" },
        { id: "orion_nebula", nameEn: "Interstellar Nebula Edge", nameZh: "猎户座星云前沿" }
      ],
      cinematic: {
        transferSeconds: 7.0,
        approachSeconds: 6.5,
        destinationSeconds: 8.5
      }
    }
  },

  // 18+ Data-Driven Missions (>=3 per destination)
  MISSION_DEFINITIONS: {
    // 1. Earth Orbit Missions
    earth_satellite_deploy: {
      id: "earth_satellite_deploy",
      destination: "earthOrbit",
      subDestination: "geo_orbit",
      titleEn: "Satellite Deployment",
      titleZh: "高轨气象卫星部署",
      storyEn: "Deploy a global climate communication satellite into geostationary orbit.",
      storyZh: "将一颗全球气候与通信卫星精准送入地球同步轨道。",
      completionEn: "Satellite online! Solar arrays deployed and telemetry synced.",
      completionZh: "卫星入轨成功！太阳能帆板已展开，信号遥测全部就绪！",
      lengthType: "quick",
      questionTarget: 10,
      fuelModifier: 1.0,
      mathFocus: [2, 5, 10],
      modifier: "accuracy",
      recommendedPayload: "satellite",
      objectives: [
        { id: "primary", type: "complete", descEn: "Complete Satellite Mission", descZh: "完成卫星部署任务", stars: 1 },
        { id: "first_try", type: "accuracy", target: 80, descEn: "First-try accuracy ≥ 80%", descZh: "首答正确率 ≥ 80%", stars: 1 },
        { id: "streak", type: "streak", target: 4, descEn: "Reach 4-answer streak", descZh: "达成 4 连胜答对", stars: 1 }
      ],
      eventPool: ["navigation_drift", "course_correction"],
      reward: {
        xp: 100,
        stars: 3,
        researchPoints: 10,
        collectible: "earth_sat_photo",
        firstClearBonus: { xp: 80, researchPoints: 15 }
      }
    },
    earth_station_supply: {
      id: "earth_station_supply",
      destination: "earthOrbit",
      subDestination: "iss",
      titleEn: "Space Station Supply Run",
      titleZh: "国际空间站物资补给",
      storyEn: "Deliver essential scientific modules and fresh supplies to Space Station Alpha.",
      storyZh: "运送科研实验舱与关键能源补给至阿尔法太空空间站。",
      completionEn: "Docking confirmed! Supply module transferred safely to the station crew.",
      completionZh: "对接成功！补给舱已安全移交给空间站宇航员！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [3, 4, 6],
      modifier: "speed",
      recommendedPayload: "cargo",
      objectives: [
        { id: "primary", type: "complete", descEn: "Deliver Cargo Supplies", descZh: "送达补给物资", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 6, descEn: "Reach 6-answer streak", descZh: "达成 6 连胜答对", stars: 1 }
      ],
      eventPool: ["engine_overheat", "navigation_drift"],
      reward: {
        xp: 120,
        stars: 3,
        researchPoints: 15,
        collectible: "earth_station_patch",
        firstClearBonus: { xp: 100, researchPoints: 20 }
      }
    },
    earth_orbital_repair: {
      id: "earth_orbital_repair",
      destination: "earthOrbit",
      subDestination: "geo_orbit",
      titleEn: "Orbital Telescope Repair",
      titleZh: "空间望远镜精密维护",
      storyEn: "Calibrate guidance thrusters to rendezvous and repair an orbital deep-space telescope.",
      storyZh: "调整火箭轨道精确交会，修复主镜面校准发生漂移的深空天文望远镜。",
      completionEn: "Optics recalibrated! The telescope captured crystal-clear cosmic vistas.",
      completionZh: "光学镜面校准完毕！望远镜已成功拍摄到璀璨深空图像！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [4, 7, 8],
      modifier: "accuracy",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Complete Telescope Repair", descZh: "完成望远镜维护", stars: 1 },
        { id: "first_try", type: "accuracy", target: 90, descEn: "First-try accuracy ≥ 90%", descZh: "首答正确率 ≥ 90%", stars: 1 },
        { id: "streak", type: "streak", target: 7, descEn: "Reach 7-answer streak", descZh: "达成 7 连胜答对", stars: 1 }
      ],
      eventPool: ["solar_storm", "navigation_drift"],
      reward: {
        xp: 130,
        stars: 3,
        researchPoints: 15,
        collectible: "earth_telescope_lens",
        firstClearBonus: { xp: 100, researchPoints: 20 }
      }
    },

    // 2. Moon Missions
    moon_crater_survey: {
      id: "moon_crater_survey",
      destination: "moon",
      subDestination: "crater_copernicus",
      titleEn: "Crater Survey",
      titleZh: "哥白尼环形山调查",
      storyEn: "Survey Copernicus crater to identify ancient lunar basalt minerals.",
      storyZh: "对哥白尼环形山进行高精度扫描，探测数十亿年前的古老月岩。",
      completionEn: "Crater survey complete! Ancient basalt mineral samples secured.",
      completionZh: "环形山勘探完成！古老月岩样本已成功采集封存！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [6, 7, 8],
      modifier: "accuracy",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Touchdown on Moon", descZh: "成功降落月球", stars: 1 },
        { id: "first_try", type: "accuracy", target: 80, descEn: "First-try accuracy ≥ 80%", descZh: "首答正确率 ≥ 80%", stars: 1 },
        { id: "streak", type: "streak", target: 5, descEn: "Reach 5-answer streak", descZh: "达成 5 连胜答对", stars: 1 }
      ],
      eventPool: ["asteroid_alert", "engine_overheat", "navigation_drift"],
      reward: {
        xp: 120,
        stars: 3,
        researchPoints: 15,
        collectible: "moon_basalt_rock",
        firstClearBonus: { xp: 100, researchPoints: 25 }
      }
    },
    moon_rover_delivery: {
      id: "moon_rover_delivery",
      destination: "moon",
      subDestination: "moon_south_pole",
      titleEn: "Lunar Rover Delivery",
      titleZh: "极地探冰漫游车部署",
      storyEn: "Safely land the heavy-duty Lunar Rover near Shackleton crater ice deposits.",
      storyZh: "将极地重型漫游车平稳送抵月球南极永久阴影区，勘查地下水冰资源。",
      completionEn: "Rover deployed! Wheels churning the lunar regolith as scientific drilling starts.",
      completionZh: "月球漫游车顺利驶离着陆架！六轮展开，正式开始冰层钻探！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [7, 8, 9],
      modifier: "combo",
      recommendedPayload: "rover",
      objectives: [
        { id: "primary", type: "complete", descEn: "Deploy Lunar Rover", descZh: "成功投放月球车", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 6, descEn: "Reach 6-answer streak", descZh: "达成 6 连胜答对", stars: 1 }
      ],
      eventPool: ["engine_overheat", "navigation_drift"],
      reward: {
        xp: 140,
        stars: 3,
        researchPoints: 20,
        collectible: "moon_rover_wheel",
        firstClearBonus: { xp: 120, researchPoints: 30 }
      }
    },
    moon_beacon_rescue: {
      id: "moon_beacon_rescue",
      destination: "moon",
      subDestination: "moon_far_side",
      titleEn: "Far Side Beacon Rescue",
      titleZh: "月背失联信标搜寻",
      storyEn: "Traverse lunar orbit to the mysterious Far Side and retrieve lost beacon data.",
      storyZh: "飞跃月球背面无线电静默区，定位并恢复远古科学信标的珍贵记录。",
      completionEn: "Beacon retrieved! Far-side telemetry transmitted via orbital relay.",
      completionZh: "信标已成功恢复！月球背面珍贵数据正通过中继卫星持续回传！",
      lengthType: "epic",
      questionTarget: 20,
      fuelModifier: 1.1,
      mathFocus: [8, 9, 12],
      modifier: "weak_facts",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Retrieve Far Side Beacon", descZh: "找回月背信标", stars: 1 },
        { id: "first_try", type: "accuracy", target: 90, descEn: "First-try accuracy ≥ 90%", descZh: "首答正确率 ≥ 90%", stars: 1 },
        { id: "streak", type: "streak", target: 8, descEn: "Reach 8-answer streak", descZh: "达成 8 连胜答对", stars: 1 }
      ],
      eventPool: ["asteroid_alert", "solar_storm", "unknown_signal"],
      reward: {
        xp: 180,
        stars: 3,
        researchPoints: 30,
        collectible: "moon_far_side_map",
        firstClearBonus: { xp: 150, researchPoints: 40 }
      }
    },

    // 3. Mars Missions
    mars_landing_core: {
      id: "mars_landing_core",
      destination: "mars",
      subDestination: "jezero_crater",
      titleEn: "Mars Colony Landing",
      titleZh: "红色火星基地拓荒",
      storyEn: "Navigate supersonic retro-propulsion through the Martian atmosphere to Jezero Crater.",
      storyZh: "进行超音速反推减速穿透火星稀薄大气，平稳着陆于耶泽罗古湖盆地。",
      completionEn: "Touchdown confirmed! Red dust settling around the Martian outpost.",
      completionZh: "着陆成功！火星红色沙尘缓缓散去，先锋基地圆满建立！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [6, 7, 8, 9],
      modifier: "accuracy",
      recommendedPayload: "cargo",
      objectives: [
        { id: "primary", type: "complete", descEn: "Touchdown on Mars", descZh: "平稳着陆火星", stars: 1 },
        { id: "first_try", type: "accuracy", target: 80, descEn: "First-try accuracy ≥ 80%", descZh: "首答正确率 ≥ 80%", stars: 1 },
        { id: "streak", type: "streak", target: 5, descEn: "Reach 5-answer streak", descZh: "达成 5 连胜答对", stars: 1 }
      ],
      eventPool: ["dust_storm", "engine_overheat", "navigation_drift"],
      reward: {
        xp: 150,
        stars: 3,
        researchPoints: 20,
        collectible: "mars_red_rock",
        firstClearBonus: { xp: 120, researchPoints: 30 }
      }
    },
    mars_rover_rescue: {
      id: "mars_rover_rescue",
      destination: "mars",
      subDestination: "valles_marineris",
      titleEn: "Mars Rover Rescue",
      titleZh: "峡谷救援太阳能漫游车",
      storyEn: "A stranded rover in Valles Marineris ran low on power; deliver replacement nuclear batteries.",
      storyZh: "一辆在水手号大峡谷深处的火星车遭遇沙尘暴断电，火速运送新型核电动力单元。",
      completionEn: "Power restored! The Martian rover reactivated its cameras and cheered!",
      completionZh: "电源重置成功！火星漫游车双眼相机重新亮起，再次欢快出发！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [7, 8, 12],
      modifier: "combo",
      recommendedPayload: "rover",
      objectives: [
        { id: "primary", type: "complete", descEn: "Reactivate Stranded Rover", descZh: "唤醒停运火星车", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 6, descEn: "Reach 6-answer streak", descZh: "达成 6 连胜答对", stars: 1 }
      ],
      eventPool: ["asteroid_alert", "dust_storm"],
      reward: {
        xp: 160,
        stars: 3,
        researchPoints: 25,
        collectible: "mars_battery_core",
        firstClearBonus: { xp: 130, researchPoints: 35 }
      }
    },
    mars_water_ice_survey: {
      id: "mars_water_ice_survey",
      destination: "mars",
      subDestination: "olympus_mons",
      titleEn: "Glacier Ice Core Survey",
      titleZh: "奥林匹斯极地冰川钻探",
      storyEn: "Ascend the Olympus volcanic slopes to extract underground Martian glacier ice cores.",
      storyZh: "抵达太阳系最高峰奥林匹斯山麓，采集地下深埋的古火星冰川冰芯。",
      completionEn: "Ice samples extracted! Pure subterranean Martian water crystals secured.",
      completionZh: "冰芯采集成功！纯净的火星地下古老冰晶样本已进入冷冻恒温舱！",
      lengthType: "epic",
      questionTarget: 20,
      fuelModifier: 1.1,
      mathFocus: [8, 9, 11, 12],
      modifier: "weak_facts",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Secure Martian Ice Core", descZh: "采集火星冰川样本", stars: 1 },
        { id: "first_try", type: "accuracy", target: 90, descEn: "First-try accuracy ≥ 90%", descZh: "首答正确率 ≥ 90%", stars: 1 },
        { id: "streak", type: "streak", target: 8, descEn: "Reach 8-answer streak", descZh: "达成 8 连胜答对", stars: 1 }
      ],
      eventPool: ["solar_storm", "engine_overheat", "dust_storm"],
      reward: {
        xp: 200,
        stars: 3,
        researchPoints: 35,
        collectible: "mars_polar_ice",
        firstClearBonus: { xp: 160, researchPoints: 45 }
      }
    },

    // 4. Jupiter Missions
    jupiter_red_spot_scan: {
      id: "jupiter_red_spot_scan",
      destination: "jupiter",
      subDestination: "great_red_spot",
      titleEn: "Great Red Spot Scan",
      titleZh: "大红斑超级风暴扫描",
      storyEn: "Fly within skimming distance of Jupiter's Great Red Spot to measure storm vortex winds.",
      storyZh: "超近距离飞掠木星气态巨行星表面，实时探测大红斑风暴中心的磁场与湍流。",
      completionEn: "Storm telemetry captured! The massive 400-year vortex reveals its secrets.",
      completionZh: "风暴气象遥测捕获完毕！已揭开四百年超级大红斑的核心动力学奥秘！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [6, 7, 8, 9, 12],
      modifier: "accuracy",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Scan Great Red Spot", descZh: "扫描大红斑风暴", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 6, descEn: "Reach 6-answer streak", descZh: "达成 6 连胜答对", stars: 1 }
      ],
      eventPool: ["solar_storm", "asteroid_alert"],
      reward: {
        xp: 170,
        stars: 3,
        researchPoints: 25,
        collectible: "jupiter_storm_data",
        firstClearBonus: { xp: 140, researchPoints: 35 }
      }
    },
    jupiter_europa_flyby: {
      id: "jupiter_europa_flyby",
      destination: "jupiter",
      subDestination: "europa",
      titleEn: "Europa Ocean Flyby",
      titleZh: "木卫二欧罗巴冰下海飞掠",
      storyEn: "Deploy deep radar to penetrate the smooth icy crust of Jupiter's ocean moon Europa.",
      storyZh: "释放深空穿透雷达探测木卫二欧罗巴光滑冰壳下的液态温暖海洋。",
      completionEn: "Sub-surface ocean confirmed! Giant liquid plumes detected breaching the ice!",
      completionZh: "冰下巨大海洋确认存在！雷达清晰观测到破冰而出的深空水汽羽流！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [7, 8, 9, 11, 12],
      modifier: "mixed",
      recommendedPayload: "satellite",
      objectives: [
        { id: "primary", type: "complete", descEn: "Complete Europa Flyby", descZh: "完成欧罗巴近距飞掠", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 7, descEn: "Reach 7-answer streak", descZh: "达成 7 连胜答对", stars: 1 }
      ],
      eventPool: ["navigation_drift", "unknown_signal"],
      reward: {
        xp: 190,
        stars: 3,
        researchPoints: 30,
        collectible: "jupiter_europa_ice",
        firstClearBonus: { xp: 150, researchPoints: 40 }
      }
    },
    jupiter_io_volcano: {
      id: "jupiter_io_volcano",
      destination: "jupiter",
      subDestination: "io",
      titleEn: "Io Volcano Exploration",
      titleZh: "木卫一极热火山群勘测",
      storyEn: "Shield the craft from immense radiation while studying sulfur geysers on volcanic Io.",
      storyZh: "开启重离子辐射护盾，近距离记录太阳系地质活动最剧烈的木卫一硫磺喷泉。",
      completionEn: "Volcanic telemetry recorded! High-temperature plasma readings secured safely.",
      completionZh: "极端火山数据记录完毕！耐高温传感器圆满带回熔岩喷发光谱！",
      lengthType: "epic",
      questionTarget: 20,
      fuelModifier: 1.1,
      mathFocus: [9, 12, 14, 16],
      modifier: "speed",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Complete Io Survey", descZh: "完成木卫一极限勘测", stars: 1 },
        { id: "first_try", type: "accuracy", target: 90, descEn: "First-try accuracy ≥ 90%", descZh: "首答正确率 ≥ 90%", stars: 1 },
        { id: "streak", type: "streak", target: 8, descEn: "Reach 8-answer streak", descZh: "达成 8 连胜答对", stars: 1 }
      ],
      eventPool: ["solar_storm", "engine_overheat", "asteroid_alert"],
      reward: {
        xp: 220,
        stars: 3,
        researchPoints: 40,
        collectible: "jupiter_io_sulfur",
        firstClearBonus: { xp: 180, researchPoints: 50 }
      }
    },

    // 5. Saturn Missions
    saturn_ring_explorer: {
      id: "saturn_ring_explorer",
      destination: "saturn",
      subDestination: "cassini_division",
      titleEn: "Ring Particle Explorer",
      titleZh: "穿越土星冰晶光环",
      storyEn: "Guide the rocket through Cassini Gap to capture pristine pure-water ring ice crystals.",
      storyZh: "精准操舵穿过卡西尼光环缝隙，微距捕获晶莹剔透的太阳系最美冰晶微粒。",
      completionEn: "Ring transit successful! Millions of glittering ring crystals reflected in sensors.",
      completionZh: "光环穿梭成功！亿万颗晶莹剔透的水冰颗粒在传感器中闪耀！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [8, 9, 12, 14],
      modifier: "accuracy",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Traverse Saturn Rings", descZh: "穿越土星光环", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 6, descEn: "Reach 6-answer streak", descZh: "达成 6 连胜答对", stars: 1 }
      ],
      eventPool: ["asteroid_alert", "navigation_drift"],
      reward: {
        xp: 200,
        stars: 3,
        researchPoints: 30,
        collectible: "saturn_ring_crystal",
        firstClearBonus: { xp: 160, researchPoints: 45 }
      }
    },
    saturn_titan_survey: {
      id: "saturn_titan_survey",
      destination: "saturn",
      subDestination: "titan",
      titleEn: "Titan Methane Sea Survey",
      titleZh: "土卫六泰坦甲烷湖探测",
      storyEn: "Descend into Titan's dense orange nitrogen atmosphere to sample golden hydrocarbon shores.",
      storyZh: "潜入土卫六浓厚金黄的氮气大气层，探测清澈平滑的液态甲烷极地海洋。",
      completionEn: "Atmospheric entry complete! Titan sonar reveals mirror-smooth methane lakes.",
      completionZh: "大气进入成功！泰坦深空声纳清晰描绘出宛如镜面的巨大甲烷湖泊！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [9, 12, 15, 18],
      modifier: "mixed",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Probe Titan Atmosphere", descZh: "探测泰坦大气", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 7, descEn: "Reach 7-answer streak", descZh: "达成 7 连胜答对", stars: 1 }
      ],
      eventPool: ["engine_overheat", "unknown_signal"],
      reward: {
        xp: 220,
        stars: 3,
        researchPoints: 35,
        collectible: "saturn_titan_fluid",
        firstClearBonus: { xp: 180, researchPoints: 50 }
      }
    },
    saturn_enceladus_ice: {
      id: "saturn_enceladus_ice",
      destination: "saturn",
      subDestination: "enceladus",
      titleEn: "Enceladus Geyser Plume Run",
      titleZh: "土卫二巨型冰泉伴飞",
      storyEn: "Perform a low flyby right through a towering ice geyser plume venting into Saturn space.",
      storyZh: "进行惊险贴地飞掠，直接穿过土卫二喷射至千米高空的巨大水汽冰泉。",
      completionEn: "Plume sampled! Organic molecule hints detected in fresh ice crystals!",
      completionZh: "冰泉样本采集完毕！新鲜冰晶光谱中探测到珍贵的基础有机分子信号！",
      lengthType: "epic",
      questionTarget: 20,
      fuelModifier: 1.1,
      mathFocus: [11, 12, 15, 20],
      modifier: "weak_facts",
      recommendedPayload: "satellite",
      objectives: [
        { id: "primary", type: "complete", descEn: "Sample Enceladus Plume", descZh: "采样土卫二冰泉", stars: 1 },
        { id: "first_try", type: "accuracy", target: 90, descEn: "First-try accuracy ≥ 90%", descZh: "首答正确率 ≥ 90%", stars: 1 },
        { id: "streak", type: "streak", target: 8, descEn: "Reach 8-answer streak", descZh: "达成 8 连胜答对", stars: 1 }
      ],
      eventPool: ["asteroid_alert", "solar_storm", "navigation_drift"],
      reward: {
        xp: 250,
        stars: 3,
        researchPoints: 50,
        collectible: "saturn_enceladus_crystal",
        firstClearBonus: { xp: 200, researchPoints: 60 }
      }
    },

    // 6. Deep Space Missions
    deep_asteroid_expedition: {
      id: "deep_asteroid_expedition",
      destination: "deepSpace",
      subDestination: "asteroid_belt",
      titleEn: "Asteroid Ceres Expedition",
      titleZh: "谷神星小行星带远征",
      storyEn: "Navigate millions of whirling rocky asteroids to dock with an automated mining relay.",
      storyZh: "穿行于数百万颗旋转的小行星碎石带，与谷神星深空自动化采矿中继站对接。",
      completionEn: "Rendezvous complete! Rare platinum meteorite samples loaded aboard.",
      completionZh: "交会对接圆满完成！珍贵的铂系稀有陨铁岩心已顺利装载登船！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [12, 14, 16, 18],
      modifier: "speed",
      recommendedPayload: "cargo",
      objectives: [
        { id: "primary", type: "complete", descEn: "Rendezvous with Ceres", descZh: "抵达谷神星中继站", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 6, descEn: "Reach 6-answer streak", descZh: "达成 6 连胜答对", stars: 1 }
      ],
      eventPool: ["asteroid_alert", "course_correction"],
      reward: {
        xp: 240,
        stars: 3,
        researchPoints: 40,
        collectible: "deep_asteroid_core",
        firstClearBonus: { xp: 190, researchPoints: 50 }
      }
    },
    deep_comet_chase: {
      id: "deep_comet_chase",
      destination: "deepSpace",
      subDestination: "comet_wild2",
      titleEn: "Comet Wild 2 Intercept",
      titleZh: "追赶维尔德二号彗星",
      storyEn: "Accelerate to hyper-velocity to match trajectories with an ancient icy interstellar comet.",
      storyZh: "极速加速追赶一颗从奥尔特云飞来的古老彗星，伴飞捕获彗尾原始星尘。",
      completionEn: "Comet dust captured! The aerogel grid is studded with 4.6-billion-year-old grains.",
      completionZh: "彗星尘埃捕捉成功！气凝胶收集板上点缀着46亿年前的太阳系原始星尘！",
      lengthType: "standard",
      questionTarget: 15,
      fuelModifier: 1.0,
      mathFocus: [13, 15, 17, 19],
      modifier: "combo",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Intercept Comet", descZh: "拦截并伴飞彗星", stars: 1 },
        { id: "first_try", type: "accuracy", target: 85, descEn: "First-try accuracy ≥ 85%", descZh: "首答正确率 ≥ 85%", stars: 1 },
        { id: "streak", type: "streak", target: 7, descEn: "Reach 7-answer streak", descZh: "达成 7 连胜答对", stars: 1 }
      ],
      eventPool: ["engine_overheat", "asteroid_alert"],
      reward: {
        xp: 260,
        stars: 3,
        researchPoints: 45,
        collectible: "deep_comet_dust",
        firstClearBonus: { xp: 210, researchPoints: 55 }
      }
    },
    deep_nebula_survey: {
      id: "deep_nebula_survey",
      destination: "deepSpace",
      subDestination: "orion_nebula",
      titleEn: "Interstellar Nebula Pioneer",
      titleZh: "猎户座星云先驱开拓",
      storyEn: "Journey past the heliopause into deep interstellar space to decode a harmonic cosmic signal.",
      storyZh: "穿越日球层顶进入真正无垠的星际空间，解析宇宙深处恒星摇篮发射的谐波信号。",
      completionEn: "Signal decoded! Interstellar nursery telemetry streaming back to Earth!",
      completionZh: "信号破译完成！来自星云深处恒星诞生的壮丽电波已永久载入人类科学史册！",
      lengthType: "epic",
      questionTarget: 20,
      fuelModifier: 1.1,
      mathFocus: [14, 16, 18, 20],
      modifier: "weak_facts",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: "Decode Nebula Signal", descZh: "破译深空星云信号", stars: 1 },
        { id: "first_try", type: "accuracy", target: 90, descEn: "First-try accuracy ≥ 90%", descZh: "首答正确率 ≥ 90%", stars: 1 },
        { id: "streak", type: "streak", target: 8, descEn: "Reach 8-answer streak", descZh: "达成 8 连胜答对", stars: 1 }
      ],
      eventPool: ["unknown_signal", "solar_storm", "navigation_drift"],
      reward: {
        xp: 300,
        stars: 3,
        researchPoints: 60,
        collectible: "deep_nebula_crystal",
        firstClearBonus: { xp: 250, researchPoints: 80 }
      }
    }
  },

  // 18 Space Museum Collectibles with Fun Science Facts
  COLLECTIBLES_DEFINITIONS: {
    earth_sat_photo: {
      id: "earth_sat_photo",
      planet: "earthOrbit",
      nameEn: "High-Res Earth Photo",
      nameZh: "高清地球全景图",
      icon: "🌍",
      rarity: "common",
      factEn: "Earth is the only planet known so far that has liquid water on its surface.",
      factZh: "地球是目前已知唯一表面拥有大面积液态水和生命的行星。"
    },
    earth_station_patch: {
      id: "earth_station_patch",
      planet: "earthOrbit",
      nameEn: "Alpha Station Mission Patch",
      nameZh: "阿尔法空间站任务徽章",
      icon: "🛰️",
      rarity: "common",
      factEn: "Space stations orbit Earth at around 27,600 km/h — completing a full loop every 90 minutes!",
      factZh: "空间站以约每小时 27,600 公里的速度绕地飞行，每 90 分钟就能绕地球一整圈！"
    },
    earth_telescope_lens: {
      id: "earth_telescope_lens",
      planet: "earthOrbit",
      nameEn: "Optical Mirror Segment",
      nameZh: "太空望远镜主镜微片",
      icon: "🔭",
      rarity: "rare",
      factEn: "Space telescopes avoid atmospheric blur, seeing galaxies billions of light-years away.",
      factZh: "太空望远镜位于大气层之上，能毫无阻碍地看清数十亿光年外的遥远星系。"
    },
    moon_basalt_rock: {
      id: "moon_basalt_rock",
      planet: "moon",
      nameEn: "Lunar Basalt Rock",
      nameZh: "月球古老玄武岩",
      icon: "🪨",
      rarity: "common",
      factEn: "Moon rocks are over 4 billion years old — older than almost any rock found on Earth!",
      factZh: "月球上的玄武岩有超过 40 亿年的历史，比地球上几乎所有现存岩石都要古老！"
    },
    moon_rover_wheel: {
      id: "moon_rover_wheel",
      planet: "moon",
      nameEn: "Rover Titanium Wheel",
      nameZh: "月球车钛合金网状轮",
      icon: "🛞",
      rarity: "rare",
      factEn: "Lunar rovers use wire mesh wheels instead of rubber because rubber would freeze and shatter in space.",
      factZh: "月球车使用钛合金金属网状车轮，因为普通的橡胶轮胎在月球极寒温差下会冻裂。"
    },
    moon_far_side_map: {
      id: "moon_far_side_map",
      planet: "moon",
      nameEn: "Far Side Topo Chart",
      nameZh: "月球背面全景地质图",
      icon: "🌑",
      rarity: "epic",
      factEn: "The far side of the Moon has many more craters because it faces open space.",
      factZh: "月球背面面向浩瀚宇宙，遭受的陨石撞击远多于面向地球的正面，密布巨大的环形山。"
    },
    mars_red_rock: {
      id: "mars_red_rock",
      planet: "mars",
      nameEn: "Martian Iron Basalt",
      nameZh: "火星氧化铁火山岩",
      icon: "🔴",
      rarity: "common",
      factEn: "Mars appears red because its soil is rich in iron oxide — the very same compound as rust!",
      factZh: "火星之所以呈现耀眼的红色，是因为它的地表土壤富含氧化铁——本质上和铁锈相同！"
    },
    mars_battery_core: {
      id: "mars_battery_core",
      planet: "mars",
      nameEn: "Rover Nuclear Power Cell",
      nameZh: "漫游车同位素热电池",
      icon: "🔋",
      rarity: "rare",
      factEn: "Radioisotope power generators allow Mars rovers to work for decades even during severe dust storms.",
      factZh: "放射性同位素热电机让火星漫游车在长达数月的全球沙尘暴中依然能保持充沛动力。"
    },
    mars_polar_ice: {
      id: "mars_polar_ice",
      planet: "mars",
      nameEn: "Martian Glacial Ice Core",
      nameZh: "火星极冠纯净冰芯",
      icon: "🧊",
      rarity: "epic",
      factEn: "Mars has enough water ice at its poles that if melted, it could cover the whole planet in an ocean!",
      factZh: "火星两极蕴藏着海量水冰，若全部融化，足以在火星表面形成覆盖全球的浅海！"
    },
    jupiter_storm_data: {
      id: "jupiter_storm_data",
      planet: "jupiter",
      nameEn: "Great Red Spot Vortex Core",
      nameZh: "大红斑风暴能量核",
      icon: "🌪️",
      rarity: "common",
      factEn: "Jupiter's Great Red Spot is a storm so huge that Earth could fit entirely inside it!",
      factZh: "木星大红斑是一个超级逆时针风暴，其尺寸巨大到足以把整个地球完整装进去！"
    },
    jupiter_europa_ice: {
      id: "jupiter_europa_ice",
      planet: "jupiter",
      nameEn: "Europa Cryo-Plume Sample",
      nameZh: "木卫二欧罗巴冰泉晶体",
      icon: "❄️",
      rarity: "rare",
      factEn: "Europa's hidden ocean might hold twice as much water as all of Earth's oceans combined!",
      factZh: "木卫二冰层下的液态海洋，其总储水量可能是地球所有海洋加起来的两倍以上！"
    },
    jupiter_io_sulfur: {
      id: "jupiter_io_sulfur",
      planet: "jupiter",
      nameEn: "Io Volcanic Sulfur Crystal",
      nameZh: "木卫一硫磺晶石",
      icon: "🌋",
      rarity: "epic",
      factEn: "Io has over 400 active volcanoes with sulfur plumes shooting up to 500 km high!",
      factZh: "木卫一拥有 400 多座活跃火山，喷发的硫磺羽流最高能冲上 500 公里的太空！"
    },
    saturn_ring_crystal: {
      id: "saturn_ring_crystal",
      planet: "saturn",
      nameEn: "Saturn Ring Ice Specimen",
      nameZh: "土星光环水冰标本",
      icon: "💍",
      rarity: "common",
      factEn: "Saturn's rings span 280,000 km across, but in many places they are only 10 to 30 meters thick!",
      factZh: "土星光环横跨 28 万公里，但在很多区域它的厚度居然只有短短的 10 到 30 米！"
    },
    saturn_titan_fluid: {
      id: "saturn_titan_fluid",
      planet: "saturn",
      nameEn: "Titan Liquid Methane Vial",
      nameZh: "泰坦液态甲烷标本瓶",
      icon: "🧪",
      rarity: "rare",
      factEn: "Titan is the only moon with a thick atmosphere and lakes of liquid methane and ethane.",
      factZh: "泰坦是太阳系唯一拥有浓厚大气层、且表面有真实液态湖泊和河流的卫星！"
    },
    saturn_enceladus_crystal: {
      id: "saturn_enceladus_crystal",
      planet: "saturn",
      nameEn: "Enceladus Geyser Particle",
      nameZh: "土卫二冰羽有机微粒",
      icon: "💎",
      rarity: "epic",
      factEn: "Enceladus shoots ice geysers directly into space, constantly replenishing Saturn's E-ring!",
      factZh: "土卫二的冰喷泉直接喷入外太空，不断为土星著名的 E 环补充新鲜洁净的冰晶微粒！"
    },
    deep_asteroid_core: {
      id: "deep_asteroid_core",
      planet: "deepSpace",
      nameEn: "Ceres Platinum Meteorite",
      nameZh: "谷神星铂族陨铁矿",
      icon: "☄️",
      rarity: "common",
      factEn: "Ceres is the largest object in the asteroid belt and makes up one-third of the belt's total mass.",
      factZh: "谷神星是小行星带中最大的天体，其质量占整个小行星带总质量的三分之一！"
    },
    deep_comet_dust: {
      id: "deep_comet_dust",
      planet: "deepSpace",
      nameEn: "Cometary Aerogel Matrix",
      nameZh: "彗尾星尘气凝胶标本",
      icon: "✨",
      rarity: "rare",
      factEn: "Comets are like 'dirty snowballs' containing ancient ice preserved from the birth of the Sun.",
      factZh: "彗星就像是太阳系诞生初期的‘脏雪球’，完整封存着 46 亿年前最原始的太阳系物质。"
    },
    deep_nebula_crystal: {
      id: "deep_nebula_crystal",
      planet: "deepSpace",
      nameEn: "Interstellar Stardust Prism",
      nameZh: "星际星云光子三棱晶",
      icon: "🌌",
      rarity: "epic",
      factEn: "Nebulae are stellar nurseries where clouds of gas and cosmic dust collapse to form brand new stars!",
      factZh: "星云是孕育恒星的宇宙摇篮，气体和尘埃在引力坍缩下点燃核聚变，诞生全新的璀璨群星！"
    }
  },

  // Research Lab Cosmetic Upgrades
  RESEARCH_TREE_DEFINITIONS: {
    trails: [
      { id: "trail_standard", nameEn: "Standard Flame", nameZh: "标准火箭烈焰", cost: 0, color: 0xff4500, icon: "🔥", unlockedByDefault: true },
      { id: "trail_plasma_blue", nameEn: "Blue Plasma Trail", nameZh: "幽蓝等离子尾焰", cost: 30, color: 0x38bdf8, icon: "⚡", reqEn: "Reach Commander Level 3", reqZh: "达到指挥官等级 3" },
      { id: "trail_ion_green", nameEn: "Ion Green Glow", nameZh: "翠绿离子推进焰", cost: 60, color: 0x10b981, icon: "🟢", reqEn: "Earn 15 Mission Stars", reqZh: "累计获得 15 颗任务之星" },
      { id: "trail_solar_flare", nameEn: "Solar Flare Crimson", nameZh: "太阳耀斑赤红焰", cost: 100, color: 0xef4444, icon: "🔴", reqEn: "Complete 3 Mars Missions", reqZh: "完成 3 次火星任务" },
      { id: "trail_starlight", nameEn: "Interstellar Starlight", nameZh: "银河星辉闪耀焰", cost: 150, color: 0xc084fc, icon: "✨", reqEn: "Collect 8 Space Museum Items", reqZh: "收集 8 件太空博物馆藏品" }
    ]
  },

  // In-Flight Dynamic Events
  EVENT_DEFINITIONS: {
    asteroid_alert: {
      id: "asteroid_alert",
      titleEn: "☄️ ASTEROID PROXIMITY ALERT",
      titleZh: "☄️ 小行星碎片密集预警",
      descEn: "Dense micrometeoroids detected! Calculate trajectory adjustments to clear the hazard field.",
      descZh: "前方探测到密集微流星群！请计算轨道微调数据，启动机动矢量喷管避开障碍！",
      icon: "☄️",
      questionCount: 2,
      bonusXP: 20
    },
    engine_overheat: {
      id: "engine_overheat",
      titleEn: "🔥 ENGINE THERMAL STABILIZATION",
      titleZh: "🔥 主推进器热力平衡校准",
      descEn: "Combustion chamber temperature rising! Solve the math facts to balance the liquid cooling loop.",
      descZh: "燃烧室温度偏高！快速计算冷却剂循环配比，使火箭发动机温度恢复绿色安全区间！",
      icon: "🔥",
      questionCount: 2,
      bonusXP: 20
    },
    navigation_drift: {
      id: "navigation_drift",
      titleEn: "🧭 COURSE CORRECTION",
      titleZh: "🧭 深空航向惯性修正",
      descEn: "Gravity gradient caused a minor course drift. Solve the flight vector equation to align with target orbit.",
      descZh: "引力梯度引起了微小航向偏角。计算飞行矢量修正角度，确保火箭精准切入预定轨道！",
      icon: "🧭",
      questionCount: 2,
      bonusXP: 20
    },
    solar_storm: {
      id: "solar_storm",
      titleEn: "☀️ SOLAR RADIATION SHIELDING",
      titleZh: "☀️ 太阳风暴电磁护盾强化",
      descEn: "Solar particle wave incoming! Recalibrate the magnetic deflector coils to shield flight computers.",
      descZh: "高能太阳风粒子流即将来袭！快速计算磁偏转线圈频率，为机载计算机强化能量护盾！",
      icon: "☀️",
      questionCount: 3,
      bonusXP: 30
    },
    unknown_signal: {
      id: "unknown_signal",
      titleEn: "📡 INTERSTELLAR SIGNAL DECODER",
      titleZh: "📡 宇宙深空未知信号解码",
      descEn: "A rhythmic harmonic broadcast received by deep radar. Calculate the number harmonics to decode it.",
      descZh: "深空雷达接收到一段规律的谐波无线电脉冲！计算数字乘除序列，破译这段神秘外空信号！",
      icon: "📡",
      questionCount: 2,
      bonusXP: 25
    },
    comet_scan: {
      id: "comet_scan",
      titleEn: "✨ UNEXPECTED COMET FLYBY",
      titleZh: "✨ 偶遇彗星超近距伴飞",
      descEn: "A dazzling comet with a glowing tail crossed the path! Solve the scan calculation for bonus museum research.",
      descZh: "一颗散发着绚丽光芒的彗星掠过航道！完成光学快门计算，为太空博物馆记录这张珍贵瞬间！",
      icon: "✨",
      questionCount: 1,
      bonusXP: 15
    }
  },

  // Mastery Score Thresholds (0 ~ 100)
  MASTERY_LEVELS: {
    NEEDS_PRACTICE: { min: 0, max: 39, labelEn: "Needs Practice", labelZh: "需要练习", color: "#f87171" },
    LEARNING: { min: 40, max: 69, labelEn: "Learning", labelZh: "正在学习", color: "#fbbf24" },
    GOOD: { min: 70, max: 89, labelEn: "Good", labelZh: "掌握良好", color: "#60a5fa" },
    MASTERED: { min: 90, max: 100, labelEn: "Mastered", labelZh: "完全掌握", color: "#34d399" }
  },

  // Rocket Model Unlock Conditions (Hooked to Progression Milestones)
  ROCKET_UNLOCK_RULES: {
    classic: { reqEn: "Unlocked by default", reqZh: "默认可用", check: () => true },
    starship: { reqEn: "Complete your 1st Moon mission", reqZh: "完成 1 次月球任务", check: (p) => (p.missionRecords && Object.keys(p.missionRecords).some(k => k.startsWith("moon_") && p.missionRecords[k].completedCount > 0)) || (p.destinationsVisited && p.destinationsVisited.moon) || (p.gamesCompleted >= 1) },
    falconHeavy: { reqEn: "Earn 12 Mission Stars", reqZh: "累计获得 12 颗任务之星", check: (p) => (p.progression && p.progression.totalStars >= 12) || (p.masteredTablesCount >= 3) },
    longMarch: { reqEn: "Complete missions on 3 different planets", reqZh: "探索 3 个不同行星目的地", check: (p) => (p.destinationsVisited && Object.keys(p.destinationsVisited).length >= 3) || (p.totalCorrectAnswers >= 50) },
    cyber: { reqEn: "Collect 6 Space Museum Items", reqZh: "收集 6 件太空博物馆藏品", check: (p) => (p.collectibles && p.collectibles.length >= 6) || (p.totalCorrectAnswers >= 150) }
  },

  // Rocket Theme Unlock Conditions
  THEME_UNLOCK_RULES: {
    explorer: { reqEn: "Unlocked by default", reqZh: "默认涂装", check: () => true },
    fire: { reqEn: "Achieve a 6-streak combo", reqZh: "达成 6 连胜答对", check: (p) => (p.maxComboAllTime >= 6) },
    forest: { reqEn: "Reach Commander Level 3", reqZh: "晋升至探月领航员 (Lv.3)", check: (p) => (p.progression && p.progression.commanderLevel >= 3) || (p.gamesCompleted >= 3) },
    lightning: { reqEn: "Achieve a 10-streak combo", reqZh: "达成 10 连胜答对", check: (p) => (p.maxComboAllTime >= 10) },
    galaxy: { reqEn: "Earn 20 Mission Stars", reqZh: "累计获得 20 颗任务之星", check: (p) => (p.progression && p.progression.totalStars >= 20) || (p.badges && p.badges.length >= 5) },
    lunar_white: { reqEn: "Complete all 3 Moon Missions", reqZh: "完成全部 3 个月球任务", check: (p) => p.missionRecords && ["moon_crater_survey", "moon_rover_delivery", "moon_beacon_rescue"].every(id => p.missionRecords[id] && p.missionRecords[id].completedCount > 0) }
  }
};

if (typeof module !== "undefined") {
  module.exports = { CONFIG };
} else {
  window.CONFIG = CONFIG;
}
