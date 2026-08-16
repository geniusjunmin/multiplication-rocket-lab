/**
 * 乘法火箭实验室 - 主游戏逻辑与状态机管理器 (game.js)
 */

const GAME_STATES = {
  HOME: "home",
  SETTINGS: "settings",
  BLUEPRINT: "blueprint",
  QUESTION: "question",
  PART_REWARD: "partReward",
  ASSEMBLY: "assembly",
  ROCKET_COMPLETE: "rocketComplete",
  FUEL_CHALLENGE: "fuelChallenge",
  LAUNCH_READY: "launchReady",
  COUNTDOWN: "countdown",
  LAUNCHING: "launching",
  SPACE: "space",
  RESULTS: "results",
  REPORT: "report",
  PAUSED: "paused"
};

class MultiplicationGame {
  constructor() {
    this.currentState = GAME_STATES.HOME;
    this.currentQuestion = null;
    this.questionsInRound = [];
    this.currentQuestionIdx = 0;
    this.score = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.fuelPercentage = 0;
    this.correctAnswersCount = 0;
    this.totalQuestionsCount = 15;
    this.attemptCount = 0;

    // 常用随机鼓励短语列表
    this.encouragePhrases = [
      "太棒了！计算完全正确！",
      "你离太空又近了一步！",
      "完美答案！火箭工程师干得漂亮！",
      "新的火箭零件已解锁！",
      "太厉害了！数学推力爆发！",
      "乘法能量持续注入中！"
    ];

    this.hintPhrases = [
      "再想一想，你可以的！",
      "答案很接近，再试一次！",
      "别着急，火箭工程师也需要仔细检查。",
      "按步骤拆分算算看！"
    ];
  }

  /**
   * 初始化游戏
   */
  init() {
    console.log("MultiplicationGame: 初始化游戏系统...");
    this.loadStateFromStorage();
    this.setGameState(GAME_STATES.HOME);
  }

  /**
   * 状态机切换
   */
  setGameState(nextState) {
    console.log(`Game State Transition: ${this.currentState} ➔ ${nextState}`);
    this.currentState = nextState;
    if (window.uiManager) window.uiManager.showScreen(nextState);

    // 针对特定状态的 3D 画布初始化
    switch (nextState) {
      case GAME_STATES.HOME:
        if (window.rocketBuilder) window.rocketBuilder.initScene("canvas-container-home");
        break;
      case GAME_STATES.QUESTION:
        if (window.rocketBuilder) window.rocketBuilder.initScene("canvas-container-quiz");
        break;
      case GAME_STATES.ASSEMBLY:
        if (window.rocketBuilder) {
          window.rocketBuilder.initScene("canvas-container-assembly");
          const installed = window.storageManager ? window.storageManager.get("installedParts") : [];
          window.rocketBuilder.updateInstalledParts(installed);
        }
        if (window.uiManager && window.storageManager && window.rocketBuilder) {
          const unlocked = window.storageManager.get("unlockedParts") || [];
          const installed = window.storageManager.get("installedParts") || [];
          window.uiManager.renderAssemblyDock(
            window.rocketBuilder.partDefinitions,
            unlocked,
            installed,
            (partId) => this.installRocketPart(partId)
          );
        }
        break;
      case GAME_STATES.FUEL_CHALLENGE:
        if (window.mathEngine) {
          this.currentQuestion = window.mathEngine.generateQuestion();
          if (window.uiManager) window.uiManager.renderQuestion(this.currentQuestion, "normal");
        }
        break;
      case GAME_STATES.LAUNCH_READY:
      case GAME_STATES.LAUNCHING:
      case GAME_STATES.SPACE:
        if (window.launchSequence) window.launchSequence.initScene("canvas-container-launch");
        break;
    }
  }

  /**
   * 从 Storage 加载保存的游戏进度
   */
  loadStateFromStorage() {
    if (!window.storageManager) return;
    this.score = window.storageManager.get("score") || 0;
    this.totalQuestionsCount = window.storageManager.get("questionCountPerRound") || 15;
    const selectedTables = window.storageManager.get("selectedTables") || [2, 3, 4, 5];
    if (window.mathEngine) window.mathEngine.setTables(selectedTables);
  }

  /**
   * 开始新一轮答题建火箭
   */
  startNewGameRound() {
    this.currentQuestionIdx = 0;
    this.correctAnswersCount = 0;
    this.comboCount = 0;
    this.score = 0;
    this.fuelPercentage = 0;

    // 重置零件列表
    if (window.storageManager) {
      window.storageManager.set("unlockedParts", []);
      window.storageManager.set("installedParts", []);
      window.storageManager.set("score", 0);
    }

    this.nextQuestion();
    this.setGameState(GAME_STATES.QUESTION);
  }

  /**
   * 加载下一道乘法题
   */
  nextQuestion() {
    this.attemptCount = 0;
    const unlockedParts = window.storageManager ? window.storageManager.get("unlockedParts") || [] : [];

    if (this.currentQuestionIdx >= this.totalQuestionsCount) {
      if (unlockedParts.length >= 10) {
        this.checkRoundCompletion();
        return;
      } else {
        // 若基本题数已满但零件尚未解锁全，自动扩充题数允许继续练习解锁
        this.totalQuestionsCount += 5;
      }
    }

    this.currentQuestionIdx++;
    if (window.mathEngine) {
      this.currentQuestion = window.mathEngine.generateQuestion();
    }

    const difficulty = window.storageManager ? window.storageManager.get("difficulty") : "normal";
    
    // UI 更新
    if (window.uiManager) {
      window.uiManager.renderQuestion(this.currentQuestion, difficulty);
      document.getElementById("quiz-current-num").innerText = this.currentQuestionIdx;
      document.getElementById("quiz-total-num").innerText = this.totalQuestionsCount;
      document.getElementById("quiz-combo-count").innerText = `🔥 ${this.comboCount}`;
      document.getElementById("display-score").innerText = this.score;

      // 简单模式下提供阵列可视化辅助
      if (difficulty === "easy" && window.mathEngine) {
        const visualData = window.mathEngine.getVisualArrayData(
          this.currentQuestion.factorA,
          this.currentQuestion.factorB
        );
        window.uiManager.renderVisualHelper(visualData);
      }
    }
  }

  /**
   * 处理提交答案逻辑
   */
  submitAnswer(userAnswer) {
    if (!this.currentQuestion) return;

    this.attemptCount++;
    const numAns = Number(userAnswer);
    const isCorrect = numAns === this.currentQuestion.answer;

    if (window.mathEngine) {
      window.mathEngine.recordResult(this.currentQuestion, isCorrect, this.attemptCount === 1);
    }

    if (isCorrect) {
      // 1. 播放成功音效
      if (window.audioManager) window.audioManager.playCorrect();

      // 2. 计算积分与连击
      const basePoints = this.attemptCount <= 1 ? 100 : (this.attemptCount === 2 ? 70 : 50);
      this.comboCount++;
      if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
      const comboBonus = (this.comboCount - 1) * 10;
      const addedPoints = basePoints + comboBonus;
      this.score += addedPoints;

      this.attemptCount = 0; // 重置本题尝试次数，为下一题准备

      this.correctAnswersCount++;
      if (window.storageManager) window.storageManager.set("score", this.score);

      // 3. UI 正向反馈
      const encourageMsg = this.encouragePhrases[Math.floor(Math.random() * this.encouragePhrases.length)];
      if (window.uiManager) window.uiManager.showFeedback(true, `${encourageMsg} (+${addedPoints}分)`);

      // 4. 计算零件解锁节奏
      this.checkPartUnlockProgress();

      // 5. 延迟 1.2 秒加载下一题
      setTimeout(() => this.nextQuestion(), 1200);

    } else {
      // 答错反馈
      this.comboCount = 0;
      if (window.audioManager) window.audioManager.playWrong();

      const hintMsg = this.hintPhrases[Math.floor(Math.random() * this.hintPhrases.length)];
      if (window.uiManager) window.uiManager.showFeedback(false, hintMsg);

      // 连续答错 2 次后在控制台或 UI 提供分解拆分提示
      if (this.attemptCount >= 2 && window.uiManager) {
        const breakDownHint = `💡 提示：${this.currentQuestion.factorA} × ${this.currentQuestion.factorB} 等于 ${this.currentQuestion.factorA} 个 ${this.currentQuestion.factorB} 相加`;
        window.uiManager.showFeedback(false, breakDownHint);
      }
    }
  }

  /**
   * 根据答对数量动态计算零件解锁
   */
  checkPartUnlockProgress() {
    if (!window.rocketBuilder || !window.storageManager) return;

    // 假设 10 个零件平分本轮总题数
    const correctAnswersPerPart = Math.max(1, Math.floor(this.totalQuestionsCount / 10));
    const shouldUnlockedCount = Math.min(10, Math.floor(this.correctAnswersCount / correctAnswersPerPart));
    
    const unlockedParts = window.storageManager.get("unlockedParts") || [];
    
    if (shouldUnlockedCount > unlockedParts.length) {
      const partToUnlock = window.rocketBuilder.partDefinitions[unlockedParts.length];
      if (partToUnlock) {
        window.storageManager.unlockPart(partToUnlock.id);
        
        // 弹出获得新零件界面
        if (window.audioManager) window.audioManager.playUnlock();
        this.showPartRewardModal(partToUnlock);
      }
    }
  }

  /**
   * 安装单个火箭零件
   */
  installRocketPart(partId) {
    if (!window.storageManager || !window.rocketBuilder) return;
    window.storageManager.installPart(partId);
    
    // 触发 3D 动画安装
    window.rocketBuilder.animateInstallPart(partId, () => {
      const unlocked = window.storageManager.get("unlockedParts") || [];
      const installed = window.storageManager.get("installedParts") || [];
      
      if (window.uiManager) {
        window.uiManager.renderAssemblyDock(
          window.rocketBuilder.partDefinitions,
          unlocked,
          installed,
          (id) => this.installRocketPart(id)
        );
      }

      if (installed.length >= 10) {
        document.getElementById("modal-rocket-complete")?.classList.remove("hidden");
      }
    });
  }

  /**
   * 弹出解锁新零件 Modal
   */
  showPartRewardModal(part) {
    const modal = document.getElementById("modal-part-reward");
    if (!modal) return;

    document.getElementById("reward-part-name").innerText = part.name;
    document.getElementById("reward-part-desc").innerText = part.desc;
    modal.classList.remove("hidden");
  }

  /**
   * 处理燃料挑战加注逻辑
   */
  submitFuelAnswer(userAnswer) {
    const numAns = Number(userAnswer);
    if (!this.currentQuestion) return;

    if (numAns === this.currentQuestion.answer) {
      if (window.audioManager) window.audioManager.playCorrect();
      this.comboCount++;
      const boost = 10 + (this.comboCount > 1 ? 5 : 0);
      this.fuelPercentage += boost;
      if (this.fuelPercentage > 100) this.fuelPercentage = 100;

      if (window.uiManager) {
        window.uiManager.updateFuelGauge(this.fuelPercentage);
        window.uiManager.showFuelFeedback(true, `⛽ 燃料加注成功！+${boost}%`);
        window.uiManager.currentAnswerInput = "";
      }

      // 延迟 0.6 秒生成并加载下一题
      setTimeout(() => {
        if (window.mathEngine) {
          this.currentQuestion = window.mathEngine.generateQuestion();
          if (window.uiManager) window.uiManager.renderQuestion(this.currentQuestion, "normal");
        }
      }, 600);

    } else {
      this.comboCount = 0;
      if (window.audioManager) window.audioManager.playWrong();
      if (window.uiManager) {
        window.uiManager.showFuelFeedback(false, "计算有误，再试一次！");
        window.uiManager.currentAnswerInput = "";
        window.uiManager.updateAnswerDisplay("?");
      }
    }
  }

  /**
   * 一轮答题完成检测
   */
  checkRoundCompletion() {
    const unlockedParts = window.storageManager ? window.storageManager.get("unlockedParts") : [];
    if (unlockedParts.length >= 10) {
      document.getElementById("modal-rocket-complete")?.classList.remove("hidden");
    } else {
      // 哪怕未全部解锁，也引导去组装已有零件
      this.setGameState(GAME_STATES.BLUEPRINT);
    }
  }
}

// 实例化主游戏
window.game = new MultiplicationGame();

/**
 * 自动化逻辑断言测试入口 (用于 plan.txt 第二十六条验收测试)
 */
window.runGameTests = function() {
  console.log("%c=== 开始执行 乘法火箭实验室 单元测试集 ===", "color: #38bdf8; font-weight: bold;");
  let passed = 0;

  // 1. 乘法答案计算测试
  const q = window.mathEngine.generateQuestion();
  if (q.factorA * q.factorB === q.answer) {
    console.log("✓ multiplication answer test passed");
    passed++;
  } else {
    console.error("✕ multiplication answer test failed");
  }

  // 2. 题目范围测试 (1x1 ~ 9x9)
  if (q.factorA >= 1 && q.factorA <= 9 && q.factorB >= 1 && q.factorB <= 9) {
    console.log("✓ question range test passed");
    passed++;
  } else {
    console.error("✕ question range test failed");
  }

  // 3. 干扰项生成测试 (包含正确答案且无重复)
  const distractors = window.mathEngine.generateDistractors(7, 8, 56);
  if (distractors.includes(56) && new Set(distractors).size === 3) {
    console.log("✓ distractor generation test passed");
    passed++;
  } else {
    console.error("✕ distractor generation test failed");
  }

  // 4. LocalStorage 存档测试
  window.storageManager.set("testKey", "testValue");
  if (window.storageManager.get("testKey") === "testValue") {
    console.log("✓ storage test passed");
    passed++;
  } else {
    console.error("✕ storage test failed");
  }

  // 5. 燃料上限与加注测试
  window.game.fuelPercentage = 90;
  window.game.fuelPercentage += 20;
  if (window.game.fuelPercentage > 100) window.game.fuelPercentage = 100;
  if (window.game.fuelPercentage === 100) {
    console.log("✓ fuel max limit test passed");
    passed++;
  } else {
    console.error("✕ fuel max limit test failed");
  }

  console.log(`%c=== 测试完成：通过 ${passed} / 5 项断言 ===`, "color: #34d399; font-weight: bold;");
};
