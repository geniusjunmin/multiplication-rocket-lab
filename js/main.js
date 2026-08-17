/**
 * Multiplication Rocket Lab - Application Main Entry & Event Dispatcher (js/main.js)
 * Version 3.0.0 Product-Grade Architecture
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Multiplication Rocket Lab v3.0.0 Product-Grade Initialized!");

  initDevMode();
  if (window.i18n) window.i18n.updateDOM();
  if (window.game) window.game.init();

  if ("serviceWorker" in navigator && typeof window !== "undefined" && window.location && window.location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      console.log("ServiceWorker registered:", reg.scope);
    }).catch(err => console.warn("ServiceWorker registration skipped:", err));
  }

  bindGlobalNavEvents();
  bindSettingsEvents();
  bindDestinationEvents();
  bindBlueprintEvents();
  bindQuizInputEvents();
  bindAssemblyEvents();
  bindLaunchEvents();
  bindResultsAndReportEvents();
  bindProfileEvents();
  bindAudioInitListener();
});

function initDevMode() {
  const isDev = (typeof window !== "undefined" && (
    (window.location && window.location.search && (window.location.search.includes("dev=1") || window.location.search.includes("dev=true"))) ||
    window.DEV_MODE === true
  ));

  if (isDev) {
    document.body.classList.add("dev-mode");
    document.querySelectorAll(".dev-btn-shortcut").forEach(btn => btn.classList.remove("hidden"));
  } else {
    document.body.classList.remove("dev-mode");
    document.querySelectorAll(".dev-btn-shortcut").forEach(btn => btn.classList.add("hidden"));
  }
}

function bindGlobalNavEvents() {
  document.getElementById("btn-home")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.HOME);
  });

  // Developer Testing Shortcut: Instantly skip all quiz questions and unlock all 10 rocket parts!
  document.getElementById("btn-dev-skip-quiz")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playUnlock();
    if (window.game) {
      window.game.skipAllQuestions();
    }
  });

  // Developer Landing & Mission Stage Jump Shortcuts
  document.getElementById("btn-dev-moon-landing")?.addEventListener("click", () => {
    if (window.game && window.launchSequence) {
      window.storageManager?.set("selectedDestination", "moon");
      window.game.setGameState(GAME_STATES.LAUNCH_READY);
      window.launchSequence.jumpToStage("approach", "moon");
    }
  });

  document.getElementById("btn-dev-mars-landing")?.addEventListener("click", () => {
    if (window.game && window.launchSequence) {
      window.storageManager?.set("selectedDestination", "mars");
      window.game.setGameState(GAME_STATES.LAUNCH_READY);
      window.launchSequence.jumpToStage("approach", "mars");
    }
  });

  document.getElementById("btn-dev-jupiter-flyby")?.addEventListener("click", () => {
    if (window.game && window.launchSequence) {
      window.storageManager?.set("selectedDestination", "jupiter");
      window.game.setGameState(GAME_STATES.LAUNCH_READY);
      window.launchSequence.jumpToStage("approach", "jupiter");
    }
  });

  document.getElementById("btn-dev-saturn-orbit")?.addEventListener("click", () => {
    if (window.game && window.launchSequence) {
      window.storageManager?.set("selectedDestination", "saturn");
      window.game.setGameState(GAME_STATES.LAUNCH_READY);
      window.launchSequence.jumpToStage("approach", "saturn");
    }
  });

  document.getElementById("btn-lang-toggle")?.addEventListener("click", () => {
    if (window.i18n) {
      const next = window.i18n.currentLanguage === "en" ? "zh" : "en";
      window.i18n.setLanguage(next);
      if (window.uiManager) window.uiManager.updateDOM();
    }
  });

  document.getElementById("btn-sound-toggle")?.addEventListener("click", () => {
    if (window.audioManager) {
      const enabled = window.audioManager.toggleSound();
      document.getElementById("sound-icon").innerText = enabled ? "🔊" : "🔇";
      if (window.storageManager) window.storageManager.set("soundEnabled", enabled);
    }
  });

  document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  });

  document.getElementById("btn-start-game")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.startNewGameRound(GAME_MODES.NORMAL);
  });

  document.getElementById("btn-continue-game")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.BLUEPRINT);
  });

  document.getElementById("btn-open-settings")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    syncMissionSettingsUI();
    if (window.game) window.game.setGameState(GAME_STATES.SETTINGS);
  });

  document.getElementById("btn-open-report")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.uiManager) window.uiManager.renderParentReport();
    document.getElementById("modal-report")?.classList.remove("hidden");
  });

  document.getElementById("btn-close-report")?.addEventListener("click", () => {
    document.getElementById("modal-report")?.classList.add("hidden");
  });
}

function bindProfileEvents() {
  document.getElementById("btn-add-profile")?.addEventListener("click", () => {
    document.getElementById("modal-add-profile")?.classList.remove("hidden");
  });

  document.getElementById("btn-close-add-profile")?.addEventListener("click", () => {
    document.getElementById("modal-add-profile")?.classList.add("hidden");
  });

  document.getElementById("btn-confirm-add-profile")?.addEventListener("click", () => {
    const name = document.getElementById("input-new-profile-name")?.value || "Alex";
    const preset = document.getElementById("select-new-profile-preset")?.value || "year2";

    if (window.profileManager) {
      window.profileManager.addProfile(name, preset);
      document.getElementById("modal-add-profile")?.classList.add("hidden");
      if (window.uiManager) window.uiManager.updateProfileHUD();
    }
  });
}

function bindSettingsEvents() {
  // Free Challenge Preset Selector Buttons
  document.querySelectorAll(".btn-challenge-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const challengeKey = btn.getAttribute("data-challenge");
      const preset = CONFIG.MATH_CHALLENGE_PRESETS[challengeKey];
      if (preset && window.storageManager) {
        window.storageManager.set("selectedMathChallenge", challengeKey);
        if (window.mathEngine) window.mathEngine.setChallengeConfig(preset);
        
        document.querySelectorAll(".btn-challenge-preset").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      }
    });
  });

  // UK Curriculum Quick Preset Buttons
  document.querySelectorAll(".btn-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const presetKey = btn.getAttribute("data-preset");
      const preset = CONFIG.CURRICULUM_PRESETS[presetKey];
      if (preset && window.storageManager) {
        window.storageManager.set("yearPreset", presetKey);
        window.storageManager.set("selectedTables", [...preset.tables]);
        
        document.querySelectorAll(".btn-chip").forEach(chip => {
          const tableNum = Number(chip.getAttribute("data-table"));
          if (preset.tables.includes(tableNum)) chip.classList.add("selected");
          else chip.classList.remove("selected");
        });
      }
    });
  });

  document.querySelectorAll(".btn-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      if (window.audioManager) window.audioManager.playClick();
    });
  });

  document.getElementById("btn-select-all-tables")?.addEventListener("click", () => {
    document.querySelectorAll(".btn-chip").forEach(c => c.classList.add("selected"));
  });

  document.getElementById("btn-save-settings")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();

    const selectedTables = [];
    document.querySelectorAll(".btn-chip").forEach(c => {
      if (c.classList.contains("selected")) {
        selectedTables.push(Number(c.getAttribute("data-table")));
      }
    });

    const playerName = document.getElementById("input-player-name")?.value || "Alex";
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "normal";
    const timerSeconds = Number(document.getElementById("select-timer-seconds")?.value || 8);
    const reducedMotion = document.getElementById("chk-reduced-motion")?.checked || false;

    if (window.storageManager) {
      window.storageManager.update({
        playerName,
        selectedTables: selectedTables.length > 0 ? selectedTables : [2, 5, 10],
        difficulty,
        timerSeconds,
        reducedMotion
      });
    }

    if (window.game) window.game.startNewGameRound(GAME_MODES.NORMAL);
  });
}

function syncMissionSettingsUI() {
  const selectedDest = window.storageManager ? (window.storageManager.get("selectedDestination") || "moon") : "moon";
  document.querySelectorAll(".dest-card").forEach(card => {
    if (card.getAttribute("data-dest") === selectedDest) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
  if (window.destinationManager) {
    window.destinationManager.initPlanetPreview("planet-preview-canvas", selectedDest);
  }
}

function bindDestinationEvents() {
  syncMissionSettingsUI();

  document.querySelectorAll(".dest-card").forEach(card => {
    card.addEventListener("click", () => {
      const destId = card.getAttribute("data-dest");
      if (destId && window.destinationManager) {
        window.destinationManager.setDestination(destId);
        document.querySelectorAll(".dest-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");

        window.destinationManager.initPlanetPreview("planet-preview-canvas", destId);
      }
    });
  });
}

function bindBlueprintEvents() {
  document.getElementById("btn-start-answering")?.addEventListener("click", () => {
    if (window.game) window.game.setGameState(GAME_STATES.QUESTION);
  });

  document.getElementById("btn-go-assembly")?.addEventListener("click", () => {
    if (window.game) window.game.setGameState(GAME_STATES.ASSEMBLY);
  });
}

function bindQuizInputEvents() {
  document.querySelectorAll(".choice-btn").forEach(btn => {
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", () => {
      btn.blur();
      const val = btn.getAttribute("data-val");
      if (window.game) window.game.submitAnswer(val);
    });
  });

  document.querySelectorAll(".key-btn").forEach(keyBtn => {
    keyBtn.addEventListener("mousedown", (e) => e.preventDefault());
    keyBtn.addEventListener("click", () => {
      keyBtn.blur();
      const key = keyBtn.getAttribute("data-key");
      if (window.audioManager) window.audioManager.playClick();
      if (window.uiManager) window.uiManager.appendKeyInput(key);
    });
  });

  // Dev Shortcut: Fill 100% fuel instantly
  document.getElementById("btn-dev-fill-fuel")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playUnlock();
    if (window.game) {
      const prev = window.game.fuelPercentage;
      window.game.fuelLoaded = window.game.fuelRequired;
      window.game.fuelPercentage = 100;
      if (window.uiManager) {
        window.uiManager.animateFuelIncrease(prev, 100, 5);
        const destId = window.storageManager ? (window.storageManager.get("selectedDestination") || "moon") : "moon";
        window.uiManager.updateFuelMissionTarget(destId, window.game.fuelLoaded, window.game.fuelRequired);
      }
      if (window.rocketBuilder) {
        window.rocketBuilder.setFuelGlowLevel(100);
      }
    }
  });

  document.querySelectorAll(".fuel-key").forEach(btn => {
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", () => {
      btn.blur();
      const key = btn.getAttribute("data-key");
      if (window.audioManager) window.audioManager.playClick();

      if (key === "clear") {
        if (window.uiManager) window.uiManager.appendKeyInput("clear");
      } else if (key === "submit") {
        if (window.uiManager && window.game) {
          const ans = window.uiManager.currentAnswerInput;
          if (ans) window.game.submitFuelAnswer(ans);
        }
      } else {
        if (window.uiManager) window.uiManager.appendKeyInput(key);
      }
    });
  });

  document.getElementById("btn-submit-answer")?.addEventListener("click", () => {
    if (window.uiManager && window.game) {
      const answer = window.uiManager.currentAnswerInput;
      if (answer) window.game.submitAnswer(answer);
    }
  });

  window.addEventListener("keydown", (e) => {
    const modalReward = document.getElementById("modal-part-reward");
    const modalComplete = document.getElementById("modal-rocket-complete");
    const modalReport = document.getElementById("modal-report");

    if (e.key === "Enter") {
      if (modalReward && !modalReward.classList.contains("hidden")) {
        e.preventDefault();
        modalReward.classList.add("hidden");
        if (window.game) window.game.setGameState(GAME_STATES.QUESTION);
        return;
      }
      if (modalComplete && !modalComplete.classList.contains("hidden")) {
        e.preventDefault();
        document.getElementById("btn-complete-go-fuel")?.click();
        return;
      }
      if (modalReport && !modalReport.classList.contains("hidden")) {
        e.preventDefault();
        document.getElementById("btn-close-report")?.click();
        return;
      }
    }

    if (e.key === "Escape") {
      modalReward?.classList.add("hidden");
      modalComplete?.classList.add("hidden");
      modalReport?.classList.add("hidden");
      return;
    }

    if (window.game && (window.game.currentState === GAME_STATES.QUESTION || window.game.currentState === GAME_STATES.FUEL_CHALLENGE)) {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        if (window.uiManager) window.uiManager.appendKeyInput(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (window.uiManager) window.uiManager.appendKeyInput("backspace");
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (window.uiManager && window.game) {
          const answer = window.uiManager.currentAnswerInput;
          if (answer) {
            if (window.game.currentState === GAME_STATES.FUEL_CHALLENGE) {
              window.game.submitFuelAnswer(answer);
            } else {
              window.game.submitAnswer(answer);
            }
          }
        }
      }
    }
  });

  document.getElementById("btn-reward-install")?.addEventListener("click", () => {
    document.getElementById("modal-part-reward")?.classList.add("hidden");
    if (window.game) window.game.setGameState(GAME_STATES.ASSEMBLY);
  });

  document.getElementById("btn-reward-continue")?.addEventListener("click", () => {
    document.getElementById("modal-part-reward")?.classList.add("hidden");
    if (window.game) window.game.setGameState(GAME_STATES.QUESTION);
  });
}

function bindAssemblyEvents() {
  // Sequential Auto-Assembly with Skip Support
  document.getElementById("btn-install-all")?.addEventListener("click", () => {
    if (!window.storageManager || !window.rocketBuilder) return;
    const unlocked = window.storageManager.get("unlockedParts") || [];
    const installed = window.storageManager.get("installedParts") || [];
    const partsToInstall = unlocked.filter(p => !installed.includes(p));

    if (partsToInstall.length === 0) return;

    if (window.rocketBuilder.isSequentialAssembling) {
      // Skip: instantly fit all remaining parts
      partsToInstall.forEach(partId => window.storageManager.installPart(partId));
      window.rocketBuilder.isSequentialAssembling = false;
      window.rocketBuilder.updateInstalledParts(unlocked);
      if (window.uiManager) window.uiManager.renderAssemblyDock();
      return;
    }

    window.rocketBuilder.assembleSequentially(
      partsToInstall,
      (partId) => {
        window.storageManager.installPart(partId);
        if (window.uiManager) window.uiManager.renderAssemblyDock();
      },
      () => {
        if (window.uiManager) {
          window.uiManager.renderAssemblyDock();
          const finalInstalled = window.storageManager.get("installedParts") || [];
          if (finalInstalled.length >= CONFIG.PART_COUNT) {
            window.uiManager.triggerAssemblyCelebration();
          }
        }
      }
    );
  });

  document.getElementById("select-rocket-model")?.addEventListener("change", (e) => {
    const model = e.target.value;
    if (window.rocketBuilder) window.rocketBuilder.setModel(model);
  });

  document.getElementById("select-rocket-theme")?.addEventListener("change", (e) => {
    const theme = e.target.value;
    if (window.rocketBuilder) window.rocketBuilder.setTheme(theme);
  });

  document.getElementById("btn-reset-assembly-cam")?.addEventListener("click", () => {
    if (window.rocketBuilder) {
      window.rocketBuilder.fitCameraToRocket();
    }
  });

  document.getElementById("btn-assembly-help")?.addEventListener("click", () => {
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    alert(isZh ? "💡 3D 组装指南：\n1. 点击下方已解包零件，看着它们精准卡扣飞入 3D 火箭！\n2. 必须卡扣完成所有 10 个零件后，才能解锁【冲向燃料补充舱】按钮！" : "💡 3D Assembly Guide:\n1. Click unlocked parts to snap them onto your rocket.\n2. All 10 parts must be fitted to proceed!");
  });

  document.getElementById("btn-complete-assembly")?.addEventListener("click", () => {
    document.getElementById("modal-rocket-complete")?.classList.add("hidden");
    if (window.game) window.game.setGameState(GAME_STATES.ASSEMBLY);
  });

  document.getElementById("btn-complete-go-fuel")?.addEventListener("click", () => {
    document.getElementById("modal-rocket-complete")?.classList.add("hidden");
    if (window.game) {
      window.game.setGameState(GAME_STATES.ASSEMBLY);
    }
  });

  document.getElementById("btn-go-fuel")?.addEventListener("click", () => {
    const installed = window.storageManager ? (window.storageManager.get("installedParts") || []) : [];
    if (installed.length < CONFIG.PART_COUNT) {
      const isZh = window.i18n && window.i18n.currentLanguage === "zh";
      alert(isZh ? `🔒 必须先在 3D 车间中安装完成所有 10 个火箭零件，才能进入燃料舱升空！(已安装 ${installed.length}/10)` : `🔒 Please fit all 10 parts before proceeding to Fuel Chamber! (${installed.length}/10)`);
      return;
    }

    document.getElementById("modal-rocket-complete")?.classList.add("hidden");
    if (window.game) {
      window.game.fuelLoaded = 0;
      window.game.fuelPercentage = 0;
      if (window.uiManager) window.uiManager.updateFuelGauge(0);
      window.game.setGameState(GAME_STATES.FUEL_CHALLENGE);
    }
  });
}

function bindLaunchEvents() {
  document.getElementById("btn-ready-to-launch")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.LAUNCH_READY);

    if (window.launchSequence) {
      const destId = window.storageManager ? (window.storageManager.get("selectedDestination") || "moon") : "moon";
      window.launchSequence.startLaunchSequence(() => {
        console.log(`Mission to ${destId} complete!`);
      });
    }
  });

  document.getElementById("btn-skip-countdown")?.addEventListener("click", () => {
    if (window.launchSequence) {
      window.launchSequence.countdownValue = 0;
    }
  });

  document.getElementById("btn-view-results")?.addEventListener("click", () => {
    showResultsScreen();
  });

  document.getElementById("btn-replay-landing")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.launchSequence) {
      window.launchSequence.replayLanding();
    }
  });
}

function bindResultsAndReportEvents() {
  document.getElementById("btn-restart-game")?.addEventListener("click", () => {
    if (window.game) window.game.startNewGameRound(GAME_MODES.NORMAL);
  });

  document.getElementById("btn-retry-wrongs")?.addEventListener("click", () => {
    if (window.game) window.game.startNewGameRound(GAME_MODES.WRONG_REVIEW);
  });

  document.getElementById("btn-practice-wrongs-mode")?.addEventListener("click", () => {
    document.getElementById("modal-report")?.classList.add("hidden");
    if (window.game) window.game.startNewGameRound(GAME_MODES.WRONG_REVIEW);
  });

  document.getElementById("btn-export-json")?.addEventListener("click", () => {
    if (!window.profileManager) return;
    const jsonStr = window.profileManager.exportDataJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rocket_learning_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("btn-export-csv")?.addEventListener("click", () => {
    if (!window.profileManager) return;
    const csvStr = window.profileManager.exportReportCsv();
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `multiplication_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("btn-clear-data")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset learning stats for this child player?")) {
      if (window.storageManager) window.storageManager.clearAll();
      document.getElementById("modal-report")?.classList.add("hidden");
      if (window.game) window.game.setGameState(GAME_STATES.HOME);
    }
  });
}

function showResultsScreen() {
  if (!window.game) return;

  const score = window.game.score;
  const total = window.game.totalQuestionsCount;
  const correct = window.game.correctAnswersCount;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

  document.getElementById("res-score").innerText = score;
  document.getElementById("res-accuracy").innerText = `${accuracy}%`;
  document.getElementById("res-max-combo").innerText = `${window.game.maxCombo}`;

  const star1 = document.getElementById("star-1");
  const star2 = document.getElementById("star-2");
  const star3 = document.getElementById("star-3");

  if (star1) star1.classList.add("active");
  if (accuracy >= 70 && star2) star2.classList.add("active");
  if (accuracy >= 90 && star3) star3.classList.add("active");

  if (window.game) window.game.setGameState(GAME_STATES.RESULTS);
}

function bindAudioInitListener() {
  const handler = () => {
    if (window.audioManager) {
      window.audioManager.init();
    }
    window.removeEventListener("click", handler);
  };
  window.addEventListener("click", handler);
}
