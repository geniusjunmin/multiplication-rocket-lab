/**
 * Multiplication Rocket Lab - Internationalization (js/i18n.js)
 * Supports English (en - UK default) and Chinese (zh)
 */
class I18nManager {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = {
      en: {
        appTitle: "Multiplication Rocket Lab 🚀",
        tagline: "Learn Times Tables • Build 3D Rockets • Launch to Deep Space!",
        
        // Navigation & General UI
        btnStartGame: "🚀 Start Rocket Building",
        btnContinueGame: "▶️ Continue Rocket",
        btnSettings: "⚙️ Learning Settings",
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

        // Profile Selector
        whosPlaying: "Who's playing?",
        addPlayer: "➕ Add Player",
        profileNamePrompt: "Enter Child's Name:",
        selectYearGroup: "Select Year Group:",

        // Settings Screen
        settingsTitle: "⚙️ Learning & Difficulty Settings",
        playerNameLabel: "Child's Name:",
        curriculumPresetLabel: "UK Curriculum Quick Presets:",
        selectTablesLabel: "Select Multiplication Tables (1-12):",
        selectAll: "Select All",
        difficultyLabel: "Difficulty & Mode:",
        diffEasy: "Easy (3 Choices + Array Dot Hints)",
        diffNormal: "Normal (Numeric Keypad Input)",
        diffHard: "Hard (Timer Challenge + Bonus)",
        timerSelectLabel: "Hard Mode Timer:",
        reducedMotionLabel: "Reduce Motion Effects (Sensory Friendly)",

        // Blueprint Screen
        blueprintTitle: "📐 Rocket Engineering Blueprint",
        blueprintSubtitle: "Answer multiplication facts to collect all 10 rocket parts!",
        partsCollected: "Parts Collected:",
        btnStartAnswering: "✏️ Start Quiz to Collect Parts",
        btnGoAssembly: "🔧 3D Assembly Dock",

        // Quiz Screen
        hudQuestion: "Question",
        hudStreak: "Streak",
        hudTime: "Time",
        hudScore: "Score",
        submitAnswer: "Submit Answer",
        easyHintLabel: "💡 Visual Helper (Dots & Addition):",
        stratHintTitle: "🧠 Smart Strategy Hint:",

        // Assembly Screen
        assemblyTitle: "🔧 3D Rocket Assembly Workshop",
        assemblySubtitle: "Click unlocked parts to snap them onto your 3D rocket!",
        btnInstallAll: "⚡ Auto-Assemble All Unlocked Parts",
        rocketModelLabel: "3D Rocket Model:",
        rocketThemeLabel: "Theme Color:",
        btnGoFuel: "⛽ Proceed to Fuel Chamber",
        partsInstalled: "Parts Installed:",
        lockedModel: "🔒 Complete launches to unlock",

        // Fuel Screen
        fuelTitle: "⛽ Multiplication Fuel Chamber",
        fuelSubtitle: "Each correct answer adds +10% fuel! Maintain a streak for +5% bonus!",
        fuelStatusEmpty: "Fuel low. Waiting for fuel loading...",
        fuelStatusHalf: "Fuel loading in progress...",
        fuelStatusFull: "Fuel tanks 100% full! Ready for launch!",
        btnReadyLaunch: "🚀 Ready to Launch Rocket!",
        fuelSuccessBoost: "⛽ Fuel Loaded! +{boost}%",

        // Launch & Space
        launchTitle: "🚀 Rocket Launch Control Center",
        btnSkipCountdown: "⏩ Skip Countdown & Liftoff",
        checklistTitle: "System Pre-flight Checklist",
        sysNav: "⚙️ Guidance & Navigation",
        sysEng: "🔥 Engine Ignition System",
        sysFuel: "⛽ High-Energy Fuel",
        sysComp: "🛰️ Math Core Processor",
        statusChecking: "Checking...",
        statusReady: "✅ Ready",
        ignitionText: "IGNITION!",
        spaceVictoryTitle: "MISSION SUCCESS! ROCKET IN ORBIT! 🌌",
        btnViewResults: "📊 View Performance & Results",

        // Results Screen
        resultsTitle: "🏆 Rocket Launch Mission Summary",
        resScoreLabel: "Final Score",
        resAccuracyLabel: "Accuracy",
        resMaxComboLabel: "Highest Streak",
        btnRestartGame: "🚀 Build New Rocket",
        btnRetryWrongs: "📝 Practice Missed Facts",

        // Parent Dashboard
        parentReportTitle: "📊 Parent Dashboard & Learning Analytics",
        tabToday: "Today's Summary",
        tabOverall: "Lifetime Progress",
        tabHeatmap: "12×12 Fact Matrix",
        todayAnswered: "Questions Answered",
        todayAccuracy: "First-Try Accuracy",
        todayAvgSpeed: "Avg Response Time",
        todayMaxStreak: "Highest Streak",
        overallTotal: "Total Questions",
        overallTime: "Total Time",
        overallLaunches: "Rockets Launched",
        overallAccuracy: "Total Accuracy",
        weakFactsTitle: "🎯 Recommended Practice Facts:",
        masteryHeatmapTitle: "12×12 Multiplication Fact Heatmap Matrix",
        privacyNotice: "🔒 All learning data is stored locally on this device only. No account or internet required.",

        // Badges
        badgeFirstLaunch: "🚀 First Launch",
        badgeCombo5: "🔥 5-Streak Pilot",
        badgeCombo10: "🌟 10-Streak Master",
        badgeMaster2: "🧠 Master ×2",
        badgeMaster5: "🧠 Master ×5",
        badgeMaster10: "🧠 Master ×10",
        badgeSpeed: "⚡ Speed Pilot",
        badgePerfect: "🎯 Perfect Round",
        badge100Q: "🌌 100 Questions",

        // Modals & Feedback
        modalRewardTitle: "New Rocket Part Unlocked!",
        btnRewardInstall: "🛠️ Go to 3D Assembly",
        btnRewardContinue: "✏️ Continue Answering",
        modalCompleteTitle: "All Rocket Parts Unlocked!",
        correctFeedback: "✨ Excellent! Correct!",
        wrongFeedback: "Not quite — let's try again!",
        timeoutFeedback: "⏰ Time's up! Let's try the next one."
      },

      zh: {
        appTitle: "乘法火箭实验室 🚀",
        tagline: "学习乘法口诀 • 组装 3D 火箭 • 探索漫漫星空！",
        
        // 导航与通用
        btnStartGame: "🚀 开始建造火箭",
        btnContinueGame: "▶️ 继续已有进度",
        btnSettings: "⚙️ 学习与难度设置",
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

        // 多儿童 Profiles
        whosPlaying: "谁在探索太空？",
        addPlayer: "➕ 添加小宇航员",
        profileNamePrompt: "请输入小宇航员的名字：",
        selectYearGroup: "选择英国小学年级预设：",

        // 设置页面
        settingsTitle: "⚙️ 学习与难度设置",
        playerNameLabel: "小宇航员昵称：",
        curriculumPresetLabel: "英国 National Curriculum 年级预设：",
        selectTablesLabel: "选择练习乘法表 (1-12)：",
        selectAll: "全选",
        difficultyLabel: "答题难度模式：",
        diffEasy: "简单模式 (3个备选项 + 阵列点图辅助)",
        diffNormal: "普通模式 (全键盘数字输入)",
        diffHard: "挑战模式 (单题倒计时 + 速度加分)",
        timerSelectLabel: "挑战模式单题限制时间：",
        reducedMotionLabel: "开启减弱动画模式 (护眼与防眩晕)",

        // 工程蓝图
        blueprintTitle: "📐 乘法火箭工程蓝图",
        blueprintSubtitle: "答对乘法题，收集全部 10 个火箭组件！",
        partsCollected: "已解锁组件：",
        btnStartAnswering: "✏️ 开始答题收集零件",
        btnGoAssembly: "🔧 3D 组装车间",

        // 答题
        hudQuestion: "题目",
        hudStreak: "连胜",
        hudTime: "时间",
        hudScore: "积分",
        submitAnswer: "提交答案",
        easyHintLabel: "💡 阵列点图与加法拆解：",
        stratHintTitle: "🧠 智能巧算提示：",

        // 组装车间
        assemblyTitle: "🔧 3D 火箭组装车间",
        assemblySubtitle: "点击底座解包零件，看着它们飞入火箭精准卡扣！",
        btnInstallAll: "⚡ 一键全自动组装已解锁零件",
        rocketModelLabel: "3D 火箭型号：",
        rocketThemeLabel: "火箭涂装配色：",
        btnGoFuel: "⛽ 冲向燃料补充舱",
        partsInstalled: "已安装零件：",
        lockedModel: "🔒 完成指定发射任务解锁",

        // 燃料补充舱
        fuelTitle: "⛽ 乘法燃料补充舱",
        fuelSubtitle: "每答对 1 道题加注 10% 燃料，连续答对额外奖励 5%！",
        fuelStatusEmpty: "燃料不足，等待加注...",
        fuelStatusHalf: "燃料加注中...",
        fuelStatusFull: "燃料 100% 加满！可以发射！",
        btnReadyLaunch: "🚀 准备发射火箭！",
        fuelSuccessBoost: "⛽ 燃料加注成功！+{boost}%",

        // 发射与太空
        launchTitle: "🚀 火箭发射控制中心",
        btnSkipCountdown: "⏩ 跳过等待，立即升空",
        checklistTitle: "系统起飞前自检清单",
        sysNav: "⚙️ 姿态与航向导航",
        sysEng: "🔥 主发动机点火器",
        sysFuel: "⛽ 高能乘法燃料",
        sysComp: "🛰️ 数学核心处理器",
        statusChecking: "自检中...",
        statusReady: "✅ 正常待命",
        ignitionText: "点火升空！",
        spaceVictoryTitle: "发射成功！火箭已成功进入轨道太空！🌌",
        btnViewResults: "📊 查看本次学习成绩单",

        // 结算
        resultsTitle: "🏆 乘法火箭发射任务总结",
        resScoreLabel: "本次得分",
        resAccuracyLabel: "正确率",
        resMaxComboLabel: "最高连胜",
        btnRestartGame: "🚀 建造新火箭",
        btnRetryWrongs: "📝 专门重练本次错题",

        // 家长报告
        parentReportTitle: "📊 家长 Dashboard 与学习分析报告",
        tabToday: "今日学习概览",
        tabOverall: "累计学习数据",
        tabHeatmap: "12×12 乘法事实热力图",
        todayAnswered: "今日练习题数",
        todayAccuracy: "首次正确率",
        todayAvgSpeed: "平均答题速度",
        todayMaxStreak: "今日最高连胜",
        overallTotal: "累计总答题数",
        overallTime: "累计练习时长",
        overallLaunches: "成功发射火箭数",
        overallAccuracy: "总体正确率",
        weakFactsTitle: "🎯 建议重点复习的乘法事实：",
        masteryHeatmapTitle: "12×12 乘法表掌握度热力矩阵",
        privacyNotice: "🔒 本应用所有学习数据仅保存在您的设备本地，保护儿童隐私，无需注册登录。",

        // 勋章
        badgeFirstLaunch: "🚀 首次发射",
        badgeCombo5: "🔥 5连胜宇航员",
        badgeCombo10: "🌟 10连胜大师",
        badgeMaster2: "🧠 精通×2乘法表",
        badgeMaster5: "🧠 精通×5乘法表",
        badgeMaster10: "🧠 精通×10乘法表",
        badgeSpeed: "⚡ 极速先锋",
        badgePerfect: "🎯 完美无错关卡",
        badge100Q: "🌌 100题成就",

        // 弹窗与反馈
        modalRewardTitle: "新火箭零件已解锁！",
        btnRewardInstall: "🛠️ 立即前往 3D 车间",
        btnRewardContinue: "✏️ 继续答题",
        modalCompleteTitle: "火箭零件全部解锁！",
        correctFeedback: "✨ 太棒了！回答正确！",
        wrongFeedback: "差一点点，再试一次！",
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
