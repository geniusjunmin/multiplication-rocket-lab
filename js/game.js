/**
 * Multiplication Rocket Lab - State Machine & Adventure Flow Manager (js/game.js)
 * Version 4.0.0 Space Adventure Progression Architecture
 * Coordinates Mission Board, Dynamic In-Flight Events, Nova Mascot Telemetry,
 * Combo Engine Power, Non-Punitive Objective Checking & Mission Debrief.
 */
const GAME_STATES = {
  HOME: "home",
  SETTINGS: "settings",
  MISSION_BOARD: "missionBoard",
  MUSEUM: "museum",
  GARAGE: "garage",
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
    
    // Active Mission State
    this.activeMission = null;
    this.routeOption = "safe"; // "safe" | "boost"
    this.selectedPayload = "probe"; // "probe" | "rover" | "cargo" | "satellite"
    this.objectivesStatus = [];
    this.hasTriggeredMidFlightEvent = false;
    this.activeEvent = null;
    this.activeEventQuestionIdx = 0;
    this.eventMistakes = 0;

    // Fuel Economy Framework
    this.fuelLoaded = 0;
    this.fuelRequired = 100;
    this.fuelPercentage = 0;
    this.fuelAttemptCount = 0;

    this.currentQuestion = null;
    this.attemptCount = 0;
    this.questionShownAt = 0;
    this.isAnswerLocked = false;

    // Hard Mode Timer
    this.timerSeconds = 8;
    this.timerRemainingMs = 8000;
    this.timerInterval = null;

    this.validTransitions = {
      [GAME_STATES.HOME]: [GAME_STATES.SETTINGS, GAME_STATES.MISSION_BOARD, GAME_STATES.MUSEUM, GAME_STATES.GARAGE, GAME_STATES.BLUEPRINT, GAME_STATES.QUESTION, GAME_STATES.REPORT],
      [GAME_STATES.SETTINGS]: [GAME_STATES.HOME, GAME_STATES.MISSION_BOARD, GAME_STATES.BLUEPRINT, GAME_STATES.QUESTION],
      [GAME_STATES.MISSION_BOARD]: [GAME_STATES.HOME, GAME_STATES.BLUEPRINT, GAME_STATES.QUESTION, GAME_STATES.ASSEMBLY, GAME_STATES.SETTINGS],
      [GAME_STATES.MUSEUM]: [GAME_STATES.HOME, GAME_STATES.MISSION_BOARD, GAME_STATES.GARAGE],
      [GAME_STATES.GARAGE]: [GAME_STATES.HOME, GAME_STATES.MISSION_BOARD, GAME_STATES.ASSEMBLY],
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
      [GAME_STATES.RESULTS]: [GAME_STATES.HOME, GAME_STATES.MISSION_BOARD, GAME_STATES.QUESTION, GAME_STATES.BLUEPRINT, GAME_STATES.REPORT],
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

    const mId = window.storageManager.get("selectedMissionId") || "moon_crater_survey";
    if (window.missionManager) {
      this.activeMission = window.missionManager.getMission(mId);
    }
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
        if (window.uiManager) window.uiManager.updateHomeProgressHUD();
        break;
      case GAME_STATES.MISSION_BOARD:
        if (window.uiManager) window.uiManager.renderMissionBoard();
        break;
      case GAME_STATES.MUSEUM:
        if (window.uiManager) window.uiManager.renderSpaceMuseum();
        break;
      case GAME_STATES.GARAGE:
        if (window.uiManager) window.uiManager.renderRocketGarage();
        break;
      case GAME_STATES.BLUEPRINT:
        if (window.uiManager) window.uiManager.updateBlueprintView();
        break;
      case GAME_STATES.QUESTION:
        if (window.uiManager) window.uiManager.hideAllWrongAnswerHints();
        if (!this.currentQuestion) {
          this.nextQuestion();
        } else {
          this.startQuestionTimerIfNeeded();
        }
        break;
      case GAME_STATES.ASSEMBLY:
        if (window.rocketBuilder) {
          window.rocketBuilder.initScene("canvas-container-assembly");
          requestAnimationFrame(() => {
            if (window.rocketBuilder) window.rocketBuilder.onWindowResize("canvas-container-assembly");
          });
        }
        if (window.uiManager) window.uiManager.renderAssemblyDock();
        break;
      case GAME_STATES.FUEL_CHALLENGE:
        const installedFuel = window.storageManager ? (window.storageManager.get("installedParts") || []) : [];
        if (installedFuel.length < CONFIG.PART_COUNT) {
          console.warn("Assembly incomplete! Redirecting to Assembly Workshop.");
          this.currentState = GAME_STATES.ASSEMBLY;
          if (window.rocketBuilder) window.rocketBuilder.initScene("canvas-container-assembly");
          if (window.uiManager) window.uiManager.renderAssemblyDock();
          return;
        }

        const destId = this.activeMission ? this.activeMission.destination : (window.storageManager ? (window.storageManager.get("selectedDestination") || "moon") : "moon");
        const baseFuel = (CONFIG.DESTINATIONS[destId] && CONFIG.DESTINATIONS[destId].fuelRequired) || 100;
        const fuelMod = this.activeMission ? (this.activeMission.fuelModifier || 1.0) : 1.0;
        this.fuelRequired = Math.round(baseFuel * fuelMod);
        if (typeof this.fuelLoaded !== "number") this.fuelLoaded = 0;
        this.fuelPercentage = Math.min(100, Math.round((this.fuelLoaded / this.fuelRequired) * 100));
        this.fuelAttemptCount = 0;

        if (window.rocketBuilder) {
          window.rocketBuilder.initScene("canvas-container-fuel");
          window.rocketBuilder.setFuelGlowLevel(this.fuelPercentage);
        }
        if (window.uiManager) {
          window.uiManager.hideAllWrongAnswerHints();
          window.uiManager.updateFuelMissionTarget(destId, this.fuelLoaded, this.fuelRequired);
          window.uiManager.updateFuelGauge(this.fuelPercentage);
        }
        if (window.mathEngine) {
          this.currentQuestion = window.mathEngine.generateQuestion("normal", this.getMissionMathFilter());
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
          const destId = this.activeMission ? this.activeMission.destination : (window.storageManager ? (window.storageManager.get("selectedDestination") || "moon") : "moon");
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

  /**
   * Start a Mission with full configuration, story objectives, payload and route
   */
  startMission(missionId, options = {}) {
    const mission = (window.missionManager ? window.missionManager.getMission(missionId) : null) || CONFIG.MISSION_DEFINITIONS[missionId] || CONFIG.MISSION_DEFINITIONS.moon_crater_survey;
    this.activeMission = mission;
    this.routeOption = options.route || "safe";
    this.selectedPayload = options.payload || mission.recommendedPayload || "probe";
    this.hasTriggeredMidFlightEvent = false;

    if (window.storageManager) {
      window.storageManager.set("selectedMissionId", mission.id);
      window.storageManager.set("selectedDestination", mission.destination);
      window.storageManager.set("selectedPayload", this.selectedPayload);
    }

    // Initialize Objectives
    this.objectivesStatus = mission.objectives.map(obj => ({
      ...obj,
      completed: false
    }));

    // Math Question Counts
    let qTarget = mission.questionTarget || 15;
    if (this.routeOption === "boost") {
      qTarget = Math.max(10, qTarget - 2);
    }
    this.totalQuestionsCount = qTarget;

    this.score = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.currentQuestionIdx = 0;
    this.correctAnswersCount = 0;

    if (window.mathEngine) {
      window.mathEngine.resetSessionStats();
    }

    // Clear session parts so child can build / quick prep
    if (window.storageManager) {
      window.storageManager.set("unlockedParts", []);
      window.storageManager.set("installedParts", []);
      window.storageManager.set("score", 0);
    }

    if (window.uiManager) {
      window.uiManager.showMascotDialogue(`🚀 NOVA: "${mission.titleZh || mission.titleEn} 航天任务准备就绪！"`);
    }

    this.nextQuestion();
    this.setGameState(GAME_STATES.QUESTION);
  }

  startNewGameRound(mode = GAME_MODES.NORMAL) {
    this.gameMode = mode;
    const mId = window.storageManager ? (window.storageManager.get("selectedMissionId") || "moon_crater_survey") : "moon_crater_survey";
    this.startMission(mId);
  }

  getMissionMathFilter() {
    if (!this.activeMission) return null;
    return {
      focusTables: this.activeMission.mathFocus || null,
      operations: (this.activeMission.modifier === "mixed") ? ["multiply", "divide"] : null
    };
  }

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

    // Mark primary objective
    if (this.objectivesStatus[0]) this.objectivesStatus[0].completed = true;

    document.getElementById("modal-rocket-complete")?.classList.remove("hidden");
  }

  nextQuestion() {
    this.attemptCount = 0;
    this.isAnswerLocked = false;
    this.stopHardModeTimer();

    const unlockedParts = window.storageManager ? (window.storageManager.get("unlockedParts") || []) : [];

    // Check if ready for assembly or complete
    if (this.currentQuestionIdx >= this.totalQuestionsCount) {
      if (unlockedParts.length >= CONFIG.PART_COUNT) {
        this.checkRoundCompletion();
        return;
      } else {
        this.totalQuestionsCount += 5;
      }
    }

    // Mid-Flight Surprise Event Trigger (at ~50% of quiz progress)
    if (!this.hasTriggeredMidFlightEvent && this.currentQuestionIdx >= Math.floor(this.totalQuestionsCount * 0.5) && this.activeMission && this.activeMission.eventPool && this.activeMission.eventPool.length > 0) {
      this.hasTriggeredMidFlightEvent = true;
      const eventKey = this.activeMission.eventPool[Math.floor(Math.random() * this.activeMission.eventPool.length)];
      if (CONFIG.EVENT_DEFINITIONS[eventKey] && window.uiManager) {
        window.uiManager.triggerFlightEventModal(CONFIG.EVENT_DEFINITIONS[eventKey]);
        return;
      }
    }

    this.currentQuestionIdx++;

    if (window.mathEngine) {
      this.currentQuestion = window.mathEngine.generateQuestion(this.gameMode, this.getMissionMathFilter());
    }

    this.questionShownAt = Date.now();

    if (window.uiManager) {
      const difficulty = window.storageManager ? window.storageManager.get("difficulty") : "normal";
      window.uiManager.renderQuestion(this.currentQuestion, difficulty);
      window.uiManager.updateQuizHUD(
        this.currentQuestionIdx,
        this.totalQuestionsCount,
        this.comboCount,
        this.score,
        this.getComboPowerLevel()
      );
    }

    this.startQuestionTimerIfNeeded();
  }

  getComboPowerLevel() {
    if (this.comboCount >= 10) return { level: 3, label: "⚡ HYPER BOOST", color: "#38bdf8" };
    if (this.comboCount >= 5) return { level: 2, label: "🔥🔥 BOOSTER LV.2", color: "#f59e0b" };
    if (this.comboCount >= 3) return { level: 1, label: "🔥 BOOSTER LV.1", color: "#10b981" };
    return { level: 0, label: "NORMAL", color: "#94a3b8" };
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
      window.uiManager.showWrongAnswerHint(this.currentQuestion, { context: "quiz", attempt: 1 });
    }

    if (window.mathEngine && this.currentQuestion) {
      window.mathEngine.recordResult(this.currentQuestion, false, true, this.timerSeconds * 1000);
    }

    this.comboCount = 0;
    if (window.rocketBuilder) window.rocketBuilder.setNavWarning(true);

    setTimeout(() => {
      if (window.rocketBuilder) window.rocketBuilder.setNavWarning(false);
      this.nextQuestion();
    }, 3500);
  }

  submitAnswer(userAnswer) {
    if (this.isAnswerLocked || !this.currentQuestion) return;
    this.isAnswerLocked = true;
    this.stopHardModeTimer();

    const numAns = Number(userAnswer);
    this.attemptCount++;
    const isFirstTry = (this.attemptCount === 1);
    const isCorrect = (numAns === this.currentQuestion.answer);
    const responseTimeMs = Date.now() - this.questionShownAt;

    let mathResult = null;
    if (window.mathEngine) {
      mathResult = window.mathEngine.recordResult(
        this.currentQuestion,
        isCorrect,
        isFirstTry,
        responseTimeMs
      );
    }

    if (isCorrect) {
      if (window.audioManager) window.audioManager.playCorrect();

      const prevCombo = this.comboCount;
      this.comboCount++;
      if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;

      // Audio & Visual milestones on combo tier upgrades
      if ((prevCombo < 3 && this.comboCount >= 3) || (prevCombo < 5 && this.comboCount >= 5) || (prevCombo < 10 && this.comboCount >= 10)) {
        if (window.audioManager) window.audioManager.playComboMilestone(this.comboCount >= 10 ? 3 : (this.comboCount >= 5 ? 2 : 1));
      }

      const basePoints = this.attemptCount <= 1 ? 100 : (this.attemptCount === 2 ? 70 : 50);
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

      if (window.rocketBuilder) {
        window.rocketBuilder.pulseRocketLights(this.comboCount >= 5 ? 0x38bdf8 : 0x10b981);
        window.rocketBuilder.setNavWarning(false);
      }

      if (window.uiManager) {
        window.uiManager.showFeedback(true, window.i18n ? window.i18n.t("correctFeedback") : "✨ 太棒了！回答正确！");
        window.uiManager.updateQuizHUD(
          this.currentQuestionIdx,
          this.totalQuestionsCount,
          this.comboCount,
          this.score,
          this.getComboPowerLevel()
        );
      }

      // Check Objectives Progress live
      this.checkLiveObjectives();

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
      }, 750);

    } else {
      this.comboCount = 0;
      if (window.audioManager) window.audioManager.playWrong();

      if (window.rocketBuilder) {
        window.rocketBuilder.setNavWarning(true);
      }

      if (window.uiManager) {
        window.uiManager.showFeedback(false, window.i18n ? window.i18n.t("wrongFeedback") : "差一点点，看下方小提示再试一次！");
        window.uiManager.showWrongAnswerHint(this.currentQuestion, { context: "quiz", attempt: this.attemptCount });
        window.uiManager.currentAnswerInput = "";
        window.uiManager.updateAnswerDisplay("?");
      }

      setTimeout(() => {
        this.isAnswerLocked = false;
        this.startQuestionTimerIfNeeded();
      }, 1200);
    }
  }

  checkLiveObjectives() {
    if (!this.objectivesStatus) return;
    const curAcc = window.mathEngine ? window.mathEngine.getFirstTryAccuracy() : 100;

    this.objectivesStatus.forEach(obj => {
      if (obj.type === "complete") {
        obj.completed = true;
      } else if (obj.type === "accuracy") {
        if (curAcc >= (obj.target || 80)) obj.completed = true;
        else if (this.currentQuestionIdx >= this.totalQuestionsCount) obj.completed = false;
      } else if (obj.type === "streak") {
        if (this.maxCombo >= (obj.target || 5)) obj.completed = true;
      }
    });
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

    const destId = this.activeMission ? this.activeMission.destination : (window.storageManager ? (window.storageManager.get("selectedDestination") || "moon") : "moon");
    const numAns = Number(userAnswer);

    if (numAns === this.currentQuestion.answer) {
      if (window.audioManager) window.audioManager.playCorrect();
      this.comboCount++;
      this.fuelAttemptCount = 0;

      const baseUnits = 10;
      let bonusUnits = 0;
      if (this.comboCount >= 5) bonusUnits = 3;
      else if (this.comboCount >= 3) bonusUnits = 2;
      const addedUnits = baseUnits + bonusUnits;

      const prevPct = this.fuelPercentage;
      this.fuelLoaded = Math.min(this.fuelRequired, this.fuelLoaded + addedUnits);
      this.fuelPercentage = Math.min(100, Math.round((this.fuelLoaded / this.fuelRequired) * 100));

      if (window.uiManager) {
        window.uiManager.animateFuelIncrease(prevPct, this.fuelPercentage, bonusUnits);
        window.uiManager.showFuelFeedback(true, window.i18n ? window.i18n.t("fuelSuccessBoost", { boost: addedUnits }) : `⛽ 燃料加注成功！+${addedUnits} 能量`);
        window.uiManager.updateFuelMissionTarget(destId, this.fuelLoaded, this.fuelRequired);
        window.uiManager.currentAnswerInput = "";
      }

      if (window.rocketBuilder) {
        window.rocketBuilder.setFuelGlowLevel(this.fuelPercentage);
      }

      setTimeout(() => {
        this.isAnswerLocked = false;
        if (window.mathEngine) {
          this.currentQuestion = window.mathEngine.generateQuestion("normal", this.getMissionMathFilter());
          if (window.uiManager) {
            window.uiManager.hideAllWrongAnswerHints();
            window.uiManager.renderQuestion(this.currentQuestion, "normal");
          }
        }
      }, 700);

    } else {
      this.comboCount = 0;
      this.fuelAttemptCount = (this.fuelAttemptCount || 0) + 1;
      this.isAnswerLocked = false;
      if (window.audioManager) window.audioManager.playWrong();
      if (window.uiManager) {
        window.uiManager.showFuelFeedback(false, window.i18n ? window.i18n.t("wrongFeedback") : "计算有误，再试一次！");
        window.uiManager.showWrongAnswerHint(this.currentQuestion, { context: "fuel", attempt: this.fuelAttemptCount });
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
      missionId: this.activeMission ? this.activeMission.id : "moon_crater_survey",
      score: this.score,
      currentQuestionIdx: this.currentQuestionIdx,
      fuelLoaded: this.fuelLoaded,
      fuelRequired: this.fuelRequired,
      fuelPercentage: this.fuelPercentage,
      savedAt: Date.now()
    });
  }
}

window.game = new MultiplicationGame();
if (typeof module !== "undefined") {
  module.exports = { MultiplicationGame, GAME_STATES, GAME_MODES };
}
