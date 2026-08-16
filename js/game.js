/**
 * Multiplication Rocket Lab - State Machine & Flow Manager (js/game.js)
 * Supports Game Modes, Concurrency Locks, Hard Mode Timer, Pause/Resume & Session Restore
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

const GAME_MODES = {
  NORMAL: "normal",
  WRONG_REVIEW: "wrong_review",
  WEAK_TABLES: "weak_tables",
  DAILY_MISSION: "daily_mission",
  MISSION_MODE: "mission_mode"
};

class MultiplicationGame {
  constructor() {
    this.currentState = GAME_STATES.HOME;
    this.previousState = GAME_STATES.HOME;
    this.gameMode = GAME_MODES.NORMAL;
    
    this.score = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.currentQuestionIdx = 0;
    this.totalQuestionsCount = CONFIG.DEFAULT_QUESTION_COUNT;
    this.correctAnswersCount = 0;
    this.fuelPercentage = 0;

    this.currentQuestion = null;
    this.attemptCount = 0;
    this.questionShownAt = 0;
    this.isAnswerLocked = false;

    // Hard Mode Timer
    this.timerSeconds = 8;
    this.timerRemainingMs = 8000;
    this.timerInterval = null;

    // Valid state transitions graph
    this.validTransitions = {
      [GAME_STATES.HOME]: [GAME_STATES.SETTINGS, GAME_STATES.BLUEPRINT, GAME_STATES.QUESTION, GAME_STATES.REPORT],
      [GAME_STATES.SETTINGS]: [GAME_STATES.HOME, GAME_STATES.BLUEPRINT, GAME_STATES.QUESTION],
      [GAME_STATES.BLUEPRINT]: [GAME_STATES.HOME, GAME_STATES.QUESTION, GAME_STATES.ASSEMBLY, GAME_STATES.PAUSED],
      [GAME_STATES.QUESTION]: [GAME_STATES.HOME, GAME_STATES.PART_REWARD, GAME_STATES.ASSEMBLY, GAME_STATES.ROCKET_COMPLETE, GAME_STATES.PAUSED],
      [GAME_STATES.PART_REWARD]: [GAME_STATES.QUESTION, GAME_STATES.ASSEMBLY],
      [GAME_STATES.ASSEMBLY]: [GAME_STATES.HOME, GAME_STATES.QUESTION, GAME_STATES.FUEL_CHALLENGE, GAME_STATES.ROCKET_COMPLETE, GAME_STATES.PAUSED],
      [GAME_STATES.ROCKET_COMPLETE]: [GAME_STATES.ASSEMBLY, GAME_STATES.FUEL_CHALLENGE],
      [GAME_STATES.FUEL_CHALLENGE]: [GAME_STATES.HOME, GAME_STATES.LAUNCH_READY, GAME_STATES.PAUSED],
      [GAME_STATES.LAUNCH_READY]: [GAME_STATES.HOME, GAME_STATES.COUNTDOWN, GAME_STATES.LAUNCHING, GAME_STATES.PAUSED],
      [GAME_STATES.COUNTDOWN]: [GAME_STATES.LAUNCHING, GAME_STATES.PAUSED],
      [GAME_STATES.LAUNCHING]: [GAME_STATES.SPACE, GAME_STATES.PAUSED],
      [GAME_STATES.SPACE]: [GAME_STATES.RESULTS, GAME_STATES.HOME],
      [GAME_STATES.RESULTS]: [GAME_STATES.HOME, GAME_STATES.QUESTION, GAME_STATES.BLUEPRINT, GAME_STATES.REPORT],
      [GAME_STATES.REPORT]: [GAME_STATES.HOME, GAME_STATES.SETTINGS, GAME_STATES.QUESTION],
      [GAME_STATES.PAUSED]: Object.values(GAME_STATES)
    };
  }

  init() {
    this.loadProfileState();
    this.setGameState(GAME_STATES.HOME);
  }

  loadProfileState() {
    if (!window.storageManager) return;
    this.score = window.storageManager.get("score") || 0;
    this.timerSeconds = window.storageManager.get("timerSeconds") || 8;
    const tables = window.storageManager.get("selectedTables") || [2, 3, 4, 5];
    if (window.mathEngine) window.mathEngine.setTables(tables);
  }

  setGameState(nextState) {
    if (this.currentState === nextState) return;

    // Check validity unless forcing or coming from PAUSED
    const allowed = this.validTransitions[this.currentState] || Object.values(GAME_STATES);
    if (!allowed.includes(nextState) && this.currentState !== GAME_STATES.PAUSED) {
      console.warn(`MultiplicationGame: Invalid transition from ${this.currentState} to ${nextState}`);
    }

    this.onExitState(this.currentState);
    this.previousState = this.currentState;
    this.currentState = nextState;
    this.onEnterState(nextState);

    if (window.uiManager) {
      window.uiManager.showScreen(nextState);
    }
  }

  onExitState(state) {
    this.stopHardModeTimer();
    this.isAnswerLocked = false;
  }

  onEnterState(state) {
    switch (state) {
      case GAME_STATES.HOME:
        this.saveActiveSession();
        break;
      case GAME_STATES.BLUEPRINT:
        if (window.uiManager) window.uiManager.updateBlueprintView();
        break;
      case GAME_STATES.QUESTION:
        if (!this.currentQuestion) {
          this.nextQuestion();
        } else {
          this.startQuestionTimerIfNeeded();
        }
        break;
      case GAME_STATES.ASSEMBLY:
        if (window.rocketBuilder) {
          window.rocketBuilder.initScene("canvas-container-assembly");
        }
        if (window.uiManager) window.uiManager.renderAssemblyDock();
        break;
      case GAME_STATES.FUEL_CHALLENGE:
        if (window.mathEngine) {
          this.currentQuestion = window.mathEngine.generateQuestion("normal");
          this.questionShownAt = Date.now();
          if (window.uiManager) window.uiManager.renderQuestion(this.currentQuestion, "normal");
        }
        break;
      case GAME_STATES.LAUNCH_READY:
        if (window.launchSequence) {
          window.launchSequence.initScene("canvas-container-launch");
        }
        break;
      case GAME_STATES.PAUSED:
        break;
    }
  }

  pauseGame() {
    if (this.currentState !== GAME_STATES.PAUSED) {
      this.setGameState(GAME_STATES.PAUSED);
    }
  }

  resumeGame() {
    if (this.currentState === GAME_STATES.PAUSED) {
      this.setGameState(this.previousState || GAME_STATES.QUESTION);
    }
  }

  startNewGameRound(mode = GAME_MODES.NORMAL) {
    this.gameMode = mode;
    this.score = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.currentQuestionIdx = 0;
    this.correctAnswersCount = 0;
    this.totalQuestionsCount = window.storageManager ? (window.storageManager.get("questionCountPerRound") || 15) : 15;
    
    if (window.storageManager && mode === GAME_MODES.NORMAL) {
      window.storageManager.set("unlockedParts", []);
      window.storageManager.set("installedParts", []);
      window.storageManager.set("score", 0);
    }

    this.nextQuestion();
    this.setGameState(GAME_STATES.QUESTION);
  }

  nextQuestion() {
    this.attemptCount = 0;
    this.isAnswerLocked = false;
    this.stopHardModeTimer();

    const unlockedParts = window.storageManager ? (window.storageManager.get("unlockedParts") || []) : [];

    if (this.currentQuestionIdx >= this.totalQuestionsCount) {
      if (unlockedParts.length >= CONFIG.PART_COUNT) {
        this.checkRoundCompletion();
        return;
      } else {
        this.totalQuestionsCount += 5;
      }
    }

    this.currentQuestionIdx++;

    if (window.mathEngine) {
      this.currentQuestion = window.mathEngine.generateQuestion(this.gameMode);
    }

    this.questionShownAt = Date.now();

    if (window.uiManager) {
      const difficulty = window.storageManager ? window.storageManager.get("difficulty") : "normal";
      window.uiManager.renderQuestion(this.currentQuestion, difficulty);
      window.uiManager.updateQuizHUD(
        this.currentQuestionIdx,
        this.totalQuestionsCount,
        this.comboCount,
        this.score
      );
    }

    this.startQuestionTimerIfNeeded();
  }

  startQuestionTimerIfNeeded() {
    const difficulty = window.storageManager ? window.storageManager.get("difficulty") : "normal";
    if (difficulty !== "hard") {
      if (window.uiManager) window.uiManager.hideQuizTimer();
      return;
    }

    this.timerSeconds = window.storageManager ? (window.storageManager.get("timerSeconds") || 8) : 8;
    this.timerRemainingMs = this.timerSeconds * 1000;
    
    if (window.uiManager) window.uiManager.showQuizTimer(this.timerSeconds);

    this.stopHardModeTimer();
    const intervalMs = 100;

    this.timerInterval = setInterval(() => {
      if (this.currentState === GAME_STATES.PAUSED) return;

      this.timerRemainingMs -= intervalMs;
      const secLeft = Math.max(0, Math.ceil(this.timerRemainingMs / 1000));
      
      if (window.uiManager) window.uiManager.updateQuizTimerDisplay(secLeft, this.timerRemainingMs / (this.timerSeconds * 1000));

      if (this.timerRemainingMs <= 0) {
        this.stopHardModeTimer();
        this.handleQuestionTimeout();
      }
    }, intervalMs);
  }

  stopHardModeTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleQuestionTimeout() {
    if (this.isAnswerLocked) return;
    this.isAnswerLocked = true;

    if (window.audioManager) window.audioManager.playWrong();
    if (window.uiManager) window.uiManager.showFeedback(false, window.i18n ? window.i18n.t("timeoutFeedback") : "⏰ 时间到！");

    if (window.mathEngine && this.currentQuestion) {
      window.mathEngine.recordResult(this.currentQuestion, false, true, this.timerSeconds * 1000);
    }

    this.comboCount = 0;
    setTimeout(() => this.nextQuestion(), 1200);
  }

  submitAnswer(userAnswer) {
    if (this.isAnswerLocked || !this.currentQuestion) return;
    this.isAnswerLocked = true;
    this.stopHardModeTimer();

    const numAns = Number(userAnswer);
    this.attemptCount++;
    const isCorrect = (numAns === this.currentQuestion.answer);
    const responseTimeMs = Date.now() - this.questionShownAt;

    if (window.mathEngine) {
      window.mathEngine.recordResult(
        this.currentQuestion,
        isCorrect,
        this.attemptCount === 1,
        responseTimeMs
      );
    }

    if (isCorrect) {
      if (window.audioManager) window.audioManager.playCorrect();

      const basePoints = this.attemptCount <= 1 ? 100 : (this.attemptCount === 2 ? 70 : 50);
      this.comboCount++;
      if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
      const comboBonus = (this.comboCount - 1) * 10;
      const addedPoints = basePoints + comboBonus;
      this.score += addedPoints;
      this.correctAnswersCount++;

      if (window.storageManager) {
        window.storageManager.set("score", this.score);
        const totCorrect = (window.storageManager.get("totalCorrectAnswers") || 0) + 1;
        const totAns = (window.storageManager.get("totalQuestionsAnswered") || 0) + 1;
        window.storageManager.set("totalCorrectAnswers", totCorrect);
        window.storageManager.set("totalQuestionsAnswered", totAns);
      }

      if (window.uiManager) {
        window.uiManager.showFeedback(true, window.i18n ? window.i18n.t("correctFeedback") : "✨ 太棒了！回答正确！");
        window.uiManager.updateQuizHUD(this.currentQuestionIdx, this.totalQuestionsCount, this.comboCount, this.score);
      }

      // Check badges & rocket unlocks
      if (window.achievementManager) {
        const difficulty = window.storageManager ? window.storageManager.get("difficulty") : "normal";
        window.achievementManager.checkAndAward({
          comboCount: this.comboCount,
          isCorrect: true,
          isHardMode: difficulty === "hard",
          responseTimeMs
        });
      }

      this.checkPartUnlockProgress();

      setTimeout(() => {
        this.attemptCount = 0;
        this.nextQuestion();
      }, 800);

    } else {
      this.comboCount = 0;
      if (window.audioManager) window.audioManager.playWrong();

      if (window.uiManager) {
        window.uiManager.showFeedback(false, window.i18n ? window.i18n.t("wrongFeedback") : "差一点点，再试一次！");
        window.uiManager.currentAnswerInput = "";
        window.uiManager.updateAnswerDisplay("?");
      }

      setTimeout(() => {
        this.isAnswerLocked = false;
        this.startQuestionTimerIfNeeded();
      }, 1000);
    }
  }

  checkPartUnlockProgress() {
    if (!window.storageManager || !window.rocketBuilder) return;

    const unlocked = window.storageManager.get("unlockedParts") || [];
    const ratio = this.currentQuestionIdx / this.totalQuestionsCount;
    const targetPartCount = Math.min(CONFIG.PART_COUNT, Math.ceil(ratio * CONFIG.PART_COUNT));

    if (unlocked.length < targetPartCount) {
      const partToUnlock = window.rocketBuilder.partDefinitions[unlocked.length];
      if (partToUnlock) {
        window.storageManager.unlockPart(partToUnlock.id);
        if (window.audioManager) window.audioManager.playUnlock();
        if (window.uiManager) window.uiManager.showPartRewardModal(partToUnlock);
      }
    }
  }

  checkRoundCompletion() {
    const unlockedParts = window.storageManager ? (window.storageManager.get("unlockedParts") || []) : [];
    if (unlockedParts.length >= CONFIG.PART_COUNT) {
      document.getElementById("modal-rocket-complete")?.classList.remove("hidden");
    } else {
      this.setGameState(GAME_STATES.ASSEMBLY);
    }
  }

  submitFuelAnswer(userAnswer) {
    if (this.isAnswerLocked || !this.currentQuestion) return;
    this.isAnswerLocked = true;

    const numAns = Number(userAnswer);
    if (numAns === this.currentQuestion.answer) {
      if (window.audioManager) window.audioManager.playCorrect();
      this.comboCount++;
      const boost = 10 + (this.comboCount > 1 ? 5 : 0);
      this.fuelPercentage += boost;
      if (this.fuelPercentage > 100) this.fuelPercentage = 100;

      if (window.uiManager) {
        window.uiManager.updateFuelGauge(this.fuelPercentage);
        window.uiManager.showFuelFeedback(true, window.i18n ? window.i18n.t("fuelSuccessBoost", { boost }) : `⛽ 燃料加注成功！+${boost}%`);
        window.uiManager.currentAnswerInput = "";
      }

      setTimeout(() => {
        this.isAnswerLocked = false;
        if (window.mathEngine) {
          this.currentQuestion = window.mathEngine.generateQuestion("normal");
          if (window.uiManager) window.uiManager.renderQuestion(this.currentQuestion, "normal");
        }
      }, 600);

    } else {
      this.comboCount = 0;
      this.isAnswerLocked = false;
      if (window.audioManager) window.audioManager.playWrong();
      if (window.uiManager) {
        window.uiManager.showFuelFeedback(false, window.i18n ? window.i18n.t("wrongFeedback") : "计算有误，再试一次！");
        window.uiManager.currentAnswerInput = "";
        window.uiManager.updateAnswerDisplay("?");
      }
    }
  }

  saveActiveSession() {
    if (!window.storageManager) return;
    window.storageManager.set("lastActiveSession", {
      state: this.currentState,
      gameMode: this.gameMode,
      score: this.score,
      currentQuestionIdx: this.currentQuestionIdx,
      fuelPercentage: this.fuelPercentage,
      savedAt: Date.now()
    });
  }
}

window.game = new MultiplicationGame();
