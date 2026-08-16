/**
 * Multiplication Rocket Lab - State Machine & Flow Manager (js/game.js)
 * Supports Version 3.0.0 Free Challenge Presets, Mixed Operations, Prominent Wrong Hints,
 * Mandatory Assembly Locks, Dynamic Lifecycle Cleanup & Mission Completion Alignment
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
  MISSION_COMPLETE: "missionComplete",
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

    this.validTransitions = {
      [GAME_STATES.HOME]: [GAME_STATES.SETTINGS, GAME_STATES.BLUEPRINT, GAME_STATES.QUESTION, GAME_STATES.REPORT],
      [GAME_STATES.SETTINGS]: [GAME_STATES.HOME, GAME_STATES.BLUEPRINT, GAME_STATES.QUESTION],
      [GAME_STATES.BLUEPRINT]: [GAME_STATES.HOME, GAME_STATES.QUESTION, GAME_STATES.ASSEMBLY, GAME_STATES.PAUSED],
      [GAME_STATES.QUESTION]: [GAME_STATES.HOME, GAME_STATES.PART_REWARD, GAME_STATES.ASSEMBLY, GAME_STATES.ROCKET_COMPLETE, GAME_STATES.PAUSED],
      [GAME_STATES.PART_REWARD]: [GAME_STATES.QUESTION, GAME_STATES.ASSEMBLY],
      [GAME_STATES.ASSEMBLY]: [GAME_STATES.HOME, GAME_STATES.QUESTION, GAME_STATES.FUEL_CHALLENGE, GAME_STATES.ROCKET_COMPLETE, GAME_STATES.PAUSED],
      [GAME_STATES.ROCKET_COMPLETE]: [GAME_STATES.ASSEMBLY, GAME_STATES.FUEL_CHALLENGE],
      [GAME_STATES.FUEL_CHALLENGE]: [GAME_STATES.HOME, GAME_STATES.ASSEMBLY, GAME_STATES.LAUNCH_READY, GAME_STATES.PAUSED],
      [GAME_STATES.LAUNCH_READY]: [GAME_STATES.HOME, GAME_STATES.COUNTDOWN, GAME_STATES.LAUNCHING, GAME_STATES.SPACE, GAME_STATES.MISSION_COMPLETE, GAME_STATES.PAUSED],
      [GAME_STATES.COUNTDOWN]: [GAME_STATES.LAUNCHING, GAME_STATES.SPACE, GAME_STATES.MISSION_COMPLETE, GAME_STATES.PAUSED],
      [GAME_STATES.LAUNCHING]: [GAME_STATES.SPACE, GAME_STATES.MISSION_COMPLETE, GAME_STATES.PAUSED],
      [GAME_STATES.SPACE]: [GAME_STATES.MISSION_COMPLETE, GAME_STATES.RESULTS, GAME_STATES.HOME],
      [GAME_STATES.MISSION_COMPLETE]: [GAME_STATES.RESULTS, GAME_STATES.HOME, GAME_STATES.QUESTION, GAME_STATES.BLUEPRINT],
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
    
    const challengeKey = window.storageManager.get("selectedMathChallenge") || "times12";
    const preset = CONFIG.MATH_CHALLENGE_PRESETS[challengeKey];
    if (window.mathEngine) window.mathEngine.setChallengeConfig(preset);
  }

  isLaunchFamilyState(state) {
    return [
      GAME_STATES.LAUNCH_READY,
      GAME_STATES.COUNTDOWN,
      GAME_STATES.LAUNCHING,
      GAME_STATES.SPACE,
      GAME_STATES.MISSION_COMPLETE
    ].includes(state);
  }

  setGameState(nextState) {
    if (this.currentState === nextState) return;

    const prevState = this.currentState;
    this.onExitState(prevState, nextState);
    this.previousState = prevState;
    this.currentState = nextState;
    this.onEnterState(nextState);

    if (window.uiManager) {
      window.uiManager.showScreen(this.currentState);
    }
  }

  onExitState(oldState, newState) {
    this.stopHardModeTimer();
    this.isAnswerLocked = false;

    // Strict resource disposal and leak-free teardown across state transitions
    if (oldState === GAME_STATES.ASSEMBLY && newState !== GAME_STATES.ASSEMBLY) {
      if (window.rocketBuilder) {
        window.rocketBuilder.destroy();
      }
    } else if (oldState === GAME_STATES.FUEL_CHALLENGE && newState !== GAME_STATES.FUEL_CHALLENGE) {
      if (window.rocketBuilder) {
        window.rocketBuilder.destroy();
      }
    } else if (this.isLaunchFamilyState(oldState) && !this.isLaunchFamilyState(newState)) {
      if (window.launchSequence) {
        window.launchSequence.destroy();
      }
    }
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
        // STRICT MANDATE: Must assemble all 10 parts before entering Fuel Chamber!
        const installedFuel = window.storageManager ? (window.storageManager.get("installedParts") || []) : [];
        if (installedFuel.length < CONFIG.PART_COUNT) {
          console.warn("Assembly incomplete! Redirecting to Assembly Workshop.");
          this.currentState = GAME_STATES.ASSEMBLY;
          if (window.rocketBuilder) window.rocketBuilder.initScene("canvas-container-assembly");
          if (window.uiManager) window.uiManager.renderAssemblyDock();
          return;
        }

        if (window.rocketBuilder) {
          window.rocketBuilder.initScene("canvas-container-fuel");
          window.rocketBuilder.setFuelGlowLevel(this.fuelPercentage);
        }
        if (window.uiManager) {
          window.uiManager.updateFuelGauge(this.fuelPercentage);
        }
        if (window.mathEngine) {
          this.currentQuestion = window.mathEngine.generateQuestion("normal");
          this.questionShownAt = Date.now();
          if (window.uiManager) window.uiManager.renderQuestion(this.currentQuestion, "normal");
        }
        break;
      case GAME_STATES.LAUNCH_READY:
        const installedLaunch = window.storageManager ? (window.storageManager.get("installedParts") || []) : [];
        if (installedLaunch.length < CONFIG.PART_COUNT) {
          this.currentState = GAME_STATES.ASSEMBLY;
          if (window.rocketBuilder) window.rocketBuilder.initScene("canvas-container-assembly");
          if (window.uiManager) window.uiManager.renderAssemblyDock();
          return;
        }

        if (window.launchSequence) {
          const destId = window.storageManager ? (window.storageManager.get("selectedDestination") || "moon") : "moon";
          window.launchSequence.initScene("canvas-container-launch", destId);
        }
        break;
      case GAME_STATES.COUNTDOWN:
      case GAME_STATES.LAUNCHING:
      case GAME_STATES.SPACE:
      case GAME_STATES.MISSION_COMPLETE:
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

  /**
   * Developer Testing Shortcut: Instantly skip all quiz questions and unlock all 10 rocket parts!
   */
  skipAllQuestions() {
    this.currentQuestionIdx = this.totalQuestionsCount;
    this.correctAnswersCount = this.totalQuestionsCount;
    this.score += 1500;

    const allParts = window.rocketBuilder ? window.rocketBuilder.partDefinitions.map(p => p.id) : [
      "body", "noseCone", "leftBooster", "rightBooster", "leftFin",
      "rightFin", "engine", "window", "fuelTank", "controlModule"
    ];

    if (window.storageManager) {
      window.storageManager.set("unlockedParts", allParts);
      window.storageManager.set("score", this.score);
    }

    document.getElementById("modal-rocket-complete")?.classList.remove("hidden");
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
    if (window.uiManager) {
      window.uiManager.showFeedback(false, window.i18n ? window.i18n.t("timeoutFeedback") : "⏰ 时间到！");
      window.uiManager.showWrongAnswerHint(this.currentQuestion);
    }

    if (window.mathEngine && this.currentQuestion) {
      window.mathEngine.recordResult(this.currentQuestion, false, true, this.timerSeconds * 1000);
    }

    this.comboCount = 0;
    setTimeout(() => this.nextQuestion(), 1800);
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
      // WRONG ANSWER: Show Prominent Hint Box and let child try again!
      this.comboCount = 0;
      if (window.audioManager) window.audioManager.playWrong();

      if (window.uiManager) {
        window.uiManager.showFeedback(false, window.i18n ? window.i18n.t("wrongFeedback") : "差一点点，看下方小提示再试一次！");
        window.uiManager.showWrongAnswerHint(this.currentQuestion);
        window.uiManager.currentAnswerInput = "";
        window.uiManager.updateAnswerDisplay("?");
      }

      setTimeout(() => {
        this.isAnswerLocked = false;
        this.startQuestionTimerIfNeeded();
      }, 1200);
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
      const isBonus = this.comboCount > 1;
      const boost = 10 + (isBonus ? 5 : 0);
      const prevFuel = this.fuelPercentage;
      this.fuelPercentage = Math.min(100, this.fuelPercentage + boost);

      if (window.uiManager) {
        window.uiManager.animateFuelIncrease(prevFuel, this.fuelPercentage, isBonus ? 5 : 0);
        window.uiManager.showFuelFeedback(true, window.i18n ? window.i18n.t("fuelSuccessBoost", { boost }) : `⛽ 燃料加注成功！+${boost}%`);
        window.uiManager.currentAnswerInput = "";
      }

      if (window.rocketBuilder) {
        window.rocketBuilder.setFuelGlowLevel(this.fuelPercentage);
      }

      setTimeout(() => {
        this.isAnswerLocked = false;
        if (window.mathEngine) {
          this.currentQuestion = window.mathEngine.generateQuestion("normal");
          if (window.uiManager) window.uiManager.renderQuestion(this.currentQuestion, "normal");
        }
      }, 700);

    } else {
      this.comboCount = 0;
      this.isAnswerLocked = false;
      if (window.audioManager) window.audioManager.playWrong();
      if (window.uiManager) {
        window.uiManager.showFuelFeedback(false, window.i18n ? window.i18n.t("wrongFeedback") : "计算有误，再试一次！");
        window.uiManager.showWrongAnswerHint(this.currentQuestion);
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
