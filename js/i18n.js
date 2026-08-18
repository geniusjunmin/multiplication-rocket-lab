/**
 * Multiplication Rocket Lab - Internationalization (js/i18n.js)
 * Version 4.0.0 Space Adventure Progression Architecture
 * Supports English (en - UK default) and Chinese (zh)
 */
class I18nManager {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = {
      en: {
        appTitle: "Multiplication Rocket Lab 4.0 🚀",
        tagline: "Master Times Tables & Division • Build 3D Rockets • Explore the Solar System!",
        
        // Navigation & General UI
        btnStartGame: "🚀 Mission Board",
        btnQuickMission: "⚡ Quick Mission",
        btnContinueGame: "▶️ Continue Mission",
        btnSettings: "⚙️ Math Setup",
        btnReport: "📊 Parent Dashboard",
        btnMuseum: "🏛️ Space Museum",
        btnGarage: "🚀 Rocket Garage",
        btnHome: "🏠 Home",
        btnPause: "⏸️ Pause",
        btnResume: "▶️ Resume",
        btnSave: "💾 Save Settings",
        btnCancel: "Cancel",
        btnClose: "Close",
        btnExportJson: "📥 Export Data (JSON)",
        btnImportJson: "📤 Import Data (JSON)",
        btnExportCsv: "📊 Export CSV Report",
        btnClearData: "🗑️ Reset Player Data",
        devSkipQuiz: "⚡ Quick Complete Quiz (Dev)",
        devFillFuel: "⚡ Instant 100% Fuel (Dev)",

        // Profile & Progression HUD
        whosPlaying: "Who's playing?",
        addPlayer: "➕ Add Player",
        profileNamePrompt: "Enter Child's Name:",
        selectYearGroup: "Select Year Group:",
        commanderLevelLabel: "Commander Level",
        totalStarsLabel: "Mission Stars",
        researchPointsLabel: "Research Points",
        todayMissionsLabel: "Today's Missions",
        recommendedLabel: "RECOMMENDED MISSION",
        btnStartRecommended: "🚀 Start Mission",

        // Mission Board & Solar System Map
        missionBoardTitle: "🪐 Solar System Mission Board",
        missionBoardSubtitle: "Choose an interplanetary expedition to launch!",
        planetExplored: "Explored",
        starsCount: "Stars",
        samplesCount: "Samples",
        btnSelectMission: "Launch Briefing",
        allDestinations: "Solar System Map",

        // Mission Briefing Modal
        briefingTitle: "🚀 Mission Flight Briefing",
        storyHeader: "MISSION OBJECTIVE",
        bonusHeader: "STAR OBJECTIVES",
        payloadHeader: "RECOMMENDED PAYLOAD",
        routeChoiceHeader: "ROUTE DECISION",
        safeRoute: "🟢 Safe Route (Standard Questions)",
        boostRoute: "⚡ Boost Route (Challenging Math + Bonus Star Chance)",
        btnLaunchBriefing: "🔥 Launch Mission Prep",

        // Settings Screen
        settingsTitle: "⚙️ Math Challenge & Mission Settings",
        playerNameLabel: "Child's Name:",
        curriculumPresetLabel: "UK Curriculum Presets:",
        freeChallengeLabel: "Free Challenge Presets:",
        selectTablesLabel: "Select Multiplication Tables (1-12):",
        selectAll: "Select All",
        difficultyLabel: "Challenge Difficulty (How you answer):",
        diffEasy: "Easy (3 Choices + Visual Arrays & Hints)",
        diffNormal: "Normal (Keypad Input + Smart Hints)",
        diffHard: "Hard (Timer Challenge + Speed Bonus)",
        timerSelectLabel: "Question Timer:",
        timerOff: "Timer Off (No Time Pressure)",
        timer5s: "5 Seconds (Fast Pilot)",
        timer8s: "8 Seconds (Standard)",
        timer10s: "10 Seconds (Extended)",
        reducedMotionLabel: "Reduce Motion Effects (Sensory Friendly)",

        // Blueprint & Assembly
        blueprintTitle: "📐 Rocket Engineering Blueprint",
        blueprintSubtitle: "Answer math challenges to collect all 10 rocket parts!",
        assemblyBlueprintTitle: "Design Blueprint",
        assemblyProgress: "Assembly Ready",
        partsCollected: "Parts Collected:",
        btnStartAnswering: "✏️ Start Quiz to Collect Parts",
        btnGoAssembly: "🔧 3D Assembly Dock",
        btnQuickPrep: "⚡ Quick Assembly (Owns Rocket)",
        assemblyTitle: "🔧 3D Rocket Assembly Workshop",
        assemblySubtitle: "Click unlocked parts to snap them onto your 3D rocket!",
        btnInstallAll: "⚡ Auto-Assemble All",
        rocketModelLabel: "3D Rocket Model:",
        rocketThemeLabel: "Theme Color:",
        btnGoFuel: "⛽ Proceed to Fuel Chamber",
        partsInstalled: "Parts Installed:",
        lockedModel: "🔒 Complete missions to unlock",
        partInstalledToast: "✅ {part} Installed ({current}/{total})",
        assemblyCompleteCelebration: "🚀 ROCKET ASSEMBLY COMPLETE!",
        modalCompleteTitle: "All Rocket Parts Unlocked & Assembled!",

        // Fuel Screen
        fuelTitle: "⛽ Math Fuel Chamber",
        fuelSubtitle: "Correct answers load rocket propulsion fuel! Maintain a streak for bonuses!",
        fuelStatusEmpty: "Fuel low. Waiting for fuel loading...",
        fuelStatusHalf: "Fuel loading in progress...",
        fuelStatusFull: "🎉 Fuel 100% Full! Rocket Propulsion Online!",
        fuelFullAlert: "🎉 Fuel 100% Full! Rocket propulsion online! Click 【🚀 Ready for Launch!】 below!",
        btnReadyLaunch: "🚀 Ready for Launch!",
        fuelSuccessBoost: "⛽ Fuel Loaded! +{boost} Units",
        comboBonusText: "🔥 COMBO BONUS +{bonus}%",

        // Launch & Flight
        checklistTitle: "System Pre-flight Checklist",
        sysNav: "⚙️ Guidance & Navigation",
        sysEng: "🔥 Engine Ignition System",
        sysFuel: "⛽ Math Propulsion Fuel",
        sysComp: "🛰️ Math Core Processor",
        btnSkipCountdown: "⏩ Skip Countdown",
        spaceVictoryTitle: "MISSION SUCCESS! ARRIVED AT DESTINATION! 🌌",
        newPassportStamp: "🎉 New Space Passport Stamp Unlocked!",
        btnViewResults: "📊 Mission Debrief & Results",
        btnReplayLanding: "🔄 Replay Arrival Cinematic",

        // In-Flight Events
        eventAlertHeader: "⚡ FLIGHT EVENT ENCOUNTER",
        btnSolveEvent: "Calculate Response",
        eventSuccessToast: "✨ Event Resolved! Navigation Stable (+{xp} XP)",
        eventRetryMsg: "Navigation unstable... Let's calculate again!",

        // Mission Debrief (Results Screen)
        resultsTitle: "🏆 Mission Flight Debrief",
        debriefFirstTryAcc: "First-Try Accuracy",
        debriefCompletedRate: "Final Completion",
        debriefScore: "Mission Score",
        debriefMaxStreak: "Highest Streak",
        debriefObjectivesTitle: "MISSION OBJECTIVES",
        debriefRewardsTitle: "MISSION REWARDS",
        debriefNewLevelTitle: "🎉 COMMANDER PROMOTED!",
        debriefSkillImproved: "🧠 SKILL IMPROVED!",
        debriefNewDiscovery: "✨ NEW DISCOVERY UNLOCKED!",
        btnTryAgainForStar: "⭐ Retry to Earn 3rd Star",
        btnNextRecommended: "🚀 Next Mission",
        btnRestartGame: "🚀 Launch Another Mission",
        btnRetryWrongs: "📝 Practice Missed Facts",

        // Space Museum
        museumTitle: "🏛️ Space Exploration Museum",
        museumSubtitle: "Discover planetary samples and relics collected across your space expeditions!",
        museumSetCompleted: "🎉 Full Set Assembled! Special Rocket Theme Unlocked!",

        // Rocket Garage & Research Lab
        garageTitle: "🚀 Rocket Garage & Research Lab",
        garageSubtitle: "Equip unlocked rocket models, futuristic trails and payload gear!",
        researchTrailTitle: "Engine Trail Research",
        equippedBadge: "EQUIPPED",
        btnEquip: "Equip",
        btnUnlockResearch: "Unlock ({cost} RP)",

        // Feedback
        correctFeedback: "✨ Excellent! Correct Answer!",
        wrongFeedback: "Not quite, check the strategy hint below and try again!",
        timeoutFeedback: "⏰ Time expired! Read the smart strategy hint.",
        comboLevel1: "🔥 Booster Level 1",
        comboLevel2: "🔥🔥 Booster Level 2",
        comboLevel3: "⚡ HYPER BOOST!"
      },
      zh: {
        appTitle: "乘法火箭实验室 4.0 🚀",
        tagline: "掌握九九乘除法 • 3D 拼装火箭 • 探索太阳系太空冒险！",

        // Navigation & General UI
        btnStartGame: "🚀 太空任务面板",
        btnQuickMission: "⚡ 快速出航",
        btnContinueGame: "▶️ 继续任务",
        btnSettings: "⚙️ 数学设置",
        btnReport: "📊 家长学情中心",
        btnMuseum: "🏛️ 太空博物馆",
        btnGarage: "🚀 火箭机库",
        btnHome: "🏠 首页",
        btnPause: "⏸️ 暂停",
        btnResume: "▶️ 继续",
        btnSave: "💾 保存设置",
        btnCancel: "取消",
        btnClose: "关闭",
        btnExportJson: "📥 导出学习数据 (JSON)",
        btnImportJson: "📤 导入学习数据 (JSON)",
        btnExportCsv: "📊 导出学情报表 (CSV)",
        btnClearData: "🗑️ 重置当前学员数据",
        devSkipQuiz: "⚡ 快速完成答题 (测试)",
        devFillFuel: "⚡ 快速加满 100% 燃料 (测试)",

        // Profile & Progression HUD
        whosPlaying: "谁在探索太空？",
        addPlayer: "➕ 添加小宇航员",
        profileNamePrompt: "请输入小宇航员名字:",
        selectYearGroup: "选择数学年级课程:",
        commanderLevelLabel: "指挥官军衔",
        totalStarsLabel: "任务之星",
        researchPointsLabel: "科研升级点",
        todayMissionsLabel: "今日任务",
        recommendedLabel: "⭐ 今日推荐任务",
        btnStartRecommended: "🚀 立即执行",

        // Mission Board & Solar System Map
        missionBoardTitle: "🪐 太阳系航天任务面板",
        missionBoardSubtitle: "选择行星目的地与专属科学探索任务！",
        planetExplored: "探索进度",
        starsCount: "星数",
        samplesCount: "标本",
        btnSelectMission: "查看任务简报",
        allDestinations: "太阳系全景图",

        // Mission Briefing Modal
        briefingTitle: "🚀 航天任务简报",
        storyHeader: "任务背景与目标",
        bonusHeader: "任务星级目标",
        payloadHeader: "推荐搭载载荷",
        routeChoiceHeader: "航线规划决策",
        safeRoute: "🟢 稳妥航线 (常规难度数学题)",
        boostRoute: "⚡ 极速航线 (高阶挑战题 + 额外星级机会)",
        btnLaunchBriefing: "🔥 开始任务准备",

        // Settings Screen
        settingsTitle: "⚙️ 数学挑战与课程设置",
        playerNameLabel: "学员姓名:",
        curriculumPresetLabel: "英国国家课程预设:",
        freeChallengeLabel: "自由计算范围预设:",
        selectTablesLabel: "自定义选择乘法表 (1-12):",
        selectAll: "全选",
        difficultyLabel: "答题模式与辅助策略:",
        diffEasy: "简单模式 (3个选项 + 点阵视觉辅助)",
        diffNormal: "标准模式 (数字键盘 + 策略提示)",
        diffHard: "极速挑战 (限时答题 + 速度加分)",
        timerSelectLabel: "限时挑战时长:",
        timerOff: "无时间限制 (轻松练习)",
        timer5s: "5 秒 (极速飞行员)",
        timer8s: "8 秒 (标准)",
        timer10s: "10 秒 (充裕思考)",
        reducedMotionLabel: "减少动态视效 (友好护眼模式)",

        // Blueprint & Assembly
        blueprintTitle: "📐 火箭工程设计蓝图",
        blueprintSubtitle: "回答数学计算挑战，解锁全部 10 个火箭精密部件！",
        assemblyBlueprintTitle: "设计蓝图",
        assemblyProgress: "装配就绪率",
        partsCollected: "已解锁零件:",
        btnStartAnswering: "✏️ 答题解锁零件",
        btnGoAssembly: "🔧 3D 组装车间",
        btnQuickPrep: "⚡ 极速组装 (已拥有型号)",
        assemblyTitle: "🔧 3D 火箭组装车间",
        assemblySubtitle: "点击下方已解包零件，看着它们精准卡扣飞入 3D 火箭！",
        btnInstallAll: "⚡ 一键全自动组装已解锁零件",
        rocketModelLabel: "3D 火箭型号:",
        rocketThemeLabel: "火箭涂装配色:",
        btnGoFuel: "⛽ 冲向燃料补充舱",
        partsInstalled: "已安装零件:",
        lockedModel: "🔒 完成指定任务解锁",
        partInstalledToast: "✅ {part} 已安装 ({current}/{total})",
        assemblyCompleteCelebration: "🚀 火箭全组件组装完成！",
        modalCompleteTitle: "火箭全组件已完成组装！",

        // Fuel Screen
        fuelTitle: "⛽ 数学能量燃料舱",
        fuelSubtitle: "每次正确回答均可注入燃料！保持连击可触发高能加成！",
        fuelStatusEmpty: "燃料不足，等待加注...",
        fuelStatusHalf: "燃料加注中...",
        fuelStatusFull: "🎉 燃料已加满 100%！推进系统就绪！",
        fuelFullAlert: "🎉 燃料已加满！火箭发射系统就绪！点击下方【🚀 准备发射火箭！】点火出航！",
        btnReadyLaunch: "🚀 准备发射火箭！",
        fuelSuccessBoost: "⛽ 燃料加注成功！+{boost} 能量",
        comboBonusText: "🔥 连击加成 +{bonus}%",

        // Launch & Flight
        checklistTitle: "点火升空前系统自检",
        sysNav: "⚙️ 航向导航计算机",
        sysEng: "🔥 推进引擎点火系统",
        sysFuel: "⛽ 数学高能推进燃料",
        sysComp: "🛰️ 核心计算处理器",
        btnSkipCountdown: "⏩ 跳过倒计时",
        spaceVictoryTitle: "任务圆满成功！已顺利抵达目标星球！🌌",
        newPassportStamp: "🎉 获得一枚新太空护照纪念印章！",
        btnViewResults: "📊 查看任务详细总结",
        btnReplayLanding: "🔄 再看一次降落动画",

        // In-Flight Events
        eventAlertHeader: "⚡ 途中突发空情事件",
        btnSolveEvent: "执行机动计算",
        eventSuccessToast: "✨ 事件圆满化解！航向已恢复稳定 (+{xp} XP)",
        eventRetryMsg: "航向轻微漂移... 让我们重新计算一次！",

        // Mission Debrief (Results Screen)
        resultsTitle: "🏆 航天任务总结与战报",
        debriefFirstTryAcc: "首答正确率",
        debriefCompletedRate: "最终完成率",
        debriefScore: "任务得分",
        debriefMaxStreak: "最高连续答对",
        debriefObjectivesTitle: "任务目标完成情况",
        debriefRewardsTitle: "本次任务探索奖励",
        debriefNewLevelTitle: "🎉 指挥官军衔晋升！",
        debriefSkillImproved: "🧠 掌握薄弱知识点！",
        debriefNewDiscovery: "✨ 获得全新太空馆藏品！",
        btnTryAgainForStar: "⭐ 再试一次夺得第 3 颗星",
        btnNextRecommended: "🚀 开启下一阶段任务",
        btnRestartGame: "🚀 开始新任务",
        btnRetryWrongs: "📝 专项练习错题",

        // Space Museum
        museumTitle: "🏛️ 太空探索标本博物馆",
        museumSubtitle: "点开行星标本，探索真实的宇宙科学奥秘！",
        museumSetCompleted: "🎉 该星球藏品全集齐！已解锁限定专属火箭涂装！",

        // Rocket Garage & Research Lab
        garageTitle: "🚀 火箭机库与科研工坊",
        garageSubtitle: "切换 3D 火箭型号、炫酷离子尾焰与科学载荷！",
        researchTrailTitle: "引擎推进尾焰研发",
        equippedBadge: "已装备",
        btnEquip: "装备",
        btnUnlockResearch: "解锁 ({cost} RP)",

        // Feedback
        correctFeedback: "✨ 太棒了！回答正确！",
        wrongFeedback: "差一点点，看下方小提示再试一次！",
        timeoutFeedback: "⏰ 时间到！阅读思路提示再接再厉！",
        comboLevel1: "🔥 一级助推激活",
        comboLevel2: "🔥🔥 二级增压就绪",
        comboLevel3: "⚡ 超能推进 HYPER BOOST!"
      }
    };
  }

  detectLanguage() {
    if (typeof navigator !== "undefined" && navigator.language) {
      if (navigator.language.startsWith("zh")) return "zh";
    }
    return "en";
  }

  setLanguage(lang) {
    if (lang === "en" || lang === "zh") {
      this.currentLanguage = lang;
      this.updateDOM();
      return true;
    }
    return false;
  }

  t(key, params = {}) {
    const dict = this.translations[this.currentLanguage] || this.translations.en;
    let text = dict[key] || this.translations.en[key] || key;

    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`\\{${p}\\}`, "g"), params[p]);
    });
    return text;
  }

  updateDOM() {
    if (typeof document === "undefined") return;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (key) {
        el.innerText = this.t(key);
      }
    });

    const langBtn = document.getElementById("btn-lang-toggle");
    if (langBtn) {
      langBtn.innerText = this.currentLanguage === "en" ? "🇬🇧 EN" : "🇨🇳 中文";
    }

    if (window.uiManager && window.uiManager.updateDOM) {
      window.uiManager.updateDOM();
    }
  }
}

window.i18n = new I18nManager();
if (typeof module !== "undefined") {
  module.exports = { I18nManager };
}
