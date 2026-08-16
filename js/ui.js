/**
 * 乘法火箭实验室 - UI DOM 渲染与响应式交互管理器 (ui.js)
 */
class UIManager {
  constructor() {
    this.currentAnswerInput = "";
    this.onAnswerSubmitCallback = null;
  }

  /**
   * 切换当前激活的游戏视图屏幕
   */
  showScreen(screenId) {
    // Map state names to actual DOM section IDs (e.g. fuelChallenge -> fuel, launchReady/space -> launch)
    let targetId = screenId;
    if (screenId === "fuelChallenge") targetId = "fuel";
    if (["launchReady", "countdown", "launching", "space"].includes(screenId)) targetId = "launch";

    const screens = document.querySelectorAll(".screen");
    screens.forEach(s => {
      s.classList.add("hidden");
      s.classList.remove("active");
    });

    const targetScreen = document.getElementById(`screen-${targetId}`);
    if (targetScreen) {
      targetScreen.classList.remove("hidden");
      targetScreen.classList.add("active");
    }

    // 更新 Header 控制栏显示状态
    const header = document.getElementById("global-header");
    if (header) {
      if (screenId === "home" || screenId === "launchReady" || screenId === "countdown" || screenId === "launching" || screenId === "space") {
        header.classList.add("hidden");
      } else {
        header.classList.remove("hidden");
      }
    }
  }

  /**
   * 渲染蓝图页面 10 大零件状态卡片
   */
  renderBlueprintGrid(definitions, unlockedParts, installedParts, onInstallClick) {
    const grid = document.getElementById("blueprint-grid");
    if (!grid) return;
    grid.innerHTML = "";

    definitions.forEach(part => {
      const isUnlocked = unlockedParts.includes(part.id);
      const isInstalled = installedParts.includes(part.id);

      const card = document.createElement("div");
      let statusClass = "locked";
      let statusLabel = "🔒 未解锁";

      if (isInstalled) {
        statusClass = "installed";
        statusLabel = "✅ 已安装";
      } else if (isUnlocked) {
        statusClass = "unlocked";
        statusLabel = "🔧 可安装";
      }

      card.className = `part-card ${statusClass}`;
      card.innerHTML = `
        <div class="part-icon">${part.icon}</div>
        <div class="part-name">${part.name}</div>
        <span class="part-status-badge">${statusLabel}</span>
      `;

      if (isUnlocked && !isInstalled) {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => onInstallClick(part.id));
      }

      grid.appendChild(card);
    });

    // 更新进度条
    const progressFill = document.getElementById("blueprint-progress-fill");
    const progressText = document.getElementById("blueprint-progress-text");
    const installedCount = installedParts.length;

    if (progressFill) progressFill.style.width = `${(installedCount / 10) * 100}%`;
    if (progressText) progressText.innerText = `${installedCount} / 10 零件`;
  }

  /**
   * 渲染组装车间底部待安装零件箱
   */
  renderAssemblyDock(definitions, unlockedParts, installedParts, onInstallClick) {
    const dockList = document.getElementById("assembly-parts-list");
    if (!dockList) return;
    dockList.innerHTML = "";

    const uninstalled = definitions.filter(p => unlockedParts.includes(p.id) && !installedParts.includes(p.id));

    if (uninstalled.length === 0) {
      dockList.innerHTML = `<div style="color: #34d399; font-weight: 800; font-size: 0.95rem; padding: 0.5rem 0;">🎉 所有已解锁零件已安装完毕！可以准备加注燃料并发射火箭！</div>`;
      return;
    }

    uninstalled.forEach(part => {
      const item = document.createElement("div");
      item.className = "dock-item";
      item.innerHTML = `
        <span class="dock-icon">${part.icon}</span>
        <span class="dock-name">${part.name}</span>
        <span class="dock-btn">点击安装</span>
      `;
      item.addEventListener("click", () => onInstallClick(part.id));
      dockList.appendChild(item);
    });
  }

  /**
   * 渲染答题页面输入面板与题目
   */
  renderQuestion(question, mode = "normal") {
    this.currentAnswerInput = "";
    this.updateAnswerDisplay("?");

    const factorA = document.getElementById("factor-a");
    const factorB = document.getElementById("factor-b");
    if (factorA) factorA.innerText = question.factorA;
    if (factorB) factorB.innerText = question.factorB;

    const fuelFactorA = document.getElementById("fuel-factor-a");
    const fuelFactorB = document.getElementById("fuel-factor-b");
    if (fuelFactorA) fuelFactorA.innerText = question.factorA;
    if (fuelFactorB) fuelFactorB.innerText = question.factorB;

    // 清除上一次的反馈提示
    const feedback = document.getElementById("quiz-feedback");
    if (feedback) {
      feedback.className = "quiz-feedback hidden";
      feedback.innerText = "";
    }
    const fuelFeedback = document.getElementById("fuel-feedback");
    if (fuelFeedback) {
      fuelFeedback.className = "quiz-feedback hidden";
      fuelFeedback.innerText = "";
    }

    const choicesContainer = document.getElementById("quiz-choices-container");
    const keypadContainer = document.getElementById("quiz-keypad-container");

    if (mode === "easy") {
      // 简单模式：多选按钮
      if (choicesContainer) choicesContainer.classList.remove("hidden");
      if (keypadContainer) keypadContainer.classList.add("hidden");

      const buttons = choicesContainer.querySelectorAll(".choice-btn");
      question.options.forEach((optVal, idx) => {
        if (buttons[idx]) {
          buttons[idx].innerText = optVal;
          buttons[idx].setAttribute("data-val", optVal);
          buttons[idx].disabled = false;
        }
      });
    } else {
      // 普通/挑战模式：数字键盘输入
      if (choicesContainer) choicesContainer.classList.add("hidden");
      if (keypadContainer) keypadContainer.classList.remove("hidden");
    }
  }

  /**
   * 更新答案框占位符文字
   */
  updateAnswerDisplay(val) {
    const box = document.getElementById("answer-box");
    if (box) box.innerText = val;
    const fuelBox = document.getElementById("fuel-answer-box");
    if (fuelBox) fuelBox.innerText = val;
  }

  /**
   * 追加数字键盘按键值
   */
  appendKeyInput(key) {
    if (key === "clear") {
      this.currentAnswerInput = "";
    } else if (key === "backspace") {
      this.currentAnswerInput = this.currentAnswerInput.slice(0, -1);
    } else if (/^\d$/.test(key)) {
      if (this.currentAnswerInput.length < 4) {
        this.currentAnswerInput += key;
      }
    }
    this.updateAnswerDisplay(this.currentAnswerInput || "?");
  }

  /**
   * 显示正向答对或温和答错反馈
   */
  showFeedback(isCorrect, msg) {
    const feedback = document.getElementById("quiz-feedback");
    if (!feedback) return;

    feedback.classList.remove("hidden", "success", "error", "animate-shake");
    if (isCorrect) {
      feedback.classList.add("success");
    } else {
      feedback.classList.add("error", "animate-shake");
    }
    feedback.innerText = msg;
  }

  /**
   * 显示燃料舱正向答对或答错反馈
   */
  showFuelFeedback(isCorrect, msg) {
    const feedback = document.getElementById("fuel-feedback");
    if (!feedback) return;

    feedback.classList.remove("hidden", "success", "error", "animate-shake");
    if (isCorrect) {
      feedback.classList.add("success");
    } else {
      feedback.classList.add("error", "animate-shake");
    }
    feedback.innerText = msg;
  }

  /**
   * 渲染阵列点图可视化辅助 (燃料电池/星星)
   */
  renderVisualHelper(visualData) {
    const card = document.getElementById("visual-math-card");
    const dotsGrid = document.getElementById("visual-dots-grid");
    const formulaText = document.getElementById("visual-math-formula");

    if (!card || !dotsGrid) return;
    card.classList.remove("hidden");
    dotsGrid.innerHTML = "";

    for (let r = 0; r < visualData.rows; r++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "dots-row";
      for (let c = 0; c < visualData.cols; c++) {
        const span = document.createElement("span");
        span.className = "dot-icon";
        span.innerText = visualData.icon;
        rowDiv.appendChild(span);
      }
      dotsGrid.appendChild(rowDiv);
    }

    if (formulaText) formulaText.innerText = visualData.additionFormula;
  }

  /**
   * 更新燃料柱 percentage (0% - 100%)
   */
  updateFuelGauge(percent) {
    const fill = document.getElementById("fuel-fill-level");
    const label = document.getElementById("fuel-percentage");
    const statusLabel = document.getElementById("fuel-status-label");
    const btnLaunch = document.getElementById("btn-ready-to-launch");

    const clamped = Math.min(100, Math.max(0, percent));
    if (fill) fill.style.height = `${clamped}%`;
    if (label) label.innerText = `${clamped}%`;

    if (clamped >= 100) {
      if (statusLabel) statusLabel.innerText = "🚀 燃料已加满，准备发射！";
      if (btnLaunch) {
        btnLaunch.disabled = false;
        btnLaunch.classList.remove("disabled");
        btnLaunch.classList.add("btn-pulse");
      }
    } else {
      if (statusLabel) statusLabel.innerText = "燃料不足，等待加注...";
      if (btnLaunch) {
        btnLaunch.disabled = true;
        btnLaunch.classList.add("disabled");
        btnLaunch.classList.remove("btn-pulse");
      }
    }
  }

  /**
   * 渲染家长报告中的掌握度柱状图
   */
  renderParentReport(statsReport, wrongQuestions) {
    const container = document.getElementById("mastery-bars-container");
    if (!container) return;
    container.innerHTML = "";

    statsReport.forEach(item => {
      const row = document.createElement("div");
      row.className = "mastery-bar-row";
      row.innerHTML = `
        <span class="tbl-name">${item.name}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${item.percentage}%;"></div>
        </div>
        <span style="width: 45px; text-align: right; font-weight:800; font-size:0.85rem;">${item.percentage}%</span>
      `;
      container.appendChild(row);
    });

    // 渲染错题标签
    const wrongsList = document.getElementById("wrong-questions-tags");
    if (wrongsList) {
      wrongsList.innerHTML = "";
      if (!wrongQuestions || wrongQuestions.length === 0) {
        wrongsList.innerHTML = `<span class="empty-hint">暂无常见错题，表现非常棒！</span>`;
      } else {
        wrongQuestions.forEach(q => {
          const tag = document.createElement("span");
          tag.className = "badge-item";
          tag.style.borderColor = "#ef4444";
          tag.innerText = `${q.factorA} × ${q.factorB} = ${q.answer}`;
          wrongsList.appendChild(tag);
        });
      }
    }
  }
}

// 导出单例对象
window.uiManager = new UIManager();
