/**
 * Multiplication Rocket Lab - Internationalization (js/i18n.js)
 * Supports English (en - UK default) and Chinese (zh) - Version 3.0.0
 */
class I18nManager {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = {
      en: {
        appTitle: "Multiplication Rocket Lab 3.0 🚀",
        tagline: "Master Times Tables & Division • Build 3D Rockets • Explore the Solar System!",
          // Navigation & General UI
        btnStartGame: "🚀 Start Rocket Mission",
        btnContinueGame: "▶️ Continue Mission",
        btnSettings: "⚙️ Math & Mission Setup",
        btnReport: "📊 Parent Dashboard",
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

        // Profile Selector
        whosPlaying: "Who's playing?",
        addPlayer: "➕ Add Player",
        profileNamePrompt: "Enter Child's Name:",
        selectYearGroup: "Select Year Group:",

        // Settings Screen - Math Missions
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

        // Operations
        opMultiplyOnly: "Multiplication (×) Only",
        opDivideOnly: "Division (÷) Only",
        opBoth: "Multiplication & Division (× & ÷)",

        // Blueprint Screen
        blueprintTitle: "📐 Rocket Engineering Blueprint",
        blueprintSubtitle: "Answer math challenges to collect all 10 rocket parts!",
        partsCollected: "Parts Collected:",
        btnStartAnswering: "✏️ Start Quiz to Collect Parts",
        btnGoAssembly: "🔧 3D Assembly Dock",

        // Quiz Screen
        hudQuestion: "Question",
        hudStreak: "Streak",
        hudTime: "Time",
        hudScore: "Score",
        submitAnswer: "Submit Answer ↵",
        easyHintLabel: "💡 Visual Helper:",
        stratHintTitle: "🧠 Smart Strategy Hint:",

        // Assembly Screen
        assemblyTitle: "🔧 3D Rocket Assembly Workshop",
        assemblySubtitle: "Click unlocked parts to snap them onto your 3D rocket!",
        btnInstallAll: "⚡ Auto-Assemble All",
        rocketModelLabel: "3D Rocket Model:",
        rocketThemeLabel: "Theme Color:",
        btnGoFuel: "⛽ Proceed to Fuel Chamber",
        partsInstalled: "Parts Installed:",
        lockedModel: "🔒 Complete launches to unlock",
        partInstalledToast: "✅ {part} Installed ({current}/{total})",
        assemblyCompleteCelebration: "🚀 ROCKET ASSEMBLY COMPLETE!",
        modalCompleteTitle: "All Rocket Parts Unlocked & Assembled!",

        // Fuel Screen
        fuelTitle: "⛽ Math Fuel Chamber",
        fuelSubtitle: "Each correct answer adds +10% fuel! Maintain a streak for +5% bonus!",
        fuelStatusEmpty: "Fuel low. Waiting for fuel loading...",
        fuelStatusHalf: "Fuel loading in progress...",
        fuelStatusFull: "🎉 Fuel 100% Full! Rocket Ignition System Ready!",
        fuelFullAlert: "🎉 Fuel 100% Full! Rocket propulsion online! Click 【🚀 Ready for Launch!】 below!",
        btnReadyLaunch: "🚀 Ready for Launch!",
        fuelSuccessBoost: "⛽ Fuel Loaded! +{boost}%",
        comboBonusText: "🔥 COMBO BONUS +{bonus}%",

        // Mission Control & Destinations
        selectDestinationTitle: "🪐 Select Interplanetary Mission Destination:",
        destEarthOrbit: "🌍 Earth Orbit (400 km)",
        destMoon: "🌙 Moon Base Mission",
        destMars: "🔴 Mars Colony Mission",
        destJupiter: "🪐 Jupiter Flyby Mission",
        destSaturn: "🪐 Saturn Ring Explorer",
        destDeepSpace: "🌌 Deep Space Explorer",
        btnSelectDest: "Select Destination ➔",
        spacePassportTitle: "🎫 Space Passport Stamps",

        // Launch & Cinematic Stages
        launchTitle: "🚀 Rocket Launch Control Center",
        btnSkipCountdown: "⏩ Skip Countdown",
        btnReplayMission: "▶️ Replay Space Mission",
        checklistTitle: "System Pre-flight Checklist",
        sysNav: "⚙️ Guidance & Navigation",
        sysEng: "🔥 Engine Ignition System",
        sysFuel: "⛽ Math High-Energy Fuel",
        sysComp: "🛰️ Math Core Processor",
        statusChecking: "Checking...",
        statusReady: "✅ Ready",
        ignitionText: "IGNITION!",
        orbitAchievedBanner: "🌍 ORBIT ACHIEVED",
        transferBurnBanner: "🚀 HYPER-DRIVE TRANSFER BURN",
        destinationArrivalBanner: "🪐 ARRIVED AT {destination}!",
        spaceVictoryTitle: "MISSION COMPLETE! ARRIVED AT DESTINATION! 🌌",
        btnViewResults: "📊 View Mission Summary",
        newPassportStamp: "🎉 New Space Passport Stamp Unlocked!",

        // Results Screen
        resultsTitle: "🏆 Interplanetary Mission Summary",
        resScoreLabel: "Final Score",
        resAccuracyLabel: "Accuracy",
        resMaxComboLabel: "Highest Streak",
        btnRestartGame: "🚀 Launch New Mission",
        btnRetryWrongs: "📝 Practice Missed Facts",

        // Parent Dashboard
        parentReportTitle: "📊 Parent Dashboard & Learning Analytics",
        tabToday: "Today's Summary",
        tabOverall: "Lifetime Progress",
        tabHeatmap: "Fact Matrix Heatmap",
        tabOperations: "× & ÷ Breakdown",
        todayAnswered: "Questions Answered",
        todayAccuracy: "First-Try Accuracy",
        todayAvgSpeed: "Avg Response Time",
        todayMaxStreak: "Highest Streak",
        overallTotal: "Total Questions",
        overallTime: "Total Time",
        overallLaunches: "Missions Completed",
        overallAccuracy: "Total Accuracy",
        multMasteryTitle: "Multiplication Mastery (×)",
        divMasteryTitle: "Division Mastery (÷)",
        weakFactsTitle: "🎯 Recommended Practice Facts:",
        privacyNotice: "🔒 All learning data is stored locally on this device only.",

        // Feedback & Hints
        divThinkHint: "Think: {operandB} × ? = {operandA}",
        divVisualHelper: "Sharing {operandA} objects into {operandB} equal groups:",
        correctFeedback: "✨ Excellent! Correct!",
        wrongFeedback: "Not quite — check the hint and try again!",
        timeoutFeedback: "⏰ Time's up! Let's try the next one."
      },

      zh: {
        appTitle: "乘法火箭实验室 3.0 🚀",
        tagline: "掌握乘法与除法口诀 • 组装 3D 火箭 • 探索漫漫太阳系！",
        
        // 导航与通用
        btnStartGame: "🚀 开始星际火箭任务",
        btnContinueGame: "▶️ 继续已有进度",
        btnSettings: "⚙️ 数学与任务设置",
        btnReport: "📊 家长学习分析报告",
        btnHome: "🏠 首页",
        btnPause: "⏸️ 暂停",
        btnResume: "▶️ 继续",
        btnSave: "💾 保存设置",
        btnCancel: "取消",
        btnClose: "关闭",
        btnExportJson: "📥 导出学习存档 (JSON)",
        btnImportJson: "📤 导入学习存档 (JSON)",
        btnExportCsv: "📊 导出 CSV 报告",
        btnClearData: "🗑️ 重置所有学习记录",
        devSkipQuiz: "⚡ 快速完成答题 (测试)",
        devFillFuel: "⚡ 快速加满 100% 燃料 (测试)",

        // 多儿童 Profiles
        whosPlaying: "谁在探索太空？",
        addPlayer: "➕ 添加小宇航员",
        profileNamePrompt: "请输入小宇航员的名字：",
        selectYearGroup: "选择英国小学年级预设：",

        // 设置页面
        settingsTitle: "⚙️ 数学挑战与任务设置",
        playerNameLabel: "小宇航员昵称：",
        curriculumPresetLabel: "英国 Curriculum 年级预设：",
        freeChallengeLabel: "自由数学挑战模式：",
        selectTablesLabel: "选择练习乘法表 (1-12)：",
        selectAll: "全选",
        difficultyLabel: "答题交互难度 (回答方式)：",
        diffEasy: "简单模式 (3个备选项 + 阵列图与提示)",
        diffNormal: "普通模式 (数字输入 + 巧算提示)",
        diffHard: "挑战模式 (单题倒计时 + 速度加分)",
        timerSelectLabel: "单题限制时间：",
        timerOff: "无时间限制 (轻松练习)",
        timer5s: "5 秒 (极速挑战)",
        timer8s: "8 秒 (标准挑战)",
        timer10s: "10 秒 (宽松挑战)",
        reducedMotionLabel: "开启减弱动画模式 (护眼与防眩晕)",

        // 运算类型
        opMultiplyOnly: "仅练习乘法 (×)",
        opDivideOnly: "仅练习除法 (÷)",
        opBoth: "乘法与除法混合练习 (× & ÷)",

        // 工程蓝图
        blueprintTitle: "📐 乘法火箭工程蓝图",
        blueprintSubtitle: "答对乘除法挑战，收集全部 10 个火箭组件！",
        partsCollected: "已解锁组件：",
        btnStartAnswering: "✏️ 开始答题收集零件",
        btnGoAssembly: "🔧 3D 组装车间",

        // 答题
        hudQuestion: "题目",
        hudStreak: "连胜",
        hudTime: "时间",
        hudScore: "积分",
        submitAnswer: "提交答案 ↵",
        easyHintLabel: "💡 视觉辅助图示：",
        stratHintTitle: "🧠 智能巧算提示：",

        // 组装车间
        assemblyTitle: "🔧 3D 火箭组装车间",
        assemblySubtitle: "点击已解锁零件，看着它们飞入火箭精准卡扣！",
        btnInstallAll: "⚡ 一键全自动组装",
        rocketModelLabel: "3D 火箭型号：",
        rocketThemeLabel: "火箭涂装配色：",
        btnGoFuel: "⛽ 冲向燃料补充舱",
        partsInstalled: "已安装零件：",
        lockedModel: "🔒 完成指定任务解锁",
        partInstalledToast: "✅ 已安装 {part} ({current}/{total})",
        assemblyCompleteCelebration: "🚀 火箭全组件组装完成！",
        modalCompleteTitle: "所有火箭零件已解锁并组装！",

        // 燃料补充舱
        fuelTitle: "⛽ 乘法燃料补充舱",
        fuelSubtitle: "每答对 1 道题加注 10% 燃料，连续答对额外奖励 5%！",
        fuelStatusEmpty: "燃料不足，等待加注...",
        fuelStatusHalf: "燃料加注中...",
        fuelStatusFull: "🎉 燃料 100% 加满！火箭发射系统就绪！",
        fuelFullAlert: "🎉 燃料已 100% 加满！火箭发射系统就绪！点击下方【🚀 准备发射火箭！】点火出航！",
        btnReadyLaunch: "🚀 准备发射火箭！",
        fuelSuccessBoost: "⛽ 燃料加注成功！+{boost}%",
        comboBonusText: "🔥 连胜加成 +{bonus}%",

        // 目的地选择
        selectDestinationTitle: "🪐 选择本次星际探索目的地：",
        destEarthOrbit: "🌍 近地轨道 (400 km)",
        destMoon: "🌙 月球基地号",
        destMars: "🔴 火星拓荒号",
        destJupiter: "🪐 木星风暴探险号",
        destSaturn: "🪐 土星光环探索者",
        destDeepSpace: "🌌 深空星云开拓号",
        btnSelectDest: "选择该目的地 ➔",
        spacePassportTitle: "🎫 航天护照纪念印章",

        // 发射与动画
        launchTitle: "🚀 火箭发射控制中心",
        btnSkipCountdown: "⏩ 跳过倒计时",
        btnReplayMission: "▶️ 再次播放星际飞行",
        checklistTitle: "系统起飞前自检清单",
        sysNav: "⚙️ 姿态与航向导航",
        sysEng: "🔥 主发动机点火器",
        sysFuel: "⛽ 高能乘法燃料",
        sysComp: "🛰️ 数学核心处理器",
        statusChecking: "自检中...",
        statusReady: "✅ 正常待命",
        ignitionText: "点火升空！",
        orbitAchievedBanner: "🌍 成功进入地球轨道",
        transferBurnBanner: "🚀 星际变轨超光速加速",
        destinationArrivalBanner: "🪐 成功抵达 {destination}！",
        spaceVictoryTitle: "任务成功！火箭已成功抵达目标星球！🌌",
        btnViewResults: "📊 查看本次任务成绩单",
        newPassportStamp: "🎉 解锁全新航天护照印章！",

        // 结算
        resultsTitle: "🏆 星际探索任务总结",
        resScoreLabel: "本次得分",
        resAccuracyLabel: "正确率",
        resMaxComboLabel: "最高连胜",
        btnRestartGame: "🚀 开始新任务",
        btnRetryWrongs: "📝 专门重练本次错题",

        // 家长报告
        parentReportTitle: "📊 家长 Dashboard 与学习分析报告",
        tabToday: "今日学习概览",
        tabOverall: "累计学习数据",
        tabHeatmap: "乘法/除法掌握度矩阵",
        tabOperations: "乘法与除法对比分析",
        todayAnswered: "今日练习题数",
        todayAccuracy: "首次正确率",
        todayAvgSpeed: "平均答题速度",
        todayMaxStreak: "今日最高连胜",
        overallTotal: "累计总答题数",
        overallTime: "累计练习时长",
        overallLaunches: "完成星际任务数",
        overallAccuracy: "总体正确率",
        multMasteryTitle: "乘法掌握度 (×)",
        divMasteryTitle: "除法掌握度 (÷)",
        weakFactsTitle: "🎯 建议重点复习的数学事实：",
        privacyNotice: "🔒 本应用所有学习数据仅保存在您的设备本地，保护儿童隐私。",

        // 反馈与提示
        divThinkHint: "逆向思考：{operandB} × ? = {operandA}",
        divVisualHelper: "将 {operandA} 个物体平均分为 {operandB} 组：",
        correctFeedback: "✨ 太棒了！回答正确！",
        wrongFeedback: "差一点点，看下方小提示再试一次！",
        timeoutFeedback: "⏰ 时间到！我们来看下一题。"
      }
    };
  }

  detectLanguage() {
    try {
      const saved = localStorage.getItem("multiplication_rocket_lang");
      if (saved && (saved === "en" || saved === "zh")) return saved;
      const navLang = navigator.language || navigator.userLanguage || "en";
      return navLang.toLowerCase().startsWith("zh") ? "zh" : "en";
    } catch (e) {
      return "en";
    }
  }

  setLanguage(lang) {
    if (lang === "en" || lang === "zh") {
      this.currentLanguage = lang;
      try {
        localStorage.setItem("multiplication_rocket_lang", lang);
      } catch (e) {}
      this.updateDOM();
    }
  }

  t(key, params = {}) {
    const dict = this.translations[this.currentLanguage] || this.translations["en"];
    let text = dict[key] || this.translations["en"][key] || key;
    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`\\{${p}\\}`, "g"), params[p]);
    });
    return text;
  }

  updateDOM() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (key) {
        el.innerText = this.t(key);
      }
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
      const key = el.getAttribute("data-i18n-ph");
      if (key) {
        el.placeholder = this.t(key);
      }
    });

    const langToggleBtn = document.getElementById("btn-lang-toggle");
    if (langToggleBtn) {
      langToggleBtn.innerText = this.currentLanguage === "en" ? "🇬🇧 EN" : "🇨🇳 中文";
    }
  }
}

window.i18n = new I18nManager();
