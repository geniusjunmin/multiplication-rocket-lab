/**
 * Multiplication Rocket Lab - UI & DOM Rendering Manager (js/ui.js)
 * Version 3.0.0 Universal Math Formulas, Prominent Wrong-Answer Hints, Pre-Launch 3D Assembly Dashboard & Extended Cinematic Journey
 */
class UIManager {
  constructor() {
    this.currentAnswerInput = "";
    this.selectedHeatmapOperation = "multiply";
    this.installingParts = new Set();
  }

  showScreen(screenId) {
    const aliasMap = {
      fuelChallenge: "fuel",
      launchReady: "launch",
      countdown: "launch",
      launching: "launch",
      space: "launch",
      missionComplete: "launch"
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
    const isDiv = question.operation === "divide";
    const symbol = isDiv ? "÷" : "×";

    if (formulaContainer) {
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
    const fuelOperator = document.getElementById("fuel-operator");

    if (fuelFactorA) fuelFactorA.innerText = question.operandA;
    if (fuelFactorB) fuelFactorB.innerText = question.operandB;
    if (fuelOperator) fuelOperator.innerText = symbol;

    const feedback = document.getElementById("quiz-feedback");
    if (feedback) { feedback.className = "quiz-feedback hidden"; feedback.innerText = ""; }
    const fuelFeedback = document.getElementById("fuel-feedback");
    if (fuelFeedback) { fuelFeedback.className = "quiz-feedback hidden"; fuelFeedback.innerText = ""; }

    // HIDE Strategy Hint initially (Only show after wrong answer!)
    const hintBox = document.getElementById("strat-hint-box");
    if (hintBox) {
      hintBox.classList.add("hidden");
      hintBox.innerText = "";
    }

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
  }

  showWrongAnswerHint(question) {
    const hintBox = document.getElementById("strat-hint-box");
    if (!hintBox || !question || !question.hint) return;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const hintText = isZh ? question.hint.textZh : question.hint.textEn;

    hintBox.className = "strat-hint-box prominent-wrong-hint animate-bounce-short";
    hintBox.classList.remove("hidden");

    hintBox.innerHTML = `
      <div class="hint-title-badge">💡 ${isZh ? "答错小提示 (别灰心，再试一次！)" : "Smart Strategy Hint (Try Again!)"}</div>
      <div class="hint-text-body">${hintText}</div>
    `;
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
      item.className = `blueprint-card-item ${isUnlocked ? "unlocked" : "locked"}`;
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

    const totalCount = CONFIG.PART_COUNT;
    const installedCount = installed.length;
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    // 1. Sync Model & Theme Selects with Active Profile and Unlock State
    const currentModel = window.storageManager.get("currentRocketModel") || "classic";
    const currentTheme = window.storageManager.get("currentRocketTheme") || "explorer";
    const activeProfile = window.profileManager ? window.profileManager.getActiveProfile() : null;

    const modelSelect = document.getElementById("select-rocket-model");
    if (modelSelect) {
      const unlockedModels = activeProfile ? (activeProfile.unlockedRocketModels || ["classic"]) : ["classic"];
      Array.from(modelSelect.options).forEach(opt => {
        const isOptUnlocked = unlockedModels.includes(opt.value);
        opt.disabled = !isOptUnlocked;
        opt.text = (isOptUnlocked ? "" : "🔒 ") + opt.text.replace(/^🔒\s*/, '');
      });
      modelSelect.value = currentModel;
    }

    const themeSelect = document.getElementById("select-rocket-theme");
    if (themeSelect) {
      const unlockedThemes = activeProfile ? (activeProfile.unlockedRocketThemes || ["explorer"]) : ["explorer"];
      Array.from(themeSelect.options).forEach(opt => {
        const isOptUnlocked = unlockedThemes.includes(opt.value);
        opt.disabled = !isOptUnlocked;
        opt.text = (isOptUnlocked ? "" : "🔒 ") + opt.text.replace(/^🔒\s*/, '');
      });
      themeSelect.value = currentTheme;
    }

    // 2. Update Left Dashboard Stats Dynamically
    const ratio = installedCount / totalCount;
    const thrust = Math.round(ratio * 95);
    const stability = Math.round(ratio * 92);
    const payload = Math.round(ratio * 90);
    const efficiency = Math.round(ratio * 88);

    const thrustVal = document.getElementById("stat-thrust-val");
    if (thrustVal) thrustVal.innerText = `${thrust}%`;
    const barThrust = document.getElementById("stat-bar-thrust");
    if (barThrust) barThrust.style.width = `${thrust}%`;

    const stabVal = document.getElementById("stat-stability-val");
    if (stabVal) stabVal.innerText = `${stability}%`;
    const barStab = document.getElementById("stat-bar-stability");
    if (barStab) barStab.style.width = `${stability}%`;

    const payVal = document.getElementById("stat-payload-val");
    if (payVal) payVal.innerText = `${payload}%`;
    const barPay = document.getElementById("stat-bar-payload");
    if (barPay) barPay.style.width = `${payload}%`;

    const effVal = document.getElementById("stat-efficiency-val");
    if (effVal) effVal.innerText = `${efficiency}%`;
    const barEff = document.getElementById("stat-bar-efficiency");
    if (barEff) barEff.style.width = `${efficiency}%`;

    // 3. Update Progress Circular Ring
    const percent = Math.round(ratio * 100);
    const pctText = document.getElementById("assembly-percent-text");
    if (pctText) pctText.innerText = `${percent}%`;
    const ringCircle = document.getElementById("assembly-ring-circle");
    if (ringCircle) {
      const circumference = 251.2;
      const offset = circumference * (1 - ratio);
      ringCircle.style.strokeDashoffset = `${offset}`;
    }

    const subtextEl = document.getElementById("assembly-status-subtext");
    if (subtextEl) {
      if (installedCount >= totalCount) {
        subtextEl.innerText = isZh ? "已解锁零件全部安装完成！" : "All unlocked parts assembled!";
        subtextEl.style.color = "#34d399";
      } else {
        subtextEl.innerText = isZh ? `零件卡扣组装中 (${installedCount}/${totalCount})` : `Assembling Parts (${installedCount}/${totalCount})`;
        subtextEl.style.color = "#f59e0b";
      }
    }

    // 4. Render 10 Part Cards Grid
    window.rocketBuilder.partDefinitions.forEach(part => {
      const isUnlocked = unlocked.includes(part.id);
      const isInstalled = installed.includes(part.id);
      const isCurrentlyInstalling = this.installingParts.has(part.id);

      let statusText = "LOCKED";
      if (isInstalled) statusText = "✓ FITTED";
      else if (isCurrentlyInstalling) statusText = "INSTALLING...";
      else if (isUnlocked) statusText = "READY";

      const btn = document.createElement("button");
      btn.className = `assembly-dock-item ${isInstalled ? "installed" : (isCurrentlyInstalling ? "installing" : (isUnlocked ? "unlocked glow-pulse" : "locked"))}`;
      btn.innerHTML = `
        ${isInstalled ? '<span class="part-badge-fitted">✓</span>' : ''}
        <span class="dock-icon">${part.icon}</span>
        <span class="dock-title">${isZh ? part.nameZh : part.nameEn}</span>
        <span class="dock-status-label">${statusText}</span>
      `;

      if (isUnlocked && !isInstalled && !isCurrentlyInstalling) {
        btn.addEventListener("click", () => {
          if (this.installingParts.has(part.id)) return;
          this.installingParts.add(part.id);
          this.renderAssemblyDock();

          // Animate first, write to storage ONLY after animation successfully completes!
          window.rocketBuilder.animateInstallPart(part.id, () => {
            window.storageManager.installPart(part.id);
            this.installingParts.delete(part.id);
            this.renderAssemblyDock();

            const newlyInstalled = window.storageManager.get("installedParts") || [];
            if (newlyInstalled.length >= totalCount) {
              this.triggerAssemblyCelebration();
            }
          });
        });
      } else {
        btn.disabled = true;
      }
      container.appendChild(btn);
    });

    // 5. Update Launch Gateway Button
    const goFuelBtn = document.getElementById("btn-go-fuel");
    const lockTipEl = document.getElementById("assembly-lock-tip");

    if (goFuelBtn) {
      if (installedCount >= totalCount) {
        goFuelBtn.disabled = false;
        goFuelBtn.removeAttribute("disabled");
        goFuelBtn.classList.remove("disabled");
        goFuelBtn.classList.add("unlocked", "btn-pulse");

        if (lockTipEl) {
          lockTipEl.className = "assembly-lock-tip unlocked-tip";
          lockTipEl.innerText = isZh ? "🎉 所有火箭零件组装完成！即可前往燃料舱点火升空！" : "🎉 Assembly Complete! Ready to proceed to Fuel Chamber!";
        }
      } else {
        goFuelBtn.disabled = true;
        goFuelBtn.setAttribute("disabled", "true");
        goFuelBtn.classList.add("disabled");
        goFuelBtn.classList.remove("unlocked", "btn-pulse");

        if (lockTipEl) {
          lockTipEl.className = "assembly-lock-tip";
          lockTipEl.innerText = isZh ? `🔒 需卡扣安装完成所有 10 个零件后才能发射 (已安装 ${installedCount}/${totalCount})` : `🔒 Assemble all 10 parts before launching (${installedCount}/${totalCount})`;
        }
      }
    }
  }

  /**
   * Hero 360-degree celebration when assembly is complete.
   * NOTE: Does NOT auto-navigate to Fuel screen! Let child admire rocket and click.
   */
  triggerAssemblyCelebration() {
    const banner = document.getElementById("assembly-celebration-banner");
    if (banner) banner.classList.remove("hidden");
    if (window.audioManager) window.audioManager.playVictory();

    if (window.rocketBuilder) {
      window.rocketBuilder.triggerCelebrationSpin(2000, () => {
        setTimeout(() => {
          if (banner) banner.classList.add("hidden");
        }, 800);
      });
    }
  }

  animateFuelIncrease(fromPercent, toPercent, comboBonus = 0) {
    this.spawnEnergyParticles();

    // Floating Bonus Badge
    const bonusBox = document.getElementById("fuel-floating-bonus");
    if (bonusBox) {
      const isZh = window.i18n && window.i18n.currentLanguage === "zh";
      if (comboBonus > 0) {
        bonusBox.innerText = isZh ? `🔥 连胜加成 +${comboBonus}%` : `🔥 COMBO BONUS +${comboBonus}%`;
      } else {
        bonusBox.innerText = `⛽ +10%`;
      }
      bonusBox.classList.remove("hidden");
      setTimeout(() => bonusBox.classList.add("hidden"), 900);
    }

    const duration = 600;
    const startTime = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();

    const step = () => {
      const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromPercent + (toPercent - fromPercent) * ease);

      this.updateFuelGauge(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.updateFuelGauge(toPercent);
      }
    };
    step();
  }

  spawnEnergyParticles() {
    const container = document.getElementById("screen-fuel");
    if (!container) return;

    for (let i = 0; i < 6; i++) {
      const p = document.createElement("div");
      p.className = "energy-particle";
      p.style.top = `${40 + (Math.random() - 0.5) * 10}%`;
      p.style.right = `${35 + (Math.random() - 0.5) * 10}%`;
      const tx = `${-200 - Math.random() * 80}px`;
      const ty = `${-40 + (Math.random() - 0.5) * 60}px`;
      if (p.style.setProperty) {
        p.style.setProperty("--target-x", tx);
        p.style.setProperty("--target-y", ty);
      } else {
        p.style["--target-x"] = tx;
        p.style["--target-y"] = ty;
      }
      container.appendChild(p);

      setTimeout(() => p.remove ? p.remove() : null, 650);
    }
  }

  updateFuelGauge(percentage) {
    const fill = document.getElementById("fuel-fill-level");
    const text = document.getElementById("fuel-percentage");
    const label = document.getElementById("fuel-status-label");
    const launchBtn = document.getElementById("btn-ready-to-launch");
    const alertBanner = document.getElementById("fuel-full-alert-banner");

    if (fill) fill.style.height = `${percentage}%`;
    if (text) text.innerText = `${percentage}%`;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    if (label) {
      if (percentage >= 100) {
        label.innerText = isZh ? "🎉 燃料 100% 加满！火箭发射准备就绪！" : "🎉 Fuel 100% Full! Rocket System Ready!";
      } else if (percentage >= 50) {
        label.innerText = isZh ? "燃料加注中..." : "Fuel loading in progress...";
      } else {
        label.innerText = isZh ? "燃料不足，等待加注..." : "Fuel low. Waiting for fuel loading...";
      }
    }

    if (percentage >= 100) {
      if (alertBanner) alertBanner.classList.remove("hidden");
      if (launchBtn) {
        launchBtn.disabled = false;
        launchBtn.removeAttribute("disabled");
        launchBtn.classList.remove("disabled");
        launchBtn.style.opacity = "1";
        launchBtn.style.cursor = "pointer";
      }
    } else {
      if (alertBanner) alertBanner.classList.add("hidden");
      if (launchBtn) {
        launchBtn.disabled = true;
        launchBtn.setAttribute("disabled", "true");
        launchBtn.classList.add("disabled");
      }
    }
  }

  renderParentReport() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;

    // Today Stats
    const repAns = document.getElementById("rep-today-answered");
    if (repAns) repAns.innerText = profile.totalQuestionsAnswered || 0;
    const acc = profile.totalQuestionsAnswered > 0 ? Math.round((profile.totalCorrectAnswers / profile.totalQuestionsAnswered) * 100) : 100;
    const repAcc = document.getElementById("rep-today-accuracy");
    if (repAcc) repAcc.innerText = `${acc}%`;

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
