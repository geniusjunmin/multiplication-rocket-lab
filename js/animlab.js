/**
 * Multiplication Rocket Lab - Animation Test Lab (js/animlab.js)
 * Dedicated playground for instant testing, previewing, and debugging of all
 * 3D flight sequences, orbital insertions, surface landings, payload deployments,
 * sequential assembly VFX, and UI reward ceremonies without requiring quiz completion.
 */
class AnimationLab {
  constructor() {
    this.currentDest = "earthOrbit";
    this.currentStage = "idle";
    this.speedMultiplier = 1.0;
    this.isPaused = false;
    this.activeModel = "classic";
    this.activeTheme = "explorer";
    this.activePayload = "satellite";
    this.activeTrail = "trail_standard";
  }

  init() {
    this.bindEvents();
    this.syncHUD();
  }

  openScreen() {
    if (window.game) {
      window.game.setGameState(GAME_STATES.ANIM_LAB);
    }
    // Initialize scene inside Anim Lab viewport
    setTimeout(() => {
      this.initViewport(this.currentDest);
    }, 80);
  }

  initViewport(destId = this.currentDest) {
    this.currentDest = destId;
    if (window.launchSequence) {
      window.launchSequence.initScene("canvas-container-anim-lab", destId);
      window.launchSequence.speedMultiplier = this.speedMultiplier;
    }
    this.syncHUD();
  }

  playFullFlight(destId = this.currentDest) {
    this.currentDest = destId;
    if (window.launchSequence) {
      window.launchSequence.initScene("canvas-container-anim-lab", destId);
      window.launchSequence.speedMultiplier = this.speedMultiplier;
      window.launchSequence.startLaunchSequence();
    }
    this.syncHUD();
  }

  jumpStage(stageName, destId = this.currentDest) {
    this.currentDest = destId;
    if (window.launchSequence) {
      window.launchSequence.jumpToStage(stageName, destId, "canvas-container-anim-lab");
      window.launchSequence.speedMultiplier = this.speedMultiplier;
    }
    this.syncHUD();
  }

  playAssemblyTest() {
    if (window.rocketBuilder) {
      window.rocketBuilder.initScene("canvas-container-anim-lab");
      window.rocketBuilder.playSequentialAssembly(() => {
        window.rocketBuilder.playCelebrationSpin();
      });
    }
    this.updateHUDStage("✨ 10 零件连续吸附组装");
  }

  playFuelTest() {
    let fuel = 0;
    this.updateHUDStage("⛽ 燃料加注中: 0%");
    if (window.audioManager) window.audioManager.playIgnition();

    const interval = setInterval(() => {
      fuel += 10;
      this.updateHUDStage(`⛽ 燃料加注中: ${fuel}%`);
      if (fuel >= 100) {
        clearInterval(interval);
        this.updateHUDStage("⛽ 燃料加注完毕 100% (READY FOR LAUNCH)!");
        if (window.audioManager) window.audioManager.playVictory();
      }
    }, 180);
  }

  playUnlockCeremony(type = "rocket", id = "starship") {
    if (window.uiManager) {
      window.uiManager.showUnlockCeremonyQueue([{ type, id }]);
    }
  }

  playFlightEventTest(eventKey = "asteroid_alert") {
    const eventDef = (CONFIG.EVENT_DEFINITIONS && CONFIG.EVENT_DEFINITIONS[eventKey]) || {
      nameZh: "小行星带密集预警",
      nameEn: "Dense Asteroid Field Alert",
      storyZh: "探测到密集微陨石群！请迅速计算引力偏转角度以避开撞击！",
      storyEn: "Micrometeorite storm detected! Calculate gravity deflection immediately!",
      icon: "☄️",
      bonusXP: 25
    };

    if (window.uiManager) {
      window.uiManager.triggerFlightEventModal(eventDef, (bonusXP) => {
        if (window.audioManager) window.audioManager.playVictory();
      });
    }
  }

  setSpeed(speed) {
    this.speedMultiplier = speed;
    if (window.launchSequence) {
      window.launchSequence.speedMultiplier = speed;
    }
    document.querySelectorAll(".speed-btn").forEach(btn => btn.classList.remove("active"));
    const key = speed.toString().replace(".", "");
    const activeBtn = document.getElementById(`btn-anim-speed-${key}`);
    if (activeBtn) activeBtn.classList.add("active");
  }

  togglePause() {
    if (!window.launchSequence) return;
    window.launchSequence.isEventPaused = !window.launchSequence.isEventPaused;
    this.isPaused = window.launchSequence.isEventPaused;
    const btn = document.getElementById("btn-anim-pause-resume");
    if (btn) {
      btn.innerText = this.isPaused ? "▶️ 继续播放" : "⏸️ 暂停";
    }
  }

  applyCustomization(model, theme, payload, trail) {
    this.activeModel = model;
    this.activeTheme = theme;
    this.activePayload = payload;
    this.activeTrail = trail;

    if (window.storageManager) {
      window.storageManager.set("currentRocketModel", model);
      window.storageManager.set("currentRocketTheme", theme);
      window.storageManager.set("selectedPayload", payload);
    }

    const profile = window.profileManager ? window.profileManager.getActiveProfile() : null;
    if (profile) {
      profile.currentRocketModel = model;
      profile.currentRocketTheme = theme;
      profile.selectedPayload = payload;
      profile.rocketCosmetics = profile.rocketCosmetics || {};
      profile.rocketCosmetics.trail = trail;
    }

    this.initViewport(this.currentDest);
  }

  syncHUD() {
    const destEl = document.getElementById("anim-hud-dest");
    const stageEl = document.getElementById("anim-hud-stage");
    const modelEl = document.getElementById("anim-hud-model");
    const payloadEl = document.getElementById("anim-hud-payload");

    const destNames = {
      earthOrbit: "🌍 近地轨道 (earthOrbit)",
      moon: "🌙 月球 (moon)",
      mars: "🔴 火星 (mars)",
      jupiter: "🪐 木星 (jupiter)",
      saturn: "🪐 土星 (saturn)",
      deepSpace: "🌌 深空 (deepSpace)"
    };

    if (destEl) destEl.innerText = destNames[this.currentDest] || this.currentDest;
    if (stageEl) {
      const stage = (window.launchSequence && window.launchSequence.currentStage) || "待命中 (Idle)";
      stageEl.innerText = `🚀 阶段: ${stage}`;
    }
    if (modelEl) modelEl.innerText = `🛸 型号: ${this.activeModel}`;
    if (payloadEl) payloadEl.innerText = `📦 载荷: ${this.activePayload}`;
  }

  updateHUDStage(text) {
    const stageEl = document.getElementById("anim-hud-stage");
    if (stageEl) stageEl.innerText = `🚀 阶段: ${text}`;
  }

  bindEvents() {
    // Planet Flight Buttons
    document.querySelectorAll(".btn-anim-action").forEach(btn => {
      btn.addEventListener("click", () => {
        const dest = btn.getAttribute("data-dest");
        if (dest) this.playFullFlight(dest);
      });
    });

    // Stage Jump Buttons
    document.querySelectorAll(".btn-anim-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        const stage = btn.getAttribute("data-stage");
        if (action === "stage") {
          this.jumpStage(stage, this.currentDest);
        } else if (action === "eventModal") {
          this.playFlightEventTest();
        }
      });
    });

    // Speed Controls
    document.getElementById("btn-anim-speed-05")?.addEventListener("click", () => this.setSpeed(0.5));
    document.getElementById("btn-anim-speed-1")?.addEventListener("click", () => this.setSpeed(1.0));
    document.getElementById("btn-anim-speed-2")?.addEventListener("click", () => this.setSpeed(2.0));
    document.getElementById("btn-anim-speed-4")?.addEventListener("click", () => this.setSpeed(4.0));

    // Toolbar
    document.getElementById("btn-anim-play-all")?.addEventListener("click", () => this.playFullFlight(this.currentDest));
    document.getElementById("btn-anim-pause-resume")?.addEventListener("click", () => this.togglePause());
    document.getElementById("btn-anim-reset")?.addEventListener("click", () => this.initViewport(this.currentDest));

    // Assembly & Fuel & Unlock
    document.getElementById("btn-anim-test-assembly")?.addEventListener("click", () => this.playAssemblyTest());
    document.getElementById("btn-anim-test-fuel")?.addEventListener("click", () => this.playFuelTest());
    document.getElementById("btn-anim-test-unlock-starship")?.addEventListener("click", () => this.playUnlockCeremony("rocket", "starship"));
    document.getElementById("btn-anim-test-unlock-cyber")?.addEventListener("click", () => this.playUnlockCeremony("rocket", "cyber"));

    // Selectors
    const syncSelectors = () => {
      const model = document.getElementById("anim-select-model")?.value || "classic";
      const theme = document.getElementById("anim-select-theme")?.value || "explorer";
      const payload = document.getElementById("anim-select-payload")?.value || "satellite";
      const trail = document.getElementById("anim-select-trail")?.value || "trail_standard";
      this.applyCustomization(model, theme, payload, trail);
    };

    document.getElementById("anim-select-model")?.addEventListener("change", syncSelectors);
    document.getElementById("anim-select-theme")?.addEventListener("change", syncSelectors);
    document.getElementById("anim-select-payload")?.addEventListener("change", syncSelectors);
    document.getElementById("anim-select-trail")?.addEventListener("change", syncSelectors);
  }
}

window.animationLab = new AnimationLab();
