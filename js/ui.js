/**
 * Multiplication Rocket Lab - UI & DOM Rendering Manager (js/ui.js)
 * Supports Version 3.0.0 Universal Math Formulas, Division Visual Helpers, Destination Mission Planner & Parent Dashboard
 */
class UIManager {
  constructor() {
    this.currentAnswerInput = "";
    this.selectedHeatmapOperation = "multiply";
  }

  showScreen(screenId) {
    const aliasMap = {
      fuelChallenge: "fuel",
      launchReady: "launch",
      countdown: "launch",
      launching: "launch",
      space: "launch"
    };

    const targetId = aliasMap[screenId] || screenId;
    const screens = document.querySelectorAll(".screen");
    screens.forEach(s => s.classList.add("hidden"));

    const active = document.getElementById(`screen-${targetId}`);
    if (active) {
      active.classList.remove("hidden");
    }

    this.updateProfileHUD();
  }

  updateProfileHUD() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;

    const nameEl = document.getElementById("hud-player-name");
    if (nameEl) nameEl.innerText = profile.name;

    const presetEl = document.getElementById("hud-player-preset");
    if (presetEl) {
      const preset = CONFIG.CURRICULUM_PRESETS[profile.yearPreset];
      presetEl.innerText = window.i18n && window.i18n.currentLanguage === "zh" ? (preset ? preset.nameZh : "Year 2") : (preset ? preset.nameEn : "Year 2");
    }
  }

  renderQuestion(question, mode = "normal") {
    this.currentAnswerInput = "";
    this.updateAnswerDisplay("?");

    // Formula Display
    const formulaContainer = document.getElementById("formula-display-box");
    if (formulaContainer) {
      const isDiv = question.operation === "divide";
      const symbol = isDiv ? "÷" : "×";
      formulaContainer.innerHTML = `
        <span id="factor-a" class="factor">${question.operandA}</span>
        <span class="operator">${symbol}</span>
        <span id="factor-b" class="factor">${question.operandB}</span>
        <span class="operator">=</span>
        <span id="answer-box" class="answer-box-placeholder">?</span>
      `;
    }

    const fuelFactorA = document.getElementById("fuel-factor-a");
    const fuelFactorB = document.getElementById("fuel-factor-b");
    if (fuelFactorA) fuelFactorA.innerText = question.operandA;
    if (fuelFactorB) fuelFactorB.innerText = question.operandB;

    const feedback = document.getElementById("quiz-feedback");
    if (feedback) { feedback.className = "quiz-feedback hidden"; feedback.innerText = ""; }
    const fuelFeedback = document.getElementById("fuel-feedback");
    if (fuelFeedback) { fuelFeedback.className = "quiz-feedback hidden"; fuelFeedback.innerText = ""; }

    const choicesContainer = document.getElementById("quiz-choices-container");
    const keypadContainer = document.getElementById("quiz-keypad-container");
    const easyHelper = document.getElementById("easy-visual-helper");

    if (mode === "easy") {
      if (choicesContainer) choicesContainer.classList.remove("hidden");
      if (keypadContainer) keypadContainer.classList.add("hidden");
      if (easyHelper) {
        easyHelper.classList.remove("hidden");
        const helperData = window.mathEngine.getVisualArrayData(question);
        this.renderVisualHelper(helperData);
      }

      const buttons = choicesContainer.querySelectorAll(".choice-btn");
      question.options.forEach((optVal, idx) => {
        if (buttons[idx]) {
          buttons[idx].innerText = optVal;
          buttons[idx].setAttribute("data-val", optVal);
          buttons[idx].disabled = false;
        }
      });
    } else {
      if (choicesContainer) choicesContainer.classList.add("hidden");
      if (keypadContainer) keypadContainer.classList.remove("hidden");
      if (easyHelper) easyHelper.classList.add("hidden");
    }

    // Render Smart Strategy Hint
    const hintBox = document.getElementById("strat-hint-box");
    if (hintBox && question.hint) {
      hintBox.classList.remove("hidden");
      const isZh = window.i18n && window.i18n.currentLanguage === "zh";
      hintBox.innerText = isZh ? question.hint.textZh : question.hint.textEn;
    }
  }

  updateAnswerDisplay(val) {
    const box = document.getElementById("answer-box");
    if (box) box.innerText = val;
    const fuelBox = document.getElementById("fuel-answer-box");
    if (fuelBox) fuelBox.innerText = val;
  }

  appendKeyInput(key) {
    if (key === "clear") {
      this.currentAnswerInput = "";
    } else if (key === "backspace") {
      this.currentAnswerInput = this.currentAnswerInput.slice(0, -1);
    } else if (/^\d$/.test(key)) {
      if (this.currentAnswerInput.length < 5) {
        this.currentAnswerInput += key;
      }
    }
    this.updateAnswerDisplay(this.currentAnswerInput || "?");
  }

  showFeedback(isCorrect, msg) {
    const feedback = document.getElementById("quiz-feedback");
    if (!feedback) return;

    feedback.classList.remove("hidden", "success", "error", "animate-shake");
    if (isCorrect) feedback.classList.add("success");
    else feedback.classList.add("error", "animate-shake");
    feedback.innerText = msg;
  }

  showFuelFeedback(isCorrect, msg) {
    const feedback = document.getElementById("fuel-feedback");
    if (!feedback) return;

    feedback.classList.remove("hidden", "success", "error", "animate-shake");
    if (isCorrect) feedback.classList.add("success");
    else feedback.classList.add("error", "animate-shake");
    feedback.innerText = msg;
  }

  renderVisualHelper(visualData) {
    const container = document.getElementById("easy-visual-helper");
    if (!container) return;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    if (visualData.type === "divide") {
      let dotsHtml = "";
      const groupCount = Math.min(visualData.groups, 10);
      const perGroup = Math.min(visualData.perGroup, 10);

      for (let g = 0; g < groupCount; g++) {
        dotsHtml += `<div class="array-row group-border">`;
        for (let i = 0; i < perGroup; i++) {
          dotsHtml += `<span class="array-dot">⭐</span>`;
        }
        dotsHtml += `</div>`;
      }

      container.innerHTML = `
        <div class="visual-array-grid">${dotsHtml}</div>
        <div class="addition-formula">${isZh ? `将 ${visualData.total} 个星光平均分成 ${visualData.groups} 组` : `Sharing ${visualData.total} items into ${visualData.groups} groups`}</div>
      `;
    } else {
      let dotsHtml = "";
      for (let r = 0; r < Math.min(visualData.rows, 12); r++) {
        dotsHtml += `<div class="array-row">`;
        for (let c = 0; c < Math.min(visualData.cols, 12); c++) {
          dotsHtml += `<span class="array-dot">🚀</span>`;
        }
        dotsHtml += `</div>`;
      }

      container.innerHTML = `
        <div class="visual-array-grid">${dotsHtml}</div>
        <div class="addition-formula">${visualData.additionFormula}</div>
      `;
    }
  }

  updateQuizHUD(currentNum, totalNum, combo, score) {
    const curEl = document.getElementById("quiz-current-num");
    const totEl = document.getElementById("quiz-total-num");
    const comboEl = document.getElementById("quiz-combo-count");
    const scoreEl = document.getElementById("display-score");

    if (curEl) curEl.innerText = currentNum;
    if (totEl) totEl.innerText = totalNum;
    if (comboEl) comboEl.innerText = `🔥 ${combo}`;
    if (scoreEl) scoreEl.innerText = score;
  }

  showQuizTimer(maxSeconds) {
    const box = document.getElementById("quiz-timer-container");
    if (box) box.classList.remove("hidden");
  }

  hideQuizTimer() {
    const box = document.getElementById("quiz-timer-container");
    if (box) box.classList.add("hidden");
  }

  updateQuizTimerDisplay(secLeft, ratio) {
    const valEl = document.getElementById("quiz-timer-val");
    if (valEl) valEl.innerText = `${secLeft}s`;

    const fill = document.getElementById("quiz-timer-fill");
    if (fill) fill.style.width = `${Math.max(0, ratio * 100)}%`;
  }

  updateBlueprintView() {
    const unlocked = window.storageManager ? (window.storageManager.get("unlockedParts") || []) : [];
    const countEl = document.getElementById("blueprint-progress-text");
    if (countEl) countEl.innerText = `${unlocked.length} / ${CONFIG.PART_COUNT}`;

    const fill = document.getElementById("blueprint-progress-fill");
    if (fill) fill.style.width = `${(unlocked.length / CONFIG.PART_COUNT) * 100}%`;

    const grid = document.getElementById("blueprint-grid");
    if (!grid || !window.rocketBuilder) return;

    grid.innerHTML = "";
    window.rocketBuilder.partDefinitions.forEach((part) => {
      const isUnlocked = unlocked.includes(part.id);
      const isZh = window.i18n && window.i18n.currentLanguage === "zh";
      const name = isZh ? part.nameZh : part.nameEn;

      const item = document.createElement("div");
      item.className = `blueprint-card ${isUnlocked ? "unlocked" : "locked"}`;
      item.innerHTML = `
        <div class="part-icon">${part.icon}</div>
        <div class="part-name">${name}</div>
        <div class="part-status">${isUnlocked ? "✅ Unlocked" : "🔒 Locked"}</div>
      `;
      grid.appendChild(item);
    });
  }

  showPartRewardModal(part) {
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const modal = document.getElementById("modal-part-reward");
    if (!modal) return;

    const icon = modal.querySelector(".reward-icon");
    const name = modal.querySelector(".reward-name");

    if (icon) icon.innerText = part.icon;
    if (name) name.innerText = isZh ? part.nameZh : part.nameEn;

    modal.classList.remove("hidden");
  }

  renderAssemblyDock() {
    const container = document.getElementById("assembly-parts-list");
    if (!container || !window.rocketBuilder || !window.storageManager) return;

    const unlocked = window.storageManager.get("unlockedParts") || [];
    const installed = window.storageManager.get("installedParts") || [];
    container.innerHTML = "";

    window.rocketBuilder.partDefinitions.forEach(part => {
      const isUnlocked = unlocked.includes(part.id);
      const isInstalled = installed.includes(part.id);
      const isZh = window.i18n && window.i18n.currentLanguage === "zh";

      const btn = document.createElement("button");
      btn.className = `assembly-dock-item ${isInstalled ? "installed" : (isUnlocked ? "unlocked glow-pulse" : "locked")}`;
      btn.innerHTML = `
        <span class="dock-icon">${part.icon}</span>
        <span class="dock-title">${isZh ? part.nameZh : part.nameEn}</span>
        <span class="dock-tag">${isInstalled ? "✅" : (isUnlocked ? "🛠️ Snap" : "🔒")}</span>
      `;

      if (isUnlocked && !isInstalled) {
        btn.addEventListener("click", () => {
          window.storageManager.installPart(part.id);
          window.rocketBuilder.animateInstallPart(part.id, () => {
            this.renderAssemblyDock();
          });
        });
      }
      container.appendChild(btn);
    });
  }

  updateFuelGauge(percentage) {
    const fill = document.getElementById("fuel-fill-level");
    const text = document.getElementById("fuel-percentage");
    const label = document.getElementById("fuel-status-label");
    const launchBtn = document.getElementById("btn-ready-to-launch");

    if (fill) fill.style.height = `${percentage}%`;
    if (text) text.innerText = `${percentage}%`;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    if (label) {
      if (percentage >= 100) label.innerText = isZh ? "燃料 100% 加满！可以发射！" : "Fuel 100% Full! Ready to Launch!";
      else if (percentage >= 50) label.innerText = isZh ? "燃料加注中..." : "Fuel loading in progress...";
      else label.innerText = isZh ? "燃料不足，等待加注..." : "Fuel low. Waiting for fuel loading...";
    }

    if (launchBtn) {
      if (percentage >= 100) {
        launchBtn.disabled = false;
        launchBtn.classList.remove("disabled");
        launchBtn.classList.add("btn-pulse");
      } else {
        launchBtn.disabled = true;
        launchBtn.classList.add("disabled");
        launchBtn.classList.remove("btn-pulse");
      }
    }
  }

  renderParentReport() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;

    // Today Stats
    document.getElementById("rep-today-answered").innerText = profile.totalQuestionsAnswered || 0;
    const acc = profile.totalQuestionsAnswered > 0 ? Math.round((profile.totalCorrectAnswers / profile.totalQuestionsAnswered) * 100) : 100;
    document.getElementById("rep-today-accuracy").innerText = `${acc}%`;
    document.getElementById("rep-today-speed").innerText = `${profile.averageResponseTime ? (profile.averageResponseTime / 1000).toFixed(1) : 3.5}s`;
    document.getElementById("rep-today-streak").innerText = `🔥 ${profile.maxComboAllTime || 0}`;

    // Lifetime Stats
    document.getElementById("rep-total-answered").innerText = profile.totalQuestionsAnswered || 0;
    document.getElementById("rep-total-launches").innerText = profile.gamesCompleted || 0;

    // Operation Mastery Summary (Multiplication vs Division)
    if (window.mathEngine) {
      const summary = window.mathEngine.getOperationMasterySummary();
      const mulEl = document.getElementById("rep-mult-mastery");
      const divEl = document.getElementById("rep-div-mastery");
      if (mulEl) mulEl.innerText = `${summary.multiplication}%`;
      if (divEl) divEl.innerText = `${summary.division}%`;
    }

    this.renderHeatmapMatrix(profile, this.selectedHeatmapOperation);
    this.renderSpacePassportStamps(profile);
  }

  renderHeatmapMatrix(profile, operation = "multiply") {
    const container = document.getElementById("mastery-heatmap-container");
    if (!container) return;

    const isDiv = operation === "divide";
    let html = `<div class="heatmap-grid">`;
    html += `<div class="hm-cell header">${isDiv ? "÷" : "×"}</div>`;
    for (let c = 1; c <= 12; c++) html += `<div class="hm-cell header">${c}</div>`;

    for (let r = 1; r <= 12; r++) {
      html += `<div class="hm-cell header">${r}</div>`;
      for (let c = 1; c <= 12; c++) {
        const prod = r * c;
        const key = isDiv ? `div:${prod}/${r}` : `mul:${r}x${c}`;
        const fact = profile.facts[key] || { masteryScore: 0 };
        const score = fact.masteryScore || 0;

        let bg = "#1e293b";
        if (score >= 90) bg = "#059669";
        else if (score >= 70) bg = "#2563eb";
        else if (score >= 40) bg = "#d97706";
        else if (score > 0) bg = "#dc2626";

        html += `<div class="hm-cell fact-cell" style="background-color: ${bg}" data-fact="${key}" title="${isDiv ? `${prod}÷${r}=${c}` : `${r}×${c}=${prod}`} (Mastery: ${score}%)">${score > 0 ? score : ""}</div>`;
      }
    }
    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll(".fact-cell").forEach(cell => {
      cell.addEventListener("click", () => {
        const key = cell.getAttribute("data-fact");
        const fact = profile.facts[key];
        if (fact) this.showFactInspectorModal(fact);
      });
    });
  }

  renderSpacePassportStamps(profile) {
    const container = document.getElementById("space-passport-stamps-grid");
    if (!container) return;

    const visited = profile.destinationsVisited || { earthOrbit: true };
    container.innerHTML = "";

    Object.values(CONFIG.DESTINATIONS).forEach(dest => {
      const isStamped = !!visited[dest.id];
      const stamp = document.createElement("div");
      stamp.className = `passport-stamp ${isStamped ? "stamped" : "unvisited"}`;
      stamp.innerHTML = `
        <div class="stamp-icon">${dest.icon}</div>
        <div class="stamp-name">${dest.nameEn}</div>
        <div class="stamp-status">${isStamped ? "✓ VISITED" : "🔒 UNVISITED"}</div>
      `;
      container.appendChild(stamp);
    });
  }

  showFactInspectorModal(fact) {
    const modal = document.getElementById("modal-fact-inspector");
    if (!modal) return;

    const displayStr = fact.operation === "divide" ? `${fact.operandA} ÷ ${fact.operandB} = ${fact.answer}` : `${fact.operandA} × ${fact.operandB} = ${fact.answer}`;
    document.getElementById("fact-title").innerText = displayStr;
    document.getElementById("fact-mastery-score").innerText = `${fact.masteryScore}%`;
    document.getElementById("fact-attempts").innerText = fact.attempts;
    document.getElementById("fact-first-try").innerText = fact.firstTryCorrect;
    document.getElementById("fact-wrong-count").innerText = fact.wrongCount;
    document.getElementById("fact-avg-speed").innerText = `${fact.averageResponseTime ? (fact.averageResponseTime / 1000).toFixed(1) : "0"}s`;

    modal.classList.remove("hidden");
  }
}

window.uiManager = new UIManager();
