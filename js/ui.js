/**
 * Multiplication Rocket Lab - UI & Screen Rendering Engine (js/ui.js)
 * Version 4.1.0 — Gameplay Integration & Progression Integrity
 * Coordinates Home Progression HUD, Weekly Expedition, Mission Board with Level Gates,
 * Unlock Reward Ceremony, In-Flight Event Modals, and Mission Debrief Ceremony.
 */
class UIManager {
  constructor() {
    this.currentAnswerInput = "";
    this.selectedHeatmapOperation = "multiply";
    this.installingParts = new Set();
    this.selectedBriefingMissionId = null;
    this.selectedBriefingPayload = "probe";
    this.selectedBriefingRoute = "safe";
    this.activeEventData = null;
    this.activeEventCallback = null;
    this.activeEventQuestion = null;
    this.unlockCeremonyQueue = [];
    this.debriefAnimTimer = null;
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

    // Header Stars and Level Badges
    const lvlInfo = window.progressionManager ? window.progressionManager.getLevelInfo(profile.progression ? profile.progression.xp : 0) : { level: 1 };
    const stars = profile.progression ? (profile.progression.totalStars || 0) : 0;

    const headerLevelBadge = document.getElementById("hud-level-badge");
    if (headerLevelBadge) headerLevelBadge.innerText = `Lv.${lvlInfo.level}`;

    const headerStarsBadge = document.getElementById("hud-stars-badge");
    if (headerStarsBadge) headerStarsBadge.innerText = `⭐ ${stars}`;
  }

  /**
   * Home Screen Progression Overhaul
   */
  updateHomeProgressHUD() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile || !window.progressionManager) return;

    const xp = profile.progression ? (profile.progression.xp || 0) : 0;
    const lvlInfo = window.progressionManager.getLevelInfo(xp);
    const stars = profile.progression ? (profile.progression.totalStars || 0) : 0;
    const rp = profile.progression ? (profile.progression.researchPoints || 0) : 0;
    const collectibles = profile.collectibles ? profile.collectibles.length : 0;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    // Level HUD
    const titleEl = document.getElementById("home-rank-title");
    if (titleEl) titleEl.innerText = `${lvlInfo.rankIcon} Lv.${lvlInfo.level} ${isZh ? lvlInfo.rankTitleZh : lvlInfo.rankTitleEn}`;

    const xpTextEl = document.getElementById("home-xp-text");
    if (xpTextEl) xpTextEl.innerText = `${lvlInfo.xpInLevel} / ${lvlInfo.xpNeededForLevel} XP`;

    const xpFillEl = document.getElementById("home-xp-fill");
    if (xpFillEl) xpFillEl.style.width = `${lvlInfo.progressPercent}%`;

    const starsValEl = document.getElementById("home-stars-val");
    if (starsValEl) starsValEl.innerText = stars;

    const rpValEl = document.getElementById("home-rp-val");
    if (rpValEl) rpValEl.innerText = rp;

    const museumValEl = document.getElementById("home-museum-count");
    if (museumValEl) museumValEl.innerText = `${collectibles} / 18`;

    // Render Weekly Expedition Card
    this.renderWeeklyExpedition();

    // Recommended Mission Card
    const recMission = window.progressionManager.getRecommendedMission();
    const recTitleEl = document.getElementById("rec-mission-title");
    const recStoryEl = document.getElementById("rec-mission-story");
    const recFocusEl = document.getElementById("rec-mission-focus");
    const recDestIcon = document.getElementById("rec-mission-icon");

    if (recMission && recTitleEl) {
      const destDef = CONFIG.DESTINATIONS[recMission.destination] || {};
      if (recDestIcon) recDestIcon.innerText = destDef.icon || "🚀";
      recTitleEl.innerText = isZh ? recMission.titleZh : recMission.titleEn;
      if (recStoryEl) recStoryEl.innerText = isZh ? recMission.storyZh : recMission.storyEn;
      if (recFocusEl) {
        const focusStr = recMission.mathFocus ? recMission.mathFocus.map(t => `×${t}`).join(", ") : "×7, ×8";
        recFocusEl.innerText = `${isZh ? "重点强化" : "Math Focus"}: ${focusStr}`;
      }

      const recBtn = document.getElementById("btn-start-recommended");
      if (recBtn) {
        recBtn.onclick = () => {
          this.showMissionBriefingModal(recMission.id);
        };
      }
    }

    // Daily Missions List
    const dailyMissions = window.progressionManager.getDailyMissions();
    const dailyContainer = document.getElementById("home-daily-list");
    if (dailyContainer) {
      dailyContainer.innerHTML = dailyMissions.map(m => {
        const dest = CONFIG.DESTINATIONS[m.destination] || {};
        const isDone = m.isCompleted;
        return `
          <div class="daily-item-card ${isDone ? 'completed' : ''}" data-mission="${m.id}">
            <span class="daily-icon">${dest.icon || '🚀'}</span>
            <div class="daily-info">
              <span class="daily-title">${isZh ? m.titleZh : m.titleEn}</span>
              <span class="daily-sub">${m.questionTarget} ${isZh ? '道题' : 'Questions'} • +${m.reward.xp + (isDone ? 0 : m.dailyBonusXP)} XP ${isDone ? '✓' : ''}</span>
            </div>
            <button class="btn btn-sm ${isDone ? 'btn-outline' : 'btn-primary'} btn-daily-launch" data-mission="${m.id}">
              ${isDone ? (isZh ? '已完成' : 'Done') : (isZh ? '出航' : 'Launch')}
            </button>
          </div>
        `;
      }).join("");

      dailyContainer.querySelectorAll(".btn-daily-launch").forEach(btn => {
        btn.addEventListener("click", () => {
          const mId = btn.getAttribute("data-mission");
          if (mId) {
            this.showMissionBriefingModal(mId, { isDaily: true });
          }
        });
      });
    }

    // Update Home 3D Rocket Preview info & badge
    const modelNames = {
      classic: { en: "Classic Explorer", zh: "经典探险家号" },
      starship: { en: "SpaceX Starship", zh: "星舰重型航天器" },
      falconHeavy: { en: "Falcon Heavy", zh: "重型猎鹰号" },
      longMarch: { en: "Long March 5", zh: "长征五号火箭" },
      cyber: { en: "Cyber Starship", zh: "赛博量子星舰" }
    };
    const equippedModel = (profile && profile.currentRocketModel) || "classic";
    const modelInfo = modelNames[equippedModel] || { en: equippedModel, zh: equippedModel };
    const rNameEl = document.getElementById("home-rocket-name");
    if (rNameEl) rNameEl.innerText = isZh ? modelInfo.zh : modelInfo.en;

    // 3D Rocket Preview in Home Viewport
    if (window.rocketBuilder) {
      window.rocketBuilder.initScene("canvas-container-home");
    }
  }

  /**
   * Render Weekly Solar Expedition on Home Screen
   */
  renderWeeklyExpedition() {
    if (!window.progressionManager) return;
    const state = window.progressionManager.getWeeklyExpeditionState();
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    const statusBadge = document.getElementById("weekly-exp-status");
    if (statusBadge) {
      statusBadge.innerText = isZh ? `${state.progress} / ${state.totalRequired} 星球` : `${state.progress} / ${state.totalRequired} Planets`;
    }

    const nodesContainer = document.getElementById("weekly-exp-nodes");
    if (nodesContainer) {
      const destIcons = {
        earthOrbit: "🌍",
        moon: "🌙",
        mars: "🔴",
        jupiter: "🪐",
        saturn: "🪐"
      };

      nodesContainer.innerHTML = state.route.map((destId, idx) => {
        const isDone = state.completedDestinations.includes(destId);
        const icon = destIcons[destId] || "🪐";
        const hasNext = idx < state.route.length - 1;
        return `
          <span class="node ${isDone ? 'completed' : ''}">${icon}</span>
          ${hasNext ? `<span class="line ${isDone ? 'completed' : ''}">━</span>` : ''}
        `;
      }).join("");
    }

    const claimBtn = document.getElementById("btn-claim-weekly-expedition");
    if (claimBtn) {
      if (state.isCompleted && !state.claimed) {
        claimBtn.classList.remove("hidden");
        claimBtn.onclick = () => {
          const res = window.progressionManager.claimWeeklyExpeditionReward();
          if (res.success) {
            if (window.audioManager) window.audioManager.playLevelUp();
            alert(isZh ? "🎉 恭喜完成本周太阳系远征！获得 +300 XP 与 +50 RP！" : "🎉 Congratulations on completing the Weekly Solar Expedition! +300 XP and +50 RP awarded!");
            this.updateHomeProgressHUD();
          }
        };
      } else {
        claimBtn.classList.add("hidden");
      }
    }
  }

  /**
   * Render Mission Board & Solar System Map with Progression Level Gates
   */
  renderMissionBoard(selectedDest = "moon") {
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const mapNav = document.getElementById("mission-dest-tabs");
    const gridContainer = document.getElementById("mission-cards-grid");
    if (!mapNav || !gridContainer || !window.progressionManager) return;

    // 1. Destination Navigation Tabs with Level Gates
    mapNav.innerHTML = Object.keys(CONFIG.DESTINATIONS).map(destId => {
      const dest = CONFIG.DESTINATIONS[destId];
      const prog = window.progressionManager.getPlanetProgress(destId);
      const isUnlocked = window.progressionManager.isPlanetUnlocked(destId);
      const reqLevel = (CONFIG.DESTINATION_LEVEL_REQUIREMENTS && CONFIG.DESTINATION_LEVEL_REQUIREMENTS[destId]) || 1;
      const isSelected = (destId === selectedDest);

      return `
        <button class="dest-tab-btn ${isSelected ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}" data-dest="${destId}">
          <span class="dest-tab-icon">${dest.icon}</span>
          <span class="dest-tab-name">${isZh ? dest.nameZh : dest.nameEn}</span>
          ${isUnlocked
            ? `<span class="dest-tab-progress">${prog.completedMissions}/${prog.totalMissions}</span>`
            : `<span class="dest-tab-badge-lock">🔒 Lv.${reqLevel}</span>`}
        </button>
      `;
    }).join("");

    mapNav.querySelectorAll(".dest-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const destId = btn.getAttribute("data-dest");
        this.renderMissionBoard(destId);
      });
    });

    // Free Practice Action
    const freePracticeBtn = document.getElementById("btn-board-free-practice");
    if (freePracticeBtn) {
      freePracticeBtn.onclick = () => {
        if (window.game) window.game.startNewGameRound(GAME_MODES.NORMAL);
      };
    }

    // 2. Mission Cards for Selected Destination
    const missions = Object.values(CONFIG.MISSION_DEFINITIONS).filter(m => m.destination === selectedDest);
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    const records = profile ? (profile.missionRecords || {}) : {};
    const isPlanetUnlocked = window.progressionManager.isPlanetUnlocked(selectedDest);
    const reqLevel = (CONFIG.DESTINATION_LEVEL_REQUIREMENTS && CONFIG.DESTINATION_LEVEL_REQUIREMENTS[selectedDest]) || 1;

    gridContainer.innerHTML = missions.map(m => {
      const rec = records[m.id] || { completedCount: 0, bestStars: 0, bestFirstTryAccuracy: 0, bestGrade: "C" };
      const starsStr = "⭐".repeat(rec.bestStars) + "☆".repeat(3 - rec.bestStars);
      const isCleared = rec.completedCount > 0;
      const coll = CONFIG.COLLECTIBLES_DEFINITIONS[m.reward.collectible];
      const collIcon = coll ? coll.icon : "🪨";

      return `
        <div class="mission-board-card card ${isCleared ? 'cleared' : ''} ${!isPlanetUnlocked ? 'locked-gate' : ''}" data-mission="${m.id}">
          ${!isPlanetUnlocked ? `<div class="gate-lock-overlay">🔒 ${isZh ? `需指挥官 Lv.${reqLevel}` : `Requires Lv.${reqLevel}`}</div>` : ''}
          <div class="card-top-row">
            <span class="mission-star-badge">${starsStr}</span>
            <span class="mission-grade-badge grade-${rec.bestGrade}">${isCleared ? rec.bestGrade : 'NEW'}</span>
          </div>
          <h3 class="mission-title">${isZh ? m.titleZh : m.titleEn}</h3>
          <p class="mission-story-desc">${isZh ? m.storyZh : m.storyEn}</p>
          <div class="mission-card-meta">
            <span class="meta-tag">🎯 ${m.questionTarget} ${isZh ? '题' : 'Questions'}</span>
            <span class="meta-tag">🎁 +${m.reward.xp} XP</span>
            <span class="meta-tag">${collIcon} ${isZh ? '标本' : 'Sample'}</span>
          </div>
          <button class="btn btn-primary btn-launch-card ${!isPlanetUnlocked ? 'disabled' : ''}" data-mission="${m.id}" ${!isPlanetUnlocked ? 'disabled' : ''}>
            ${isCleared ? (isZh ? '重新挑战' : 'Replay Mission') : (isZh ? '查看简报' : 'Briefing')} ➔
          </button>
        </div>
      `;
    }).join("");

    gridContainer.querySelectorAll(".btn-launch-card").forEach(btn => {
      btn.addEventListener("click", () => {
        const mId = btn.getAttribute("data-mission");
        if (mId && isPlanetUnlocked) {
          this.showMissionBriefingModal(mId);
        }
      });
    });
  }

  /**
   * Show Mission Flight Briefing Modal
   */
  showMissionBriefingModal(missionId, options = {}) {
    const mission = CONFIG.MISSION_DEFINITIONS[missionId] || CONFIG.MISSION_DEFINITIONS.moon_crater_survey;
    this.selectedBriefingMissionId = mission.id;
    this.selectedBriefingPayload = mission.recommendedPayload || "probe";
    this.selectedBriefingRoute = "safe";

    const modal = document.getElementById("modal-mission-briefing");
    if (!modal) return;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    const titleEl = document.getElementById("briefing-modal-title");
    if (titleEl) titleEl.innerText = isZh ? mission.titleZh : mission.titleEn;

    const storyEl = document.getElementById("briefing-modal-story");
    if (storyEl) storyEl.innerText = isZh ? mission.storyZh : mission.storyEn;

    // Objectives Checklist
    const objListEl = document.getElementById("briefing-objectives-list");
    if (objListEl) {
      objListEl.innerHTML = mission.objectives.map(obj => `
        <li class="objective-item">
          <span class="obj-star">⭐</span>
          <span class="obj-desc">${isZh ? obj.descZh : obj.descEn}</span>
        </li>
      `).join("");
    }

    // Payload Selection
    const payloadContainer = document.getElementById("briefing-payload-options");
    if (payloadContainer) {
      const payloads = [
        { id: "probe", nameEn: "📡 Science Probe", nameZh: "📡 深空探测器" },
        { id: "rover", nameEn: "🚙 Surface Rover", nameZh: "🚙 行星漫游车" },
        { id: "cargo", nameEn: "📦 Cargo Module", nameZh: "📦 补给物资舱" },
        { id: "satellite", nameEn: "🛰️ Solar Satellite", nameZh: "🛰️ 太阳能卫星" }
      ];

      payloadContainer.innerHTML = payloads.map(p => `
        <button class="payload-select-btn ${p.id === this.selectedBriefingPayload ? 'selected' : ''}" data-payload="${p.id}">
          ${isZh ? p.nameZh : p.nameEn}
        </button>
      `).join("");

      payloadContainer.querySelectorAll(".payload-select-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          this.selectedBriefingPayload = btn.getAttribute("data-payload");
          payloadContainer.querySelectorAll(".payload-select-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
        });
      });
    }

    // Route Options with Clear Comparison
    const routeSafe = document.getElementById("route-opt-safe");
    const routeBoost = document.getElementById("route-opt-boost");
    if (routeSafe && routeBoost) {
      routeSafe.onclick = () => {
        this.selectedBriefingRoute = "safe";
        routeSafe.classList.add("active");
        routeBoost.classList.remove("active");
      };
      routeBoost.onclick = () => {
        this.selectedBriefingRoute = "boost";
        routeBoost.classList.add("active");
        routeSafe.classList.remove("active");
      };
    }

    const launchBtn = document.getElementById("btn-confirm-launch-mission");
    if (launchBtn) {
      launchBtn.onclick = () => {
        modal.classList.add("hidden");
        if (window.game) {
          window.game.startMission(this.selectedBriefingMissionId, {
            payload: this.selectedBriefingPayload,
            route: this.selectedBriefingRoute,
            dailyMissionContext: options.isDaily ? { date: window.progressionManager.getTodayDateString(), missionId: this.selectedBriefingMissionId } : null
          });
        }
      };
    }

    modal.classList.remove("hidden");
  }

  /**
   * In-Flight Dynamic Event Modal
   */
  triggerFlightEventModal(eventDef, onResolved) {
    this.activeEventData = eventDef;
    this.activeEventCallback = onResolved;

    const modal = document.getElementById("modal-flight-event");
    if (!modal || !eventDef) return;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    const titleEl = document.getElementById("event-modal-title");
    if (titleEl) titleEl.innerText = isZh ? eventDef.titleZh : eventDef.titleEn;

    const descEl = document.getElementById("event-modal-desc");
    if (descEl) descEl.innerText = isZh ? eventDef.descZh : eventDef.descEn;

    if (window.audioManager) window.audioManager.playEventAlert();

    this.renderNextEventQuestion();
    modal.classList.remove("hidden");
  }

  renderNextEventQuestion() {
    if (!window.mathEngine || !this.activeEventData) return;

    this.activeEventQuestion = window.mathEngine.generateQuestion("normal");
    const formulaEl = document.getElementById("event-formula-display");
    const symbol = this.activeEventQuestion.operation === "divide" ? "÷" : "×";

    if (formulaEl) {
      formulaEl.innerHTML = `
        <span>${this.activeEventQuestion.operandA}</span>
        <span class="operator">${symbol}</span>
        <span>${this.activeEventQuestion.operandB}</span>
        <span class="operator">=</span>
        <span id="event-ans-box" class="answer-box-placeholder">?</span>
      `;
    }

    const choicesGrid = document.getElementById("event-choices-grid");
    if (choicesGrid) {
      choicesGrid.innerHTML = this.activeEventQuestion.options.map(val => `
        <button class="choice-btn event-choice-btn" data-val="${val}">${val}</button>
      `).join("");

      choicesGrid.querySelectorAll(".event-choice-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const val = Number(btn.getAttribute("data-val"));
          if (val === this.activeEventQuestion.answer) {
            if (window.audioManager) window.audioManager.playCorrect();
            const feedbackEl = document.getElementById("event-feedback-msg");
            if (feedbackEl) {
              const isZh = window.i18n && window.i18n.currentLanguage === "zh";
              feedbackEl.className = "quiz-feedback success";
              feedbackEl.innerText = isZh ? "✨ 计算修正成功！航向已锁定！" : "✨ Trajectory corrected! Vector locked!";
            }

            const bonusXP = this.activeEventData.bonusXP || 20;
            if (window.progressionManager) {
              window.progressionManager.addXP(bonusXP, "Flight Event Resolved");
            }

            setTimeout(() => {
              document.getElementById("modal-flight-event")?.classList.add("hidden");
              if (this.activeEventCallback) {
                this.activeEventCallback(bonusXP);
              }
            }, 750);
          } else {
            if (window.audioManager) window.audioManager.playWrong();
            const feedbackEl = document.getElementById("event-feedback-msg");
            if (feedbackEl) {
              const isZh = window.i18n && window.i18n.currentLanguage === "zh";
              feedbackEl.className = "quiz-feedback error animate-shake";
              feedbackEl.innerText = isZh ? "航向轻微漂移，再计算一次！" : "Course drifted slightly, recalculate!";
            }
          }
        });
      });
    }
  }

  /**
   * Unlock Reward Ceremony Queue & Modal
   */
  showUnlockCeremonyQueue(newUnlocks) {
    if (!newUnlocks) return;
    const items = [];

    if (newUnlocks.newRockets && Array.isArray(newUnlocks.newRockets)) {
      newUnlocks.newRockets.forEach(r => items.push({ type: "rocket", id: r }));
    }
    if (newUnlocks.newThemes && Array.isArray(newUnlocks.newThemes)) {
      newUnlocks.newThemes.forEach(t => items.push({ type: "theme", id: t }));
    }

    if (items.length === 0) return;
    this.unlockCeremonyQueue = items;
    this.presentNextUnlockCeremony();
  }

  presentNextUnlockCeremony() {
    if (this.unlockCeremonyQueue.length === 0) {
      document.getElementById("modal-new-unlock")?.classList.add("hidden");
      return;
    }

    const item = this.unlockCeremonyQueue.shift();
    const modal = document.getElementById("modal-new-unlock");
    if (!modal) return;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const titleEl = document.getElementById("unlock-modal-title");
    const descEl = document.getElementById("unlock-modal-desc");
    const equipBtn = document.getElementById("btn-unlock-equip-now");
    const contBtn = document.getElementById("btn-unlock-continue");

    if (item.type === "rocket") {
      const names = {
        starship: { en: "SpaceX Starship", zh: "星舰重型航天器" },
        falconHeavy: { en: "Falcon Heavy", zh: "重型猎鹰号火箭" },
        longMarch: { en: "Long March 5", zh: "长征五号火箭" },
        cyber: { en: "Cyber Starship", zh: "赛博量子星舰" }
      };
      const name = names[item.id] || { en: item.id, zh: item.id };
      if (titleEl) titleEl.innerText = `🚀 ${isZh ? name.zh : name.en} ${isZh ? '解锁！' : 'UNLOCKED!'}`;
      if (descEl) descEl.innerText = isZh ? "已达成里程碑！全新 3D 火箭型号已加入机库！" : "Milestone reached! New 3D rocket model added to garage!";

      if (equipBtn) {
        equipBtn.onclick = () => {
          const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
          if (profile) {
            profile.currentRocketModel = item.id;
            window.profileManager.save();
          }
          this.presentNextUnlockCeremony();
        };
      }
    } else if (item.type === "theme") {
      if (titleEl) titleEl.innerText = `🎨 ${item.id} ${isZh ? '涂装解锁！' : 'THEME UNLOCKED!'}`;
      if (descEl) descEl.innerText = isZh ? "全新火箭机体涂装已加入机库！" : "New rocket skin added to garage!";

      if (equipBtn) {
        equipBtn.onclick = () => {
          const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
          if (profile) {
            profile.currentRocketTheme = item.id;
            window.profileManager.save();
          }
          this.presentNextUnlockCeremony();
        };
      }
    }

    if (contBtn) {
      contBtn.onclick = () => {
        this.presentNextUnlockCeremony();
      };
    }

    if (window.audioManager) window.audioManager.playLevelUp();
    modal.classList.remove("hidden");
  }

  /**
   * Space Museum Screen
   */
  renderSpaceMuseum() {
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const container = document.getElementById("museum-display-grid");
    if (!container) return;

    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    const userCollectibles = profile ? (profile.collectibles || []) : [];

    const allItems = Object.values(CONFIG.COLLECTIBLES_DEFINITIONS);

    container.innerHTML = allItems.map(item => {
      const isOwned = userCollectibles.includes(item.id);
      return `
        <div class="museum-item-card card ${isOwned ? 'owned' : 'locked'}" data-item="${item.id}">
          <div class="item-icon-frame">
            <span class="item-icon">${isOwned ? item.icon : '🔒'}</span>
          </div>
          <h4 class="item-name">${isOwned ? (isZh ? item.nameZh : item.nameEn) : (isZh ? '未知宇宙标本' : 'Unknown Specimen')}</h4>
          <p class="item-fact">${isOwned ? (isZh ? item.factZh : item.factEn) : (isZh ? '完成对应行星航天任务即可探索发现' : 'Unlock by completing planetary missions')}</p>
        </div>
      `;
    }).join("");
  }

  /**
   * Rocket Garage & Research Lab Screen
   */
  renderRocketGarage() {
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;

    const activeModel = profile.currentRocketModel || "classic";
    const activeTrail = (profile.rocketCosmetics && profile.rocketCosmetics.trail) || "trail_standard";

    // 1. Model Selector
    const modelContainer = document.getElementById("garage-models-list");
    if (modelContainer) {
      const models = [
        { id: "classic", nameEn: "Classic Explorer", nameZh: "经典探险家号" },
        { id: "starship", nameEn: "SpaceX Starship", nameZh: "星舰重型航天器" },
        { id: "falconHeavy", nameEn: "Falcon Heavy", nameZh: "重型猎鹰号" },
        { id: "longMarch", nameEn: "Long March 5", nameZh: "长征五号火箭" },
        { id: "cyber", nameEn: "Cyber Starship", nameZh: "赛博量子星舰" }
      ];

      modelContainer.innerHTML = models.map(m => {
        const isUnlocked = profile.unlockedRocketModels && profile.unlockedRocketModels.includes(m.id);
        const isCurrent = (m.id === activeModel);
        return `
          <button class="garage-chip ${isCurrent ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}" data-model="${m.id}">
            ${isUnlocked ? '🚀' : '🔒'} ${isZh ? m.nameZh : m.nameEn}
          </button>
        `;
      }).join("");

      modelContainer.querySelectorAll(".garage-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          const mId = btn.getAttribute("data-model");
          if (profile.unlockedRocketModels && profile.unlockedRocketModels.includes(mId)) {
            profile.currentRocketModel = mId;
            if (window.profileManager) window.profileManager.save();
            if (window.rocketBuilder) window.rocketBuilder.setModel(mId);
            this.renderRocketGarage();
          }
        });
      });
    }

    // 2. Engine Trail Research Upgrades
    const trailContainer = document.getElementById("garage-trails-list");
    if (trailContainer && window.progressionManager) {
      const trails = CONFIG.RESEARCH_TREE_DEFINITIONS.trails;
      const userTrails = profile.unlockedResearch || ["trail_standard"];

      trailContainer.innerHTML = trails.map(t => {
        const isOwned = userTrails.includes(t.id);
        const isEquipped = (t.id === activeTrail);
        return `
          <div class="trail-upgrade-card card ${isEquipped ? 'equipped' : ''}" data-trail="${t.id}">
            <div class="trail-header">
              <span class="trail-icon">${t.icon}</span>
              <h4 class="trail-name">${isZh ? t.nameZh : t.nameEn}</h4>
            </div>
            <p class="trail-req">${isOwned ? (isEquipped ? (isZh ? '当前装备中' : 'Equipped') : (isZh ? '已解锁可用' : 'Available')) : (isZh ? t.reqZh : t.reqEn)}</p>
            <button class="btn btn-sm ${isEquipped ? 'btn-outline' : 'btn-primary'} btn-trail-action" data-trail="${t.id}">
              ${isOwned ? (isEquipped ? (isZh ? '已装备' : 'Equipped') : (isZh ? '装备' : 'Equip')) : `${isZh ? '研发' : 'Research'} (${t.cost} RP)`}
            </button>
          </div>
        `;
      }).join("");

      trailContainer.querySelectorAll(".btn-trail-action").forEach(btn => {
        btn.addEventListener("click", () => {
          const tId = btn.getAttribute("data-trail");
          const isOwned = (profile.unlockedResearch || []).includes(tId);
          if (isOwned) {
            if (!profile.rocketCosmetics) profile.rocketCosmetics = {};
            profile.rocketCosmetics.trail = tId;
            if (window.profileManager) window.profileManager.save();
            this.renderRocketGarage();
          } else {
            const res = window.progressionManager.unlockResearch(tId);
            if (res.success) {
              if (window.audioManager) window.audioManager.playUnlock();
              if (!profile.rocketCosmetics) profile.rocketCosmetics = {};
              profile.rocketCosmetics.trail = tId;
              if (window.profileManager) window.profileManager.save();
              this.renderRocketGarage();
            } else {
              alert(isZh ? `🔒 科研点数不足 (需 ${CONFIG.RESEARCH_TREE_DEFINITIONS.trails.find(t=>t.id===tId)?.cost || 0} RP)` : `Not enough Research Points`);
            }
          }
        });
      });
    }

    // 3D Viewport in Garage
    if (window.rocketBuilder) {
      window.rocketBuilder.initScene("canvas-container-garage");
    }
  }

  /**
   * Mascot Nova Speech Display
   */
  showMascotDialogue(msg) {
    const box = document.getElementById("mascot-nova-box");
    if (!box) return;
    box.classList.remove("hidden");
    const textEl = document.getElementById("mascot-nova-text");
    if (textEl) textEl.innerText = msg;

    setTimeout(() => {
      box.classList.add("hidden");
    }, 4500);
  }

  /**
   * Overhauled Mission Debrief Results Screen (Sequential Reward Ceremony)
   */
  renderMissionDebrief(debriefData) {
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const mission = debriefData.mission;

    // Header
    const titleEl = document.getElementById("debrief-mission-title");
    if (titleEl) titleEl.innerText = isZh ? mission.titleZh : mission.titleEn;

    const star1 = document.getElementById("star-1");
    const star2 = document.getElementById("star-2");
    const star3 = document.getElementById("star-3");

    // Reset stars initially for sequential pop-in
    if (star1) star1.className = "star";
    if (star2) star2.className = "star";
    if (star3) star3.className = "star";

    const accEl = document.getElementById("res-accuracy");
    if (accEl) accEl.innerText = `${debriefData.firstTryAccuracy}%`;

    const scoreEl = document.getElementById("res-score");
    if (scoreEl) scoreEl.innerText = window.game ? window.game.score : 0;

    const comboEl = document.getElementById("res-max-combo");
    if (comboEl) comboEl.innerText = window.game ? window.game.maxCombo : 0;

    // Objectives Breakdown
    const objContainer = document.getElementById("debrief-objectives-list");
    if (objContainer && window.game) {
      objContainer.innerHTML = window.game.objectivesStatus.map(obj => `
        <li class="debrief-obj-item ${obj.completed ? 'met' : 'unmet'}">
          <span class="status-icon">${obj.completed ? '✅' : '❌'}</span>
          <span class="obj-text">${isZh ? obj.descZh : obj.descEn}</span>
        </li>
      `).join("");
    }

    // Rewards List
    const rewardsContainer = document.getElementById("debrief-rewards-list");
    if (rewardsContainer) {
      const coll = CONFIG.COLLECTIBLES_DEFINITIONS[debriefData.collectibleId];
      rewardsContainer.innerHTML = `
        <div class="reward-pill">+${debriefData.xpEarned} XP</div>
        <div class="reward-pill">+${debriefData.starsEarned} ${isZh ? '任务之星' : 'Stars'}</div>
        <div class="reward-pill">+${debriefData.rpEarned} ${isZh ? '科研点' : 'RP'}</div>
        ${debriefData.dailyBonusAwarded ? `<div class="reward-pill rare">+${debriefData.dailyBonusAwarded} ${isZh ? '每日首航奖励' : 'Daily Bonus'}</div>` : ''}
        ${debriefData.collectibleUnlocked && coll ? `<div class="reward-pill rare">${coll.icon} ${isZh ? coll.nameZh : coll.nameEn}</div>` : ''}
      `;
    }

    // Level Progress Animation
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (profile && window.progressionManager) {
      const lvlInfo = window.progressionManager.getLevelInfo(profile.progression ? profile.progression.xp : 0);
      const lvlBar = document.getElementById("debrief-level-fill");
      if (lvlBar) lvlBar.style.width = `${lvlInfo.progressPercent}%`;

      const lvlText = document.getElementById("debrief-level-text");
      if (lvlText) lvlText.innerText = `Lv.${lvlInfo.level} ${isZh ? lvlInfo.rankTitleZh : lvlInfo.rankTitleEn} (${lvlInfo.xpInLevel}/${lvlInfo.xpNeededForLevel} XP)`;
    }

    // Next Step Recommendation Button
    const nextBtn = document.getElementById("btn-next-action");
    if (nextBtn && window.progressionManager) {
      if (debriefData.starsEarned < 3) {
        nextBtn.innerText = isZh ? "⭐ 再试一次夺得第 3 颗星" : "⭐ Retry for 3rd Star";
        nextBtn.onclick = () => {
          if (window.game) window.game.startMission(mission.id);
        };
      } else {
        const nextRec = window.progressionManager.getRecommendedMission();
        nextBtn.innerText = isZh ? `🚀 下一任务: ${nextRec.titleZh}` : `🚀 Next: ${nextRec.titleEn}`;
        nextBtn.onclick = () => {
          if (window.game) window.game.startMission(nextRec.id);
        };
      }
    }

    // Sequential Stars Chime
    setTimeout(() => {
      if (star1 && debriefData.starsEarned >= 1) {
        star1.className = "star active";
        if (window.audioManager) window.audioManager.playStarEarned();
      }
    }, 400);

    setTimeout(() => {
      if (star2 && debriefData.starsEarned >= 2) {
        star2.className = "star active";
        if (window.audioManager) window.audioManager.playStarEarned();
      }
    }, 900);

    setTimeout(() => {
      if (star3 && debriefData.starsEarned >= 3) {
        star3.className = "star active";
        if (window.audioManager) window.audioManager.playStarEarned();
      }
    }, 1400);

    // Present unlock ceremony if new rockets / themes unlocked
    if (debriefData.newUnlocks && (debriefData.newUnlocks.newRockets?.length > 0 || debriefData.newUnlocks.newThemes?.length > 0)) {
      setTimeout(() => {
        this.showUnlockCeremonyQueue(debriefData.newUnlocks);
      }, 2000);
    }
  }

  // Quiz rendering and inputs (backward compatible)
  renderQuestion(question, mode = "normal") {
    this.currentAnswerInput = "";
    this.updateAnswerDisplay("?");

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

    const hintBox = document.getElementById("strat-hint-box");
    if (hintBox) { hintBox.classList.add("hidden"); hintBox.innerText = ""; }
    const fuelHintBox = document.getElementById("fuel-strat-hint-box");
    if (fuelHintBox) { fuelHintBox.classList.add("hidden"); fuelHintBox.innerText = ""; }

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

  showWrongAnswerHint(question, options = {}) {
    const context = options.context || "quiz";
    const attempt = options.attempt || 1;
    const isLevel2 = attempt >= 2;

    const hintContainerId = context === "fuel" ? "fuel-strat-hint-box" : "strat-hint-box";
    const hintBox = document.getElementById(hintContainerId);
    if (!hintBox || !question) return;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    let hintObj = isLevel2 ? question.hintL2 : question.hintL1;
    if (!hintObj && window.mathEngine) {
      hintObj = window.mathEngine.getSmartHint(question.operation, question.operandA, question.operandB, question.answer, isLevel2 ? 2 : 1);
    }
    if (!hintObj) hintObj = question.hint;

    const hintText = isZh ? (hintObj?.textZh || "") : (hintObj?.textEn || "");
    const titleText = isLevel2
      ? (isZh ? "💡 完整推导解答" : "💡 Full Worked Solution")
      : (isZh ? "💡 解题思路提示 (别灰心，再试一次！)" : "💡 Strategy Hint (Try Again!)");

    hintBox.className = "strat-hint-box prominent-wrong-hint animate-bounce-short";
    hintBox.classList.remove("hidden");

    hintBox.innerHTML = `
      <div class="hint-title-badge">${titleText}</div>
      <div class="hint-text-body">${hintText}</div>
    `;
  }

  hideAllWrongAnswerHints() {
    const qHint = document.getElementById("strat-hint-box");
    if (qHint) { qHint.classList.add("hidden"); qHint.innerHTML = ""; }
    const fHint = document.getElementById("fuel-strat-hint-box");
    if (fHint) { fHint.classList.add("hidden"); fHint.innerHTML = ""; }
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

  updateQuizHUD(current, total, combo, score, powerLevel = null) {
    const curEl = document.getElementById("quiz-current-num");
    const totEl = document.getElementById("quiz-total-num");
    const streakEl = document.getElementById("quiz-combo-count");
    const scoreEl = document.getElementById("display-score");
    const powerEl = document.getElementById("quiz-power-meter");

    if (curEl) curEl.innerText = current;
    if (totEl) totEl.innerText = total;
    if (streakEl) streakEl.innerText = `🔥 ${combo}`;
    if (scoreEl) scoreEl.innerText = score;
    if (powerEl && powerLevel) {
      powerEl.innerText = powerLevel.label;
      powerEl.style.color = powerLevel.color;
    }
  }

  showQuizTimer(seconds) {
    const timerContainer = document.getElementById("quiz-timer-container");
    if (timerContainer) timerContainer.classList.remove("hidden");
    const timerVal = document.getElementById("quiz-timer-val");
    if (timerVal) timerVal.innerText = `${seconds}s`;
    const fill = document.getElementById("quiz-timer-fill");
    if (fill) fill.style.width = "100%";
  }

  hideQuizTimer() {
    const timerContainer = document.getElementById("quiz-timer-container");
    if (timerContainer) timerContainer.classList.add("hidden");
  }

  updateQuizTimerDisplay(secondsLeft, ratio) {
    const timerVal = document.getElementById("quiz-timer-val");
    if (timerVal) timerVal.innerText = `${secondsLeft}s`;
    const fill = document.getElementById("quiz-timer-fill");
    if (fill) {
      fill.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
      if (ratio < 0.3) fill.style.backgroundColor = "#ef4444";
      else if (ratio < 0.6) fill.style.backgroundColor = "#f59e0b";
      else fill.style.backgroundColor = "#10b981";
    }
  }

  renderVisualHelper(data) {
    const container = document.getElementById("easy-visual-helper");
    if (!container) return;

    if (data.type === "divide") {
      container.innerHTML = `
        <div class="helper-content">
          <div class="helper-formula">${data.formula}</div>
          <div class="helper-desc">Share ${data.total} into ${data.groups} groups of ${data.perGroup}</div>
        </div>
      `;
    } else {
      let dotsHtml = "";
      for (let r = 0; r < Math.min(data.rows, 12); r++) {
        dotsHtml += '<div class="dot-row">';
        for (let c = 0; c < Math.min(data.cols, 12); c++) {
          dotsHtml += '<span class="helper-dot"></span>';
        }
        dotsHtml += '</div>';
      }
      container.innerHTML = `
        <div class="helper-content">
          <div class="dots-grid">${dotsHtml}</div>
          <div class="helper-formula">${data.additionFormula}</div>
        </div>
      `;
    }
  }

  updateBlueprintView() {
    const grid = document.getElementById("blueprint-grid");
    if (!grid || !window.storageManager || !window.rocketBuilder) return;

    const unlocked = window.storageManager.get("unlockedParts") || [];
    const parts = window.rocketBuilder.partDefinitions;
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    grid.innerHTML = parts.map(part => {
      const isUnlocked = unlocked.includes(part.id);
      return `
        <div class="blueprint-slot ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="blueprint-icon">${part.icon}</div>
          <div class="blueprint-name">${isZh ? part.nameZh : part.nameEn}</div>
          <div class="blueprint-status">${isUnlocked ? '✓' : '🔒'}</div>
        </div>
      `;
    }).join("");

    const progressText = document.getElementById("blueprint-progress-text");
    const progressFill = document.getElementById("blueprint-progress-fill");
    if (progressText) progressText.innerText = `${unlocked.length} / ${parts.length}`;
    if (progressFill) progressFill.style.width = `${(unlocked.length / parts.length) * 100}%`;
  }

  renderAssemblyDock() {
    const listContainer = document.getElementById("assembly-parts-list");
    if (!listContainer || !window.storageManager || !window.rocketBuilder) return;

    const unlocked = window.storageManager.get("unlockedParts") || [];
    const installed = window.storageManager.get("installedParts") || [];
    const allParts = window.rocketBuilder.partDefinitions;
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    listContainer.innerHTML = allParts.map(p => {
      const isUnlocked = unlocked.includes(p.id);
      const isInstalled = installed.includes(p.id);
      return `
        <button class="part-item ${isInstalled ? 'installed' : (isUnlocked ? 'unlocked' : 'locked')}" data-part="${p.id}">
          <span class="part-icon">${p.icon}</span>
          <span class="part-label">${isZh ? p.nameZh : p.nameEn}</span>
          <span class="part-state-tag">${isInstalled ? '✓' : (isUnlocked ? 'FITTING' : '🔒')}</span>
        </button>
      `;
    }).join("");

    listContainer.querySelectorAll(".part-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const partId = btn.getAttribute("data-part");
        if (unlocked.includes(partId) && !installed.includes(partId)) {
          if (this.installingParts.has(partId)) return;
          this.installingParts.add(partId);

          if (window.rocketBuilder) {
            window.rocketBuilder.animateInstallPart(partId, () => {
              this.installingParts.delete(partId);
              window.storageManager.installPart(partId);
              this.renderAssemblyDock();
              if ((window.storageManager.get("installedParts") || []).length >= CONFIG.PART_COUNT) {
                this.triggerAssemblyCelebration();
              }
            });
          }
        }
      });
    });

    const goFuelBtn = document.getElementById("btn-go-fuel");
    const lockTip = document.getElementById("assembly-lock-tip");
    if (goFuelBtn) {
      if (installed.length >= CONFIG.PART_COUNT) {
        goFuelBtn.classList.remove("disabled");
        goFuelBtn.removeAttribute("disabled");
        if (lockTip) lockTip.classList.add("hidden");
      } else {
        goFuelBtn.classList.add("disabled");
        goFuelBtn.setAttribute("disabled", "true");
        if (lockTip) {
          lockTip.classList.remove("hidden");
          lockTip.innerText = isZh ? `🔒 需安装完成所有 10 个零件后才能发射 (已安装 ${installed.length}/10)` : `🔒 Please fit all 10 parts before proceeding to Fuel Chamber! (${installed.length}/10)`;
        }
      }
    }
  }

  triggerAssemblyCelebration() {
    const banner = document.getElementById("assembly-celebration-banner");
    if (banner) banner.classList.remove("hidden");
    if (window.rocketBuilder) window.rocketBuilder.triggerCelebrationSpin(1800, () => {
      if (banner) banner.classList.add("hidden");
    });
  }

  updateFuelMissionTarget(destId, loaded, required) {
    const dest = CONFIG.DESTINATIONS[destId] || {};
    const badge = document.getElementById("fuel-dest-badge");
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    if (badge) badge.innerText = `${dest.icon || '🪐'} ${isZh ? (dest.nameZh || destId) : (dest.nameEn || destId)}`;
    const reqEl = document.getElementById("fuel-required-val");
    if (reqEl) reqEl.innerText = required;
    const loadedEl = document.getElementById("fuel-loaded-val");
    if (loadedEl) loadedEl.innerText = `${loaded} / ${required}`;
    const pctEl = document.getElementById("fuel-pct-val");
    if (pctEl) pctEl.innerText = `${Math.min(100, Math.round((loaded / required) * 100))}%`;
  }

  updateFuelGauge(percentage) {
    const fill = document.getElementById("fuel-fill-level");
    if (fill) fill.style.height = `${percentage}%`;
    const pctText = document.getElementById("fuel-percentage");
    if (pctText) pctText.innerText = `${percentage}%`;

    const launchBtn = document.getElementById("btn-ready-to-launch");
    const fullBanner = document.getElementById("fuel-full-alert-banner");

    if (percentage >= 100) {
      if (launchBtn) {
        launchBtn.classList.remove("disabled");
        launchBtn.removeAttribute("disabled");
        launchBtn.classList.add("btn-pulse");
      }
      if (fullBanner) fullBanner.classList.remove("hidden");
    } else {
      if (launchBtn) {
        launchBtn.classList.add("disabled");
        launchBtn.setAttribute("disabled", "true");
        launchBtn.classList.remove("btn-pulse");
      }
      if (fullBanner) fullBanner.classList.add("hidden");
    }
  }

  animateFuelIncrease(prevPct, nextPct, bonusUnits) {
    this.updateFuelGauge(nextPct);
    const bonusEl = document.getElementById("fuel-floating-bonus");
    if (bonusEl && bonusUnits > 0) {
      const isZh = window.i18n && window.i18n.currentLanguage === "zh";
      bonusEl.innerText = isZh ? `🔥 连击加成 +${bonusUnits}` : `🔥 Streak Bonus +${bonusUnits}`;
      bonusEl.classList.remove("hidden", "animate-float-up");
      void bonusEl.offsetWidth;
      bonusEl.classList.add("animate-float-up");
      setTimeout(() => bonusEl.classList.add("hidden"), 1200);
    }
  }

  showPartRewardModal(part) {
    const modal = document.getElementById("modal-part-reward");
    if (!modal) return;
    const nameEl = modal.querySelector(".reward-name");
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    if (nameEl) nameEl.innerText = isZh ? part.nameZh : part.nameEn;
    modal.classList.remove("hidden");
  }

  renderParentReport() {
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (!profile) return;

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const sum = window.mathEngine ? window.mathEngine.getOperationMasterySummary() : { multiplication: 0, division: 0 };
    const firstTryAcc = window.mathEngine ? window.mathEngine.getFirstTryAccuracy() : 100;

    const repAns = document.getElementById("rep-today-answered");
    if (repAns) repAns.innerText = profile.totalQuestionsAnswered || 0;

    const repAcc = document.getElementById("rep-today-accuracy");
    if (repAcc) repAcc.innerText = `${firstTryAcc}%`;

    const repMul = document.getElementById("rep-mult-mastery");
    if (repMul) repMul.innerText = `${sum.multiplication}%`;

    const repDiv = document.getElementById("rep-div-mastery");
    if (repDiv) repDiv.innerText = `${sum.division}%`;

    // Space Passport Stamps
    const stampsContainer = document.getElementById("space-passport-stamps-grid");
    if (stampsContainer) {
      stampsContainer.innerHTML = Object.keys(CONFIG.DESTINATIONS).map(destId => {
        const dest = CONFIG.DESTINATIONS[destId];
        const isVisited = profile.destinationsVisited && profile.destinationsVisited[destId];
        return `
          <div class="passport-stamp-card ${isVisited ? 'stamped' : 'unvisited'}">
            <span class="stamp-icon">${dest.icon}</span>
            <span class="stamp-name">${isZh ? dest.nameZh : dest.nameEn}</span>
            <span class="stamp-status">${isVisited ? '★ VISITED ★' : 'LOCKED'}</span>
          </div>
        `;
      }).join("");
    }
  }

  updateDOM() {
    this.updateProfileHUD();
    this.updateHomeProgressHUD();
  }
}

window.uiManager = new UIManager();
if (typeof module !== "undefined") {
  module.exports = { UIManager };
}
