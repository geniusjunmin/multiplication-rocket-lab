/**
 * Multiplication Rocket Lab - Animation Test Lab (js/animlab.js)
 * Version 4.2.0 Cinematic VFX & Animation Overhaul
 * 
 * Dedicated visual sandbox for testing and previewing 3D flight sequences,
 * multi-shot launch cinematography, procedural planets, and VFX systems.
 * Uses isolated `labOverrides` without polluting player profiles or storage.
 */
class AnimationLab {
  constructor() {
    this.currentDest = "earthOrbit";
    this.currentStage = "idle";
    this.speedMultiplier = 1.0;
    this.isPaused = false;
    this.vfxQuality = "high"; // "high" | "medium" | "low"

    // Isolated Visual Overrides (Never pollutes player save data)
    this.labOverrides = {
      model: "classic",
      theme: "explorer",
      payload: "satellite",
      trail: "trail_standard"
    };

    this.telemetryTimer = null;
    this.lastFrameTime = 0;
    this.fps = 60;
  }

  init() {
    this.bindEvents();
    this.syncHUD();
    this.startTelemetryLoop();
  }

  openScreen() {
    if (window.game) {
      window.game.setGameState(GAME_STATES.ANIM_LAB);
    }
    setTimeout(() => {
      this.initViewport(this.currentDest);
    }, 80);
  }

  initViewport(destId = this.currentDest) {
    this.currentDest = destId;
    if (window.launchSequence) {
      window.launchSequence.initScene("canvas-container-anim-lab", destId);
      window.launchSequence.speedMultiplier = this.speedMultiplier;
      this.applyLabOverridesToScene();
    }
    this.syncHUD();
  }

  playFullFlight(destId = this.currentDest) {
    this.currentDest = destId;
    if (window.launchSequence) {
      window.launchSequence.initScene("canvas-container-anim-lab", destId);
      window.launchSequence.speedMultiplier = this.speedMultiplier;
      this.applyLabOverridesToScene();
      window.launchSequence.startLaunch();
    }
    this.syncHUD();
  }

  jumpStage(stageName, destId = this.currentDest) {
    this.currentDest = destId;
    if (window.launchSequence) {
      window.launchSequence.jumpToStage(stageName, destId, "canvas-container-anim-lab");
      window.launchSequence.speedMultiplier = this.speedMultiplier;
      this.applyLabOverridesToScene();
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
    if (window.audioManager) window.audioManager.startEngineLoop();

    const interval = setInterval(() => {
      fuel += 10;
      this.updateHUDStage(`⛽ 燃料加注中: ${fuel}%`);
      if (window.audioManager) window.audioManager.setEngineThrottle(fuel / 100);
      if (fuel >= 100) {
        clearInterval(interval);
        this.updateHUDStage("⛽ 燃料加注完毕 100% (READY FOR LAUNCH)!");
        if (window.audioManager) {
          window.audioManager.stopEngineLoop();
          window.audioManager.playVictory();
        }
      }
    }, 150);
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
      icon: "☄️"
    };

    if (window.launchSequence) {
      window.launchSequence.isEventPaused = true;
    }
    if (window.uiManager) {
      window.uiManager.showFlightEventModal(eventDef, (selectedOpt) => {
        if (window.launchSequence) {
          window.launchSequence.isEventPaused = false;
        }
      });
    }
  }

  setSpeed(mult) {
    this.speedMultiplier = mult;
    if (window.launchSequence) {
      window.launchSequence.speedMultiplier = mult;
    }
    document.querySelectorAll(".speed-btn").forEach(btn => btn.classList.remove("active"));
    const idMap = { 0.25: "btn-anim-speed-025", 0.5: "btn-anim-speed-05", 1.0: "btn-anim-speed-1", 2.0: "btn-anim-speed-2", 4.0: "btn-anim-speed-4" };
    if (idMap[mult]) {
      document.getElementById(idMap[mult])?.classList.add("active");
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (window.launchSequence) {
      window.launchSequence.isEventPaused = this.isPaused;
    }
    const btn = document.getElementById("btn-anim-pause-resume");
    if (btn) btn.innerText = this.isPaused ? "▶️ 继续播放" : "⏸️ 暂停/继续";
  }

  /**
   * Apply overrides strictly in isolated sandbox memory without mutating user profile
   */
  applyCustomization(model, theme, payload, trail) {
    this.labOverrides.model = model;
    this.labOverrides.theme = theme;
    this.labOverrides.payload = payload;
    this.labOverrides.trail = trail;
    this.initViewport(this.currentDest);
  }

  applyLabOverridesToScene() {
    if (!window.launchSequence || !window.launchSequence.rocket) return;
    const ov = this.labOverrides;

    // Apply color theme
    if (CONFIG.THEMES && CONFIG.THEMES[ov.theme]) {
      const themeColors = CONFIG.THEMES[ov.theme].colors;
      window.launchSequence.rocket.traverse(child => {
        if (child.isMesh && child.material) {
          if (child.name.includes("body") && themeColors.primary) {
            child.material.color.setHex(themeColors.primary);
          } else if (child.name.includes("fin") && themeColors.secondary) {
            child.material.color.setHex(themeColors.secondary);
          }
        }
      });
    }
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
    if (modelEl) modelEl.innerText = `🛸 型号: ${this.labOverrides.model}`;
    if (payloadEl) payloadEl.innerText = `📦 载荷: ${this.labOverrides.payload}`;
  }

  updateHUDStage(text) {
    const stageEl = document.getElementById("anim-hud-stage");
    if (stageEl) stageEl.innerText = `🚀 阶段: ${text}`;
  }

  startTelemetryLoop() {
    if (this.telemetryTimer) clearInterval(this.telemetryTimer);
    this.telemetryTimer = setInterval(() => {
      this.updateTelemetryHUD();
    }, 200);
  }

  updateTelemetryHUD() {
    const telemEl = document.getElementById("anim-telemetry-info");
    if (!telemEl || !window.launchSequence) return;

    const seq = window.launchSequence;
    const renderer = seq.renderer;
    const rInfo = renderer ? renderer.info : null;

    const drawCalls = rInfo ? rInfo.render.calls : 0;
    const triangles = rInfo ? rInfo.render.triangles : 0;
    const stage = seq.currentStage || "idle";
    const cam = seq.camera;
    const camPos = cam ? `(${cam.position.x.toFixed(1)}, ${cam.position.y.toFixed(1)}, ${cam.position.z.toFixed(1)})` : "(0,0,0)";
    const rocketPos = seq.rocket ? `(${seq.rocket.position.x.toFixed(1)}, ${seq.rocket.position.y.toFixed(1)}, ${seq.rocket.position.z.toFixed(1)})` : "(0,0,0)";

    let activeSmoke = 0;
    if (seq.smokePool) {
      activeSmoke = seq.smokePool.filter(p => p.active || (p.mesh && p.mesh.visible)).length;
    }

    telemEl.innerHTML = `
      <div class="telem-row"><strong>Stage:</strong> ${stage} | <strong>Calls:</strong> ${drawCalls} | <strong>Triangles:</strong> ${triangles}</div>
      <div class="telem-row"><strong>Rocket:</strong> ${rocketPos} | <strong>Cam:</strong> ${camPos} | <strong>VFX Particles:</strong> ${activeSmoke}</div>
    `;
  }

  bindEvents() {
    document.querySelectorAll(".btn-anim-action").forEach(btn => {
      btn.addEventListener("click", () => {
        const dest = btn.getAttribute("data-dest");
        if (dest) this.playFullFlight(dest);
      });
    });

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

    document.getElementById("btn-anim-speed-025")?.addEventListener("click", () => this.setSpeed(0.25));
    document.getElementById("btn-anim-speed-05")?.addEventListener("click", () => this.setSpeed(0.5));
    document.getElementById("btn-anim-speed-1")?.addEventListener("click", () => this.setSpeed(1.0));
    document.getElementById("btn-anim-speed-2")?.addEventListener("click", () => this.setSpeed(2.0));
    document.getElementById("btn-anim-speed-4")?.addEventListener("click", () => this.setSpeed(4.0));

    document.getElementById("btn-anim-play-all")?.addEventListener("click", () => this.playFullFlight(this.currentDest));
    document.getElementById("btn-anim-pause-resume")?.addEventListener("click", () => this.togglePause());
    document.getElementById("btn-anim-reset")?.addEventListener("click", () => this.initViewport(this.currentDest));

    document.getElementById("btn-anim-test-assembly")?.addEventListener("click", () => this.playAssemblyTest());
    document.getElementById("btn-anim-test-fuel")?.addEventListener("click", () => this.playFuelTest());
    document.getElementById("btn-anim-test-unlock-starship")?.addEventListener("click", () => this.playUnlockCeremony("rocket", "starship"));
    document.getElementById("btn-anim-test-unlock-cyber")?.addEventListener("click", () => this.playUnlockCeremony("rocket", "cyber"));

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

// Export for browser and node
if (typeof module !== "undefined" && module.exports) {
  module.exports = AnimationLab;
}
window.animationLab = new AnimationLab();
