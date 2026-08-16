/**
 * 乘法火箭实验室 - 主应用入口与全局事件调度 (main.js)
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Multiplication Rocket Lab: 页面 DOM 加载完毕，开始绑定事件器...");

  // 1. 检查 WebGL 支持度
  checkWebGLSupport();

  // 2. 初始化游戏系统
  if (window.game) window.game.init();

  // 3. 检查是否存在已存游戏，更新“继续游戏”按钮
  if (window.storageManager && window.storageManager.hasSaveGame()) {
    const btnContinue = document.getElementById("btn-continue-game");
    if (btnContinue) btnContinue.classList.remove("hidden");
  }

  // 4. 绑定全局与导航按钮事件
  bindGlobalNavEvents();

  // 5. 绑定设置页面事件
  bindSettingsEvents();

  // 6. 绑定工程蓝图页面事件
  bindBlueprintEvents();

  // 7. 绑定答题与数字键盘事件
  bindQuizInputEvents();

  // 8. 绑定 3D 组装车间事件
  bindAssemblyEvents();

  // 9. 绑定发射序列事件
  bindLaunchEvents();

  // 10. 绑定结算与报告按键事件
  bindResultsAndReportEvents();

  // 11. 绑定音频 Context 首次激活监听
  bindAudioInitListener();
});

/**
 * 检查 WebGL 兼容性并处理优雅降级
 */
function checkWebGLSupport() {
  let webglAvailable = false;
  try {
    const canvas = document.createElement("canvas");
    webglAvailable = !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    webglAvailable = false;
  }

  if (!webglAvailable) {
    const fallbackBanner = document.getElementById("webgl-fallback-banner");
    if (fallbackBanner) fallbackBanner.classList.remove("hidden");
  }
}

/**
 * 绑定全局 Header 与主菜单按键事件
 */
function bindGlobalNavEvents() {
  // 首页按钮
  document.getElementById("btn-home")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.HOME);
  });

  // 音频切换
  document.getElementById("btn-sound-toggle")?.addEventListener("click", () => {
    if (window.audioManager) {
      const enabled = window.audioManager.toggleSound();
      document.getElementById("sound-icon").innerText = enabled ? "🔊" : "🔇";
      if (window.storageManager) window.storageManager.set("soundEnabled", enabled);
    }
  });

  // 全屏切换
  document.getElementById("btn-fullscreen")?.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("无法进入全屏:", err);
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  });

  // 首页“开始建造火箭”
  document.getElementById("btn-start-game")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.startNewGameRound();
  });

  // 首页“继续已有进度”
  document.getElementById("btn-continue-game")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.BLUEPRINT);
  });

  // 首页“学习设置”与“家长报告”
  document.getElementById("btn-open-settings")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.SETTINGS);
  });

  document.getElementById("btn-open-report")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    openParentReportModal();
  });

  document.getElementById("btn-close-report")?.addEventListener("click", () => {
    document.getElementById("modal-report")?.classList.add("hidden");
  });
}

/**
 * 绑定学习设置页面交互逻辑
 */
function bindSettingsEvents() {
  const chips = document.querySelectorAll(".btn-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      if (window.audioManager) window.audioManager.playClick();
    });
  });

  document.getElementById("btn-select-all-tables")?.addEventListener("click", () => {
    chips.forEach(c => c.classList.add("selected"));
  });

  document.getElementById("btn-save-settings")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();

    const selectedTables = [];
    chips.forEach(c => {
      if (c.classList.contains("selected")) {
        selectedTables.push(Number(c.getAttribute("data-table")));
      }
    });

    const playerName = document.getElementById("input-player-name")?.value || "小宇航员";
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "normal";
    const reducedMotion = document.getElementById("chk-reduced-motion")?.checked || false;

    if (window.storageManager) {
      window.storageManager.update({
        playerName,
        selectedTables: selectedTables.length > 0 ? selectedTables : [2, 3, 4, 5],
        difficulty,
        reducedMotion
      });
    }

    if (window.mathEngine) window.mathEngine.setTables(selectedTables);
    if (window.game) window.game.startNewGameRound();
  });

  document.getElementById("btn-back-home")?.addEventListener("click", () => {
    if (window.game) window.game.setGameState(GAME_STATES.HOME);
  });
}

/**
 * 绑定工程蓝图页面事件
 */
function bindBlueprintEvents() {
  document.getElementById("btn-start-answering")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.QUESTION);
  });

  document.getElementById("btn-go-assembly")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.ASSEMBLY);
  });
}

/**
 * 绑定答题页面与数字键盘事件
 */
function bindQuizInputEvents() {
  const choices = document.querySelectorAll(".choice-btn");
  choices.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-val");
      if (window.game) window.game.submitAnswer(val);
    });
  });

  const keys = document.querySelectorAll(".key-btn");
  keys.forEach(keyBtn => {
    keyBtn.addEventListener("click", () => {
      const key = keyBtn.getAttribute("data-key");
      if (window.audioManager) window.audioManager.playClick();
      if (window.uiManager) window.uiManager.appendKeyInput(key);
    });
  });

  const fuelKeys = document.querySelectorAll(".fuel-key");
  fuelKeys.forEach(btn => {
    btn.addEventListener("click", () => {
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
    // 1. 如果有弹窗显示，优先拦截 Enter 和 Escape 键处理弹窗快速关闭/继续
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
        document.getElementById("btn-go-fuel")?.click();
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

    // 2. 正常答题与燃料模式按键
    if (window.game && (window.game.currentState === GAME_STATES.QUESTION || window.game.currentState === GAME_STATES.FUEL_CHALLENGE)) {
      if (e.key >= "0" && e.key <= "9") {
        if (window.uiManager) window.uiManager.appendKeyInput(e.key);
      } else if (e.key === "Backspace") {
        if (window.uiManager) window.uiManager.appendKeyInput("backspace");
      } else if (e.key === "Enter") {
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

/**
 * 绑定 3D 组装车间交互
 */
function bindAssemblyEvents() {
  document.getElementById("btn-install-all")?.addEventListener("click", () => {
    if (!window.storageManager || !window.rocketBuilder) return;
    const unlocked = window.storageManager.get("unlockedParts") || [];
    unlocked.forEach(partId => window.storageManager.installPart(partId));
    
    window.rocketBuilder.updateInstalledParts(unlocked);
    if (window.audioManager) window.audioManager.playSnap();

    if (unlocked.length >= 10) {
      document.getElementById("modal-rocket-complete")?.classList.remove("hidden");
    }
  });

  document.getElementById("select-rocket-model")?.addEventListener("change", (e) => {
    const model = e.target.value;
    if (window.rocketBuilder) window.rocketBuilder.setModel(model);
  });

  document.getElementById("select-rocket-theme")?.addEventListener("change", (e) => {
    const theme = e.target.value;
    if (window.rocketBuilder) window.rocketBuilder.setTheme(theme);
  });

  document.getElementById("btn-complete-assembly")?.addEventListener("click", () => {
    document.getElementById("modal-rocket-complete")?.classList.add("hidden");
    if (window.game) window.game.setGameState(GAME_STATES.ASSEMBLY);
  });

  // 燃料挑战入口按钮
  document.getElementById("btn-go-fuel")?.addEventListener("click", () => {
    document.getElementById("modal-rocket-complete")?.classList.add("hidden");
    if (window.game) {
      window.game.fuelPercentage = 0;
      if (window.uiManager) window.uiManager.updateFuelGauge(0);
      window.game.setGameState(GAME_STATES.FUEL_CHALLENGE);
    }
  });
}

/**
 * 绑定 3D 发射序列与太空场景
 */
function bindLaunchEvents() {
  document.getElementById("btn-ready-to-launch")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.LAUNCH_READY);

    if (window.launchSequence) {
      window.launchSequence.startLaunchSequence(() => {
        console.log("发射完成，火箭已进入轨道太空！");
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
}

/**
 * 绑定结算界面与家长报告按键
 */
function bindResultsAndReportEvents() {
  // 重新开始建造新火箭 (再玩一次)
  document.getElementById("btn-restart-game")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.startNewGameRound();
  });

  // 重练错题
  document.getElementById("btn-retry-wrongs")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.startNewGameRound();
  });

  // 返回主菜单
  document.getElementById("btn-results-home")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    if (window.game) window.game.setGameState(GAME_STATES.HOME);
  });

  // 家长报告 modal: 针对性练习错题
  document.getElementById("btn-practice-wrongs-mode")?.addEventListener("click", () => {
    if (window.audioManager) window.audioManager.playClick();
    document.getElementById("modal-report")?.classList.add("hidden");
    if (window.game) window.game.startNewGameRound();
  });

  // 家长报告 modal: 清空所有数据
  document.getElementById("btn-clear-data")?.addEventListener("click", () => {
    if (confirm("确定要清空所有学习记录和已解锁勋章吗？此操作无法撤销。")) {
      if (window.storageManager) window.storageManager.clearAll();
      alert("学习记录已成功重置！");
      document.getElementById("modal-report")?.classList.add("hidden");
      if (window.game) window.game.setGameState(GAME_STATES.HOME);
    }
  });
}

/**
 * 打开家长报告弹窗
 */
function openParentReportModal() {
  if (!window.mathEngine || !window.storageManager) return;
  const report = window.mathEngine.getTableMasteryReport();
  const wrongQuestions = window.storageManager.get("wrongQuestions") || [];
  
  if (window.uiManager) {
    window.uiManager.renderParentReport(report, wrongQuestions);
  }

  document.getElementById("modal-report")?.classList.remove("hidden");
}

/**
 * 展示结算成绩单
 */
function showResultsScreen() {
  if (!window.game) return;

  const score = window.game.score;
  const total = window.game.totalQuestionsCount;
  const correct = window.game.correctAnswersCount;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

  document.getElementById("res-score").innerText = score;
  document.getElementById("res-accuracy").innerText = `${accuracy}%`;
  document.getElementById("res-max-combo").innerText = `${window.game.maxCombo} 连胜`;

  const star1 = document.getElementById("star-1");
  const star2 = document.getElementById("star-2");
  const star3 = document.getElementById("star-3");

  if (star1) star1.classList.add("active");
  if (accuracy >= 70 && star2) star2.classList.add("active");
  if (accuracy >= 90 && star3) star3.classList.add("active");

  if (window.game) window.game.setGameState(GAME_STATES.RESULTS);
}

/**
 * 用户首次交互时激活 AudioContext
 */
function bindAudioInitListener() {
  const handler = () => {
    if (window.audioManager) {
      window.audioManager.init();
    }
    const banner = document.getElementById("modal-audio-init");
    if (banner) banner.remove();
    window.removeEventListener("click", handler);
  };
  window.addEventListener("click", handler);
}
