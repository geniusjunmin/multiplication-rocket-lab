/**
 * Multiplication Rocket Lab - Cinematic Interplanetary Launch & Landing Engine (js/launch.js)
 * Version 4.2.1 Cinematic Integration & Spectacle Pass
 * 
 * Features:
 * - Local Flight Rig Scene Graph (environmentRig, flightRig, planetRig, fxRig)
 * - Canonical startLaunch(options) & startLaunchSequence backwards compatibility
 * - Unified DOM IDs (countdown-num, check-item-1..4, launch-stage-banner, space-victory-banner)
 * - Single-fire skipCountdown() with immediate ignition trigger
 * - Centralized Timer & Interval Lifecycle Management (scheduleTimeout, scheduleInterval, clearScheduledWork)
 * - Clean destroy() completely resetting page state & WebAudio loops
 * - Dynamic In-Flight Events with 3D Asteroids, Solar Storms, Overheat Alerts & "SYSTEM STABILIZED"
 * - High-Climax Destination Scenes:
 *     * Earth Orbit: 7-9s orbital coast, station pass, satellite separation, solar panel unfold
 *     * Jupiter Flyby: 8-11s giant banded planet, Io/Europa moon parallax, Great Red Spot skim, probe scan
 *     * Saturn Ring Dive: 9-12s ring plane dive, 30° roll, Cassini division cross, ice streaks, wide hero
 *     * Deep Space Discovery: 9-12s warp collapse, silence beat, glowing nebula reveal, beacon relic scan
 * - Procedural Displaced Planetary Terrain (PlaneGeometry) for Moon & Mars landings
 * - Multi-Shot 4-Phase Landing Storyboard with 3.8s Touchdown Hold
 * - DeltaTime Frame-Based PayloadAnimator (Rover, Satellite, Probe, Cargo)
 * - Research Rocket Trail Integration (Standard, Plasma Blue, Ion Green, Solar Flare, Starlight)
 */
class LaunchSequence {
  constructor(options = {}) {
    this.quality = options.quality || "high";
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;

    // Rigs Hierarchy
    this.environmentRig = null;
    this.flightRig = null;
    this.rocketRig = null;
    this.planetRig = null;
    this.fxRig = null;

    // Subsystems
    this.cameraDirector = null;
    this.engineVfx = null;
    this.particleSystem = null;
    this.warpVfx = null;

    // Meshes & Lights
    this.rocket = null;
    this.flameMesh = null;
    this.engineLight = null;
    this.contactShadow = null;
    this.terrainMesh = null;

    // Procedural Destination Elements
    this.earthGroup = null;
    this.destinationGroup = null;
    this.destinationMesh = null;
    this.saturnRingMesh = null;
    this.launchPadGroup = null;
    this.cloudsGroup = null;
    this.starsGroup = null;

    // Payload Management
    this.payloadMesh = null;
    this.payloadState = {
      attached: true,
      doorOpening: false,
      separating: false,
      deploying: false,
      operating: false,
      deployed: false,
      elapsed: 0
    };

    // Timeline & Pacing
    this.animationId = null;
    this.lastTime = 0;
    this.timelineElapsed = 0;
    this.currentStage = "idle";
    this.landingPhase = "idle"; // "highDescent" | "retroBurn" | "finalDescent" | "touchdownHold"
    this.landingPhaseElapsed = 0;

    // Countdown & Timers
    this.countdownValue = 5;
    this.countdownTimer = null;
    this.hasSkippedCountdown = false;
    this.activeTimeouts = [];
    this.activeIntervals = [];
    this.activeRafs = new Set();

    // Event & Mission States
    this.destinationId = "moon";
    this.hasRecordedVisit = false;
    this.onCompleteCallback = null;
    this.hasShownTowerClear = false;
    this.isEventPaused = false;
    this.hasTriggeredFlightEvent = false;
    this.event3DMeshes = [];

    // Local Landing Coordinate Framework
    this.GROUND_Y = 0;
    this.rocketLocalMinY = -2.5;
    this.rocketLocalMaxY = 3.5;
    this.rocketHeight = 6.0;
    this.touchdownRocketY = 2.5;
    this.currentVerticalSpeed = 0;

    // Debug & Lab Settings
    this.isDebugMode = false;
    this.isLandingDebug = false;
    this.speedMultiplier = 1.0;
    this.labOverrides = null;

    // Compatibility Pools
    this.smokePool = [];
    this.dustPool = [];

    this.boundVisibilityHandler = null;
    this.boundResizeHandler = null;
  }

  /* =========================================================================
   * 1. TIMERS & LIFECYCLE MANAGEMENT
   * ========================================================================= */

  scheduleTimeout(fn, delayMs) {
    const t = setTimeout(() => {
      const idx = this.activeTimeouts.indexOf(t);
      if (idx !== -1) this.activeTimeouts.splice(idx, 1);
      fn();
    }, delayMs);
    this.activeTimeouts.push(t);
    return t;
  }

  scheduleInterval(fn, intervalMs) {
    const i = setInterval(fn, intervalMs);
    this.activeIntervals.push(i);
    return i;
  }

  clearScheduledWork() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.activeTimeouts.forEach(t => clearTimeout(t));
    this.activeTimeouts = [];
    this.activeIntervals.forEach(i => clearInterval(i));
    this.activeIntervals = [];
  }

  requestTrackedRaf(callback) {
    if (typeof requestAnimationFrame === "undefined") {
      const id = this.scheduleTimeout(callback, 16);
      return id;
    }
    const rafId = requestAnimationFrame((timestamp) => {
      this.activeRafs.delete(rafId);
      callback(timestamp);
    });
    this.activeRafs.add(rafId);
    return rafId;
  }

  cancelTrackedRaf(rafId) {
    if (!rafId) return;
    this.activeRafs.delete(rafId);
    if (typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(rafId);
    } else {
      clearTimeout(rafId);
    }
  }

  /* =========================================================================
   * 2. SCENE INITIALIZATION & RIGS SETUP
   * ========================================================================= */

  initScene(containerId, destId = "moon", overrides = {}) {
    this.destroy();
    this.destinationId = destId;
    this.labOverrides = (overrides && overrides.sandbox) ? overrides : null;
    this.hasRecordedVisit = false;
    this.currentStage = "idle";
    this.landingPhase = "idle";
    this.hasSkippedCountdown = false;
    this.hasTriggeredFlightEvent = false;
    this.isEventPaused = false;
    this.payloadState = {
      attached: true,
      doorOpening: false,
      separating: false,
      deploying: false,
      operating: false,
      deployed: false,
      elapsed: 0
    };
    this.hasShownTowerClear = false;

    this.checkDebugFlags();

    const container = document.getElementById(containerId);
    if (!container) return;
    this.container = container;

    container.innerHTML = "";
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    if (!window.WebGLRenderingContext) return;

    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0a0e1a);
      this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.008);

      this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 4000);
      this.camera.position.set(0, 1.5, 9);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(this.renderer.domElement);

      // Initialize Flight Rig Scene Graph Hierarchy
      this.environmentRig = new THREE.Group();
      this.flightRig = new THREE.Group();
      this.rocketRig = new THREE.Group();
      this.planetRig = new THREE.Group();
      this.fxRig = new THREE.Group();

      this.flightRig.add(this.rocketRig);
      this.scene.add(this.environmentRig);
      this.scene.add(this.flightRig);
      this.scene.add(this.planetRig);
      this.scene.add(this.fxRig);

      // Subsystems Initialization
      this.cameraDirector = new CinematicCameraDirector(this.camera);
      const isReduced = (typeof document !== "undefined" && document.body && document.body.classList) ? document.body.classList.contains("reduced-motion") : false;
      this.cameraDirector.setReducedMotion(isReduced);

      const activeQuality = (this.labOverrides && this.labOverrides.quality) || this.quality || "high";
      this.particleSystem = new ParticleSystem(this.fxRig, activeQuality);
      this.smokePool = this.particleSystem.smokePool;
      this.dustPool = this.particleSystem.dustPool;

      const qCfg = ParticleSystem.getQualityConfig(activeQuality);
      this.warpVfx = new WarpVFXSystem(this.fxRig, qCfg.warpStreaks || 280);
      this.warpVfx.setReducedMotion(isReduced);
      this.fxRig.add(this.warpVfx.group);

      // Lighting Setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
      dirLight.position.set(20, 30, 25);
      this.scene.add(dirLight);

      this.engineLight = new THREE.PointLight(0xff7722, 0, 45);
      this.engineLight.position.set(0, -2.5, 0);
      this.flightRig.add(this.engineLight);

      // Build Procedural Scene Elements
      this.createLaunchPad();
      this.createCloudLayer();
      this.createSpaceEnvironment();
      this.createDestinationPlanet(destId);
      this.createRocketCopy();

      // Read active Trail from Cosmetics or Lab Overrides
      const profile = (window.profileManager && !this.labOverrides) ? window.profileManager.getActiveProfile() : null;
      const trailStyle = (this.labOverrides && this.labOverrides.trail) || (profile && profile.rocketCosmetics && profile.rocketCosmetics.trail) || "trail_standard";

      this.engineVfx = new EngineVFXSystem(this.flightRig, { trailStyle });
      if (this.rocketRig) {
        this.rocketRig.add(this.engineVfx.group);
        this.engineVfx.group.position.set(0, this.rocketLocalMinY, 0);
      }
      this.flameMesh = this.engineVfx.plumeMesh;

      this.resetHUDUI();

      this.boundVisibilityHandler = () => {
        if (typeof document !== "undefined" && document.hidden) {
          this.lastTime = 0;
        }
      };
      if (typeof document !== "undefined" && document.addEventListener) {
        document.addEventListener("visibilitychange", this.boundVisibilityHandler);
      }

      this.boundResizeHandler = () => this.onWindowResize(containerId);
      window.addEventListener("resize", this.boundResizeHandler);

      this.lastTime = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      this.animate();
    } catch (e) {
      console.warn("LaunchSequence WebGL Init Error:", e);
    }
  }

  checkDebugFlags() {
    if (typeof window !== "undefined" && window.location && window.location.search) {
      const qs = window.location.search;
      this.isDebugMode = qs.includes("dev=1") || qs.includes("dev=true");
      this.isLandingDebug = qs.includes("landingDebug=1");
    }
  }

  resetHUDUI() {
    this.hasRecordedVisit = false;
    if (this.launchPadGroup) this.launchPadGroup.visible = true;
    if (this.cloudsGroup) this.cloudsGroup.visible = true;
    if (this.terrainMesh) this.terrainMesh.visible = false;
    if (this.destinationGroup) this.destinationGroup.visible = false;
    if (this.earthGroup) this.earthGroup.visible = false;

    document.getElementById("launch-checklist")?.classList.remove("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");
    document.getElementById("space-victory-banner")?.classList.add("hidden");
    document.getElementById("launch-stage-banner")?.classList.add("hidden");

    const checkItems = [1, 2, 3, 4];
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const textMap = {
      1: isZh ? "✓ 航天器电气与遥测回路校验完毕" : "✓ Avionics & Telemetry Check OK",
      2: isZh ? "✓ 主发动机低温推进剂加注完毕" : "✓ Cryogenic Propellant Loaded 100%",
      3: isZh ? "✓ 任务载荷锁止与姿态自检正常" : "✓ Mission Payload Locked & Ready",
      4: isZh ? "✓ 星际发射走廊与轨道净空就绪" : "✓ Launch Corridor Clear"
    };

    checkItems.forEach(i => {
      const el = document.getElementById(`check-item-${i}`);
      if (el) el.innerText = textMap[i];
    });
  }

  enterCinematicMode() {
    document.body.classList.add("cinematic-mode-active");
    const container = this.container || document.getElementById("screen-launch");
    if (container) container.classList.add("cinematic-active");
  }

  exitCinematicMode() {
    document.body.classList.remove("cinematic-mode-active");
    const container = this.container || document.getElementById("screen-launch");
    if (container) container.classList.remove("cinematic-active");
  }

  onWindowResize(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !this.renderer || !this.camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /* =========================================================================
   * 3. PROCEDURAL ENVIRONMENT & CELESTIAL GRAPHICS
   * ========================================================================= */

  createLaunchPad() {
    if (typeof THREE === "undefined") return;
    this.launchPadGroup = new THREE.Group();

    // Heavy Concrete Pad with Flame Trench
    const padGeo = new THREE.CylinderGeometry(5.0, 6.0, 1.2, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = -0.6;
    this.launchPadGroup.add(pad);

    const trenchGeo = new THREE.CylinderGeometry(1.8, 1.8, 1.3, 24);
    const trenchMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const trench = new THREE.Mesh(trenchGeo, trenchMat);
    trench.position.y = -0.55;
    this.launchPadGroup.add(trench);

    // Tower & Service Arm
    const towerGeo = new THREE.BoxGeometry(1.2, 16.0, 1.2);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6, metalness: 0.4 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-3.2, 7.5, 0);
    this.launchPadGroup.add(tower);

    const armGeo = new THREE.BoxGeometry(2.6, 0.4, 0.4);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.5 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(-1.8, 6.0, 0);
    this.launchPadGroup.add(arm);

    this.environmentRig.add(this.launchPadGroup);
  }

  createCloudLayer() {
    if (typeof THREE === "undefined") return;
    this.cloudsGroup = new THREE.Group();

    // Create Soft Billboard Cloud Clusters
    if (this.particleSystem) {
      const activeQuality = (this.labOverrides && this.labOverrides.quality) || this.quality || "high";
      const qCfg = ParticleSystem.getQualityConfig(activeQuality);
      this.particleSystem.createSoftCloudLayers(this.cloudsGroup, qCfg.cloudSprites || 24);
    }
    this.environmentRig.add(this.cloudsGroup);
  }

  createSpaceEnvironment() {
    if (typeof THREE === "undefined") return;
    const activeQuality = (this.labOverrides && this.labOverrides.quality) || this.quality || "high";
    const q = ParticleSystem.getQualityConfig(activeQuality);
    const count = q.stars || 3000;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 400 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorType = Math.random();
      if (colorType > 0.8) {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
      } else if (colorType > 0.65) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.6;
      } else {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    this.starsGroup = new THREE.Points(geo, mat);
    this.environmentRig.add(this.starsGroup);

    // Earth Orbit Model
    this.earthGroup = PlanetVisualFactory.createEarth(18.0);
    this.earthGroup.position.set(0, -32, -45);
    this.earthGroup.visible = false;
    this.environmentRig.add(this.earthGroup);
    this.earthMesh = this.earthGroup.userData?.baseMesh || this.earthGroup;
  }

  createDestinationPlanet(destId) {
    if (typeof THREE === "undefined") return;

    if (this.destinationGroup) {
      this.planetRig.remove(this.destinationGroup);
      this.destinationGroup = null;
    }

    if (destId === "moon") {
      this.destinationGroup = PlanetVisualFactory.createMoon(12.0);
    } else if (destId === "mars") {
      this.destinationGroup = PlanetVisualFactory.createMars(14.0);
    } else if (destId === "jupiter") {
      this.destinationGroup = PlanetVisualFactory.createJupiter(24.0);
    } else if (destId === "saturn") {
      this.destinationGroup = PlanetVisualFactory.createSaturn(18.0);
      this.saturnRingMesh = this.destinationGroup.userData?.ringMesh || null;
      if (this.particleSystem) {
        const activeQuality = (this.labOverrides && this.labOverrides.quality) || this.quality || "high";
        const qCfg = ParticleSystem.getQualityConfig(activeQuality);
        this.particleSystem.createSaturnIceField(qCfg.saturnIce || 500, this.destinationGroup);
      }
    } else if (destId === "deepSpace") {
      this.destinationGroup = PlanetVisualFactory.createDeepSpace(20.0);
    } else {
      this.destinationGroup = PlanetVisualFactory.createEarth(18.0);
    }

    this.destinationGroup.position.set(0, 0, -140);
    this.destinationGroup.visible = false;
    this.planetRig.add(this.destinationGroup);
    this.destinationMesh = this.destinationGroup.userData?.baseMesh || this.destinationGroup;
  }

  createRocketCopy() {
    if (!window.rocketBuilder) return;

    // Sandbox vs Real Profile Rocket Generation
    if (this.labOverrides) {
      const model = this.labOverrides.model || "classic";
      const theme = this.labOverrides.theme || "explorer";
      const payload = this.labOverrides.payload || "satellite";
      this.rocket = window.rocketBuilder.buildCustomRocketInstance(model, theme, payload);
    } else {
      this.rocket = window.rocketBuilder.createDetachedRocket();
    }

    this.rocket.position.set(0, 0, 0);
    this.rocketRig.add(this.rocket);

    this.calculateRocketDimensions();
    this.payloadMesh = this.rocket.getObjectByName("payload_mesh") || null;
  }

  calculateRocketDimensions() {
    if (!this.rocket || typeof THREE === "undefined" || !THREE.Box3) {
      this.rocketLocalMinY = -2.5;
      this.rocketLocalMaxY = 3.5;
      this.rocketHeight = 6.0;
      this.touchdownRocketY = 2.5;
      return;
    }

    const prevPos = this.rocket.position.clone();
    this.rocket.position.set(0, 0, 0);
    this.rocket.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(this.rocket);
    this.rocketLocalMinY = box.min.y;
    this.rocketLocalMaxY = box.max.y;
    this.rocketHeight = Math.max(1.0, box.max.y - box.min.y);
    this.touchdownRocketY = Math.abs(this.rocketLocalMinY) + this.GROUND_Y;

    this.rocket.position.copy(prevPos);
  }

  /* =========================================================================
   * 4. LAUNCH API & TIMELINE STORYBOARD
   * ========================================================================= */

  startLaunch(options = {}) {
    if (typeof options === "function") {
      this.onCompleteCallback = options;
    } else if (options && typeof options === "object") {
      if (options.onComplete) this.onCompleteCallback = options.onComplete;
      if (options.destinationId) this.destinationId = options.destinationId;
    }

    // Reset all scene rigs strictly to Earth Launch Pad state
    this.hasRecordedVisit = false;
    this.hasShownTowerClear = false;
    this.hasTriggeredFlightEvent = false;
    this.timelineElapsed = 0;

    if (this.launchPadGroup) this.launchPadGroup.visible = true;
    if (this.cloudsGroup) this.cloudsGroup.visible = true;
    if (this.earthGroup) {
      this.earthGroup.visible = false;
      this.earthGroup.position.set(0, -32, -45);
    }
    if (this.surfaceGroup) this.surfaceGroup.visible = false;
    if (this.destinationGroup) {
      this.destinationGroup.visible = false;
      this.destinationGroup.position.set(0, 0, -140);
    }
    if (this.rocket) {
      this.rocket.position.set(0, 0, 0);
      this.rocket.rotation.set(0, 0, 0);
    }
    if (this.engineVfx) {
      this.engineVfx.setVisible(false);
      this.engineVfx.setThrottle(0);
    }
    if (this.warpVfx) {
      this.warpVfx.setWarpIntensity(0, true);
    }

    this.enterCinematicMode();
    document.getElementById("launch-checklist")?.classList.add("hidden");
    const box = document.getElementById("launch-countdown-box");
    if (box) box.classList.remove("hidden");

    this.currentStage = "countdown";
    this.countdownValue = 5;
    this.hasSkippedCountdown = false;
    const numEl = document.getElementById("countdown-num");
    if (numEl) numEl.innerText = "5";

    // Shot 1: Hero Pad Track
    this.cameraDirector.playShot({
      id: "shot1_hero_pad",
      fromPosition: { x: 4.5, y: 1.2, z: 9.5 },
      toPosition: { x: 3.5, y: 1.8, z: 8.5 },
      fromTarget: { x: 0, y: 2.5, z: 0 },
      toTarget: { x: 0, y: 3.0, z: 0 },
      duration: 2.0,
      easing: "easeInOutCubic"
    });

    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      this.countdownValue--;
      if (numEl) numEl.innerText = String(this.countdownValue);

      if (this.countdownValue === 3) {
        // Shot 2: Engine Ignition Prep
        this.cameraDirector.playShot({
          id: "shot2_engine_closeup",
          fromPosition: { x: 1.8, y: -0.2, z: 3.2 },
          toPosition: { x: 1.4, y: 0.1, z: 2.8 },
          fromTarget: { x: 0, y: -0.5, z: 0 },
          toTarget: { x: 0, y: -0.4, z: 0 },
          duration: 2.0,
          easing: "easeOutQuart",
          shake: 0.05
        });
      }

      if (this.countdownValue <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        if (numEl) numEl.innerText = "IGNITION";
        this.triggerIgnition();
      }
    }, 1000);
  }

  // Canonical Alias for Backwards Compatibility
  startLaunchSequence(...args) {
    if (typeof args[0] === "function") {
      return this.startLaunch({ onComplete: args[0] });
    } else if (typeof args[0] === "object") {
      return this.startLaunch(args[0]);
    }
    return this.startLaunch();
  }

  skipCountdown() {
    if (this.hasSkippedCountdown || this.currentStage !== "countdown") return;
    this.hasSkippedCountdown = true;
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.countdownValue = 0;
    const numEl = document.getElementById("countdown-num");
    if (numEl) numEl.innerText = "IGNITION";
    this.triggerIgnition();
  }

  triggerIgnition() {
    this.currentStage = "ignition";
    this.timelineElapsed = 0;

    const box = document.getElementById("launch-countdown-box");
    if (box) box.classList.add("hidden");

    if (window.audioManager) {
      window.audioManager.startEngineLoop();
      window.audioManager.setEngineThrottle(0.85);
    }

    if (this.engineVfx) {
      this.engineVfx.setVisible(true);
      this.engineVfx.setEnvironmentMode("atmosphere", 0);
      this.engineVfx.setThrottle(0.85);
    }
    if (this.engineLight) this.engineLight.intensity = 4.0;

    // Shot 3: Ignition Horizontal Blast
    this.cameraDirector.playShot({
      id: "shot3_ignition",
      fromPosition: { x: -3.5, y: 0.5, z: 7.0 },
      toPosition: { x: -4.0, y: 0.8, z: 8.0 },
      fromTarget: { x: 0, y: 1.0, z: 0 },
      toTarget: { x: 0, y: 1.5, z: 0 },
      duration: (CONFIG.CINEMATIC_TIMING && CONFIG.CINEMATIC_TIMING.ignition) || 2.0,
      easing: "easeInOutQuad",
      shake: 0.35
    });

    if (this.particleSystem) {
      this.particleSystem.emitIgnitionSmoke(0, -0.5, 0, 35);
    }

    const ignDuration = ((CONFIG.CINEMATIC_TIMING && CONFIG.CINEMATIC_TIMING.ignition) || 2.0) * 1000;
    this.scheduleTimeout(() => {
      this.liftoff();
    }, ignDuration);
  }

  liftoff() {
    this.currentStage = "liftoff";
    this.timelineElapsed = 0;

    if (window.audioManager) {
      window.audioManager.setEngineThrottle(1.0);
      window.audioManager.playAtmosphereRush();
    }
    if (this.engineVfx) this.engineVfx.setThrottle(1.0);

    // Shot 4: Tower Clear Shot
    this.cameraDirector.playShot({
      id: "shot4_tower_clear",
      fromPosition: { x: -2.0, y: -0.2, z: 4.5 },
      toPosition: { x: -2.0, y: 0.5, z: 5.5 },
      fromTarget: { x: 0, y: 3.0, z: 0 },
      toTarget: { x: 0, y: 18.0, z: 0 },
      duration: (CONFIG.CINEMATIC_TIMING && CONFIG.CINEMATIC_TIMING.liftoff) || 4.0,
      easing: "easeInOutCubic",
      shake: 0.2
    });
  }

  /* =========================================================================
   * 5. MAIN TIMELINE UPDATE & IN-FLIGHT EVENTS
   * ========================================================================= */

  updateTimeline(dt) {
    if (this.isEventPaused || this.currentStage === "idle" || this.currentStage === "countdown") return;

    this.timelineElapsed += dt;

    // 1. LIFTOFF STAGE (0 to 4s)
    if (this.currentStage === "liftoff") {
      const dur = (CONFIG.CINEMATIC_TIMING && CONFIG.CINEMATIC_TIMING.liftoff) || 4.0;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      this.rocket.position.y = prog * prog * 50;

      if (this.particleSystem) {
        this.particleSystem.emitFlightTrail(this.rocket.position, 2);
      }

      if (prog >= 0.45 && !this.hasShownTowerClear) {
        this.hasShownTowerClear = true;
        this.showMilestoneBanner("🚀 TOWER CLEAR");
      }

      if (prog >= 1.0) {
        this.currentStage = "atmospheric";
        this.timelineElapsed = 0;
        this.cameraDirector.playShot({
          id: "shot5_cloud_tracking",
          fromPosition: { x: 12.0, y: 65, z: 12.0 },
          toPosition: { x: 8.0, y: 95, z: 8.0 },
          fromTarget: { x: 0, y: 65, z: 0 },
          toTarget: { x: 0, y: 110, z: 0 },
          duration: (CONFIG.CINEMATIC_TIMING && CONFIG.CINEMATIC_TIMING.atmosphere) || 4.5,
          easing: "easeOutQuart",
          shake: 0.15
        });
      }
    }

    // 2. ATMOSPHERIC ASCENT & CLOUD PUNCH-THROUGH
    else if (this.currentStage === "atmospheric") {
      const dur = (CONFIG.CINEMATIC_TIMING && CONFIG.CINEMATIC_TIMING.atmosphere) || 4.5;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      this.rocket.position.y = 50 + prog * 70;
      this.rocket.rotation.z = -prog * 0.22;

      if (this.engineVfx) {
        this.engineVfx.setEnvironmentMode("atmosphere", prog * 0.5);
      }

      if (this.rocket.position.y > 60 && this.launchPadGroup && this.launchPadGroup.visible) {
        this.launchPadGroup.visible = false;
      }

      if (prog >= 1.0) {
        this.currentStage = "earthOrbit";
        this.timelineElapsed = 0;
        if (this.cloudsGroup) this.cloudsGroup.visible = false;
        if (this.earthGroup) this.earthGroup.visible = true;

        this.rocket.position.set(0, 0, 0);
        this.rocket.rotation.set(0, 0, 0);

        if (window.audioManager) {
          window.audioManager.setEngineThrottle(0.2);
          window.audioManager.playStageStinger("orbit");
        }
        if (this.engineVfx) {
          this.engineVfx.setEnvironmentMode("vacuum", 0.8);
          this.engineVfx.setThrottle(0.2);
        }

        this.showMilestoneBanner("🌍 ORBIT ACHIEVED");

        this.cameraDirector.playShot({
          id: "shot7_orbital_reveal",
          fromPosition: { x: -4.0, y: 1.0, z: 7.5 },
          toPosition: { x: 5.5, y: 0.5, z: 8.0 },
          fromTarget: { x: 0, y: 0, z: 0 },
          toTarget: { x: 0, y: -0.5, z: 0 },
          duration: (CONFIG.CINEMATIC_TIMING && CONFIG.CINEMATIC_TIMING.earthOrbit) || 3.0,
          easing: "easeInOutCubic"
        });
      }
    }

    // 3. EARTH ORBIT INSERTION
    else if (this.currentStage === "earthOrbit") {
      const dur = (CONFIG.CINEMATIC_TIMING && CONFIG.CINEMATIC_TIMING.earthOrbit) || 3.0;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      if (this.earthGroup) {
        this.earthGroup.rotation.y += 0.02 * dt;
        if (this.earthGroup.userData?.cloudMesh) {
          this.earthGroup.userData.cloudMesh.rotation.y += 0.035 * dt;
        }
      }

      if (prog >= 1.0) {
        if (this.destinationId === "earthOrbit") {
          this.currentStage = "destinationAction";
          this.timelineElapsed = 0;
        } else {
          this.currentStage = "transfer";
          this.timelineElapsed = 0;
          this.startTransferBurn();
        }
      }
    }

    // 4. INTERPLANETARY TRANSFER BURN & WARP STREAKS
    else if (this.currentStage === "transfer") {
      const destCfg = CONFIG.DESTINATIONS[this.destinationId] || CONFIG.DESTINATIONS.moon;
      const dur = destCfg.cinematic?.transferSeconds || 5.0;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      // Dynamic In-Flight Event Trigger at midpoint (50% progress)
      if (prog >= 0.5 && !this.hasTriggeredFlightEvent) {
        this.hasTriggeredFlightEvent = true;
        this.triggerInFlightEvent();
        return;
      }

      if (this.warpVfx) {
        this.warpVfx.setWarpIntensity(Math.sin(prog * Math.PI));
        this.warpVfx.update(dt, this.rocket.position);
      }

      if (this.earthGroup && this.earthGroup.visible) {
        this.earthGroup.position.z -= 40 * dt;
        if (this.earthGroup.position.z < -250) this.earthGroup.visible = false;
      }

      // Smooth Destination Planet Approach Transition
      if (prog > 0.4 && this.destinationGroup) {
        this.destinationGroup.visible = true;
        this.destinationGroup.position.z = -140 + prog * 40; // smoothly approaches -100
      }

      if (prog >= 1.0) {
        this.currentStage = "destinationApproach";
        this.timelineElapsed = 0;
        if (this.warpVfx) this.warpVfx.setWarpIntensity(0, true);
        if (this.destinationGroup) this.destinationGroup.visible = true;

        if (window.audioManager) {
          window.audioManager.setEngineThrottle(0.6);
          window.audioManager.playStageStinger("approach");
        }

        this.showMilestoneBanner("🪐 DESTINATION LOCKED");

        this.cameraDirector.playShot({
          id: "shot_approach",
          fromPosition: { x: 3.5, y: 1.2, z: 8.0 },
          toPosition: { x: -3.0, y: 0.8, z: 7.0 },
          fromTarget: { x: 0, y: 0, z: 0 },
          toTarget: { x: 0, y: 0, z: 0 },
          duration: destCfg.cinematic?.approachSeconds || 4.5,
          easing: "easeInOutCubic"
        });
      }
    }

    // 5. PLANET APPROACH (Smooth continuation without backward pop)
    else if (this.currentStage === "destinationApproach") {
      const destCfg = CONFIG.DESTINATIONS[this.destinationId] || CONFIG.DESTINATIONS.moon;
      const dur = destCfg.cinematic?.approachSeconds || 4.5;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      if (this.destinationGroup) {
        const startZ = -100;
        const endZ = -38;
        this.destinationGroup.position.z = startZ + (endZ - startZ) * CinematicCameraDirector.easeOutQuart(prog);
        this.destinationGroup.rotation.y += 0.015 * dt;
      }

      if (prog >= 1.0) {
        const isLanding = destCfg.type === "landing";
        if (isLanding) {
          this.transitionToSurfaceScene();
        } else {
          this.currentStage = "destinationAction";
          this.timelineElapsed = 0;
        }
      }
    }

    // 6. DESTINATION CLIMAX ACTION
    else if (this.currentStage === "destinationAction") {
      if (this.destinationId === "earthOrbit") {
        this.updateEarthOrbitAction(dt);
      } else if (this.destinationId === "jupiter") {
        this.updateJupiterAction(dt);
      } else if (this.destinationId === "saturn") {
        this.updateSaturnAction(dt);
      } else if (this.destinationId === "deepSpace") {
        this.updateDeepSpaceAction(dt);
      } else {
        // Planetary Surface Landings (Moon & Mars)
        this.updateLandingSystem(dt);
      }
    }
  }

  startTransferBurn() {
    if (window.audioManager) {
      window.audioManager.setEngineThrottle(1.0);
      window.audioManager.playWarpWhoosh();
    }
    if (this.engineVfx) {
      this.engineVfx.setEnvironmentMode("hyper", 1.0);
      this.engineVfx.setThrottle(1.0);
    }
    this.showMilestoneBanner("⚡ TRANSFER BURN");

    this.cameraDirector.playShot({
      id: "shot_warp_burn",
      fromPosition: { x: 0, y: 0.5, z: 6.5 },
      toPosition: { x: 0, y: 0.2, z: 4.8 },
      fromTarget: { x: 0, y: 0, z: -10 },
      toTarget: { x: 0, y: 0, z: -10 },
      duration: 4.5,
      easing: "easeInOutCubic",
      fovFrom: 50,
      fovTo: 68,
      shake: 0.18
    });
  }

  /* =========================================================================
   * 6. IN-FLIGHT EVENTS WITH 3D VISUAL EFFECTS
   * ========================================================================= */

  triggerInFlightEvent() {
    this.isEventPaused = true;

    // Create 3D Event Visual Effects (Flying Asteroids & Warning Light)
    if (typeof THREE !== "undefined") {
      const astGeo = new THREE.DodecahedronGeometry(0.8, 0);
      const astMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
      for (let i = 0; i < 5; i++) {
        const ast = new THREE.Mesh(astGeo, astMat);
        ast.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, -10 + i * 4);
        this.fxRig.add(ast);
        this.event3DMeshes.push(ast);
      }
    }

    const eventDef = {
      titleEn: "⚠️ ASTEROID DRIFT ENCOUNTER",
      titleZh: "⚠️ 遭遇微行星引力扰动！",
      descEn: "Recalibrate trajectory vector by solving math problem!",
      descZh: "解算航向补正题，消除轨道漂移！",
      bonusXP: 35
    };

    if (window.uiManager && typeof window.uiManager.showFlightEvent === "function") {
      window.uiManager.showFlightEvent(eventDef, () => {
        this.resolveInFlightEvent();
      });
    } else {
      this.scheduleTimeout(() => this.resolveInFlightEvent(), 2000);
    }
  }

  resolveInFlightEvent() {
    this.event3DMeshes.forEach(mesh => {
      if (mesh && mesh.parent) mesh.parent.remove(mesh);
    });
    this.event3DMeshes = [];

    this.showMilestoneBanner("✨ SYSTEM STABILIZED");
    this.isEventPaused = false;
  }

  /* =========================================================================
   * 7. DESTINATION-SPECIFIC CLIMAX HANDLERS
   * ========================================================================= */

  /**
   * Earth Orbit (7~9s): Orbit coast, payload deployment, solar panel unfold, Earth hero shot
   */
  updateEarthOrbitAction(dt) {
    const dur = 8.0;
    const prog = Math.min(1.0, this.timelineElapsed / dur);

    if (this.earthGroup) this.earthGroup.rotation.y += 0.015 * dt;

    if (prog >= 0.25 && !this.payloadState.deploying && !this.payloadState.deployed) {
      this.deployMissionPayload("satellite");
    }
    this.updatePayloadAnimator(dt);

    if (prog >= 1.0 && !this.hasRecordedVisit) {
      this.finishMissionSuccess();
    }
  }

  /**
   * Jupiter Flyby (8~11s): Giant Jovian bands, Io & Europa moon parallax, Great Red Spot skim, probe scan
   */
  updateJupiterAction(dt) {
    const dur = 9.5;
    const prog = Math.min(1.0, this.timelineElapsed / dur);

    if (this.destinationGroup) {
      this.destinationGroup.rotation.y += 0.02 * dt;
      // Moon orbital parallax
      if (this.destinationGroup.userData?.ioMoon) {
        this.destinationGroup.userData.ioMoon.position.x = 20 * Math.cos(prog * Math.PI * 1.5);
        this.destinationGroup.userData.ioMoon.position.z = 12 * Math.sin(prog * Math.PI * 1.5);
      }
      if (this.destinationGroup.userData?.europaMoon) {
        this.destinationGroup.userData.europaMoon.position.x = -24 * Math.cos(prog * Math.PI * 1.2);
        this.destinationGroup.userData.europaMoon.position.z = 16 * Math.sin(prog * Math.PI * 1.2);
      }
    }

    // Rocket banks dynamically over Jovian cloud bands
    this.rocket.rotation.z = Math.sin(prog * Math.PI) * 0.35;

    if (prog >= 0.3 && !this.payloadState.deploying && !this.payloadState.deployed) {
      this.deployMissionPayload("probe");
    }
    this.updatePayloadAnimator(dt);

    if (prog >= 1.0 && !this.hasRecordedVisit) {
      this.finishMissionSuccess();
    }
  }

  /**
   * Saturn Ring Orbit (9~12s): Ring plane dive, 30° roll across Cassini Division, ice streaks, wide hero
   */
  updateSaturnAction(dt) {
    const dur = 10.5;
    const prog = Math.min(1.0, this.timelineElapsed / dur);

    if (this.destinationGroup) {
      this.destinationGroup.rotation.y += 0.012 * dt;
    }

    // Dynamic Rocket Bank & Ring Plane alignment
    this.rocket.rotation.z = Math.sin(prog * Math.PI) * 0.45;

    if (prog >= 0.3 && !this.payloadState.deploying && !this.payloadState.deployed) {
      this.deployMissionPayload("probe");
    }
    this.updatePayloadAnimator(dt);

    if (prog >= 1.0 && !this.hasRecordedVisit) {
      this.finishMissionSuccess();
    }
  }

  /**
   * Deep Space Discovery (9~12s): Warp collapse, nebula reveal, ancient beacon relic scan
   */
  updateDeepSpaceAction(dt) {
    const dur = 10.0;
    const prog = Math.min(1.0, this.timelineElapsed / dur);

    if (this.destinationGroup) {
      this.destinationGroup.rotation.y += 0.025 * dt;
      if (this.destinationGroup.userData?.relicMesh) {
        this.destinationGroup.userData.relicMesh.rotation.x += 0.04 * dt;
        this.destinationGroup.userData.relicMesh.rotation.y += 0.06 * dt;
      }
    }

    if (prog >= 0.35 && !this.payloadState.deploying && !this.payloadState.deployed) {
      this.deployMissionPayload("probe");
    }
    this.updatePayloadAnimator(dt);

    if (prog >= 1.0 && !this.hasRecordedVisit) {
      this.finishMissionSuccess();
    }
  }

  /* =========================================================================
   * 8. PROCEDURAL PLANETARY TERRAIN & 4-PHASE LANDING
   * ========================================================================= */

  transitionToSurfaceScene() {
    if (this.launchPadGroup) this.launchPadGroup.visible = false;
    if (this.cloudsGroup) this.cloudsGroup.visible = false;
    if (this.destinationGroup) this.destinationGroup.visible = false;

    this.createPlanetaryTerrain(this.destinationId);
    if (this.terrainMesh) this.terrainMesh.visible = true;

    this.calculateRocketDimensions();
    this.rocket.position.set(0, 32, 0);
    this.rocket.rotation.set(0, 0, 0);

    if (this.engineVfx) {
      this.engineVfx.setVisible(true);
      this.engineVfx.setEnvironmentMode("atmosphere", 0.2);
      this.engineVfx.setThrottle(0.8);
    }
    if (window.audioManager) window.audioManager.setEngineThrottle(0.8);

    this.currentStage = "destinationAction";
    this.landingPhase = "highDescent";
    this.timelineElapsed = 0;
    this.landingPhaseElapsed = 0;

    this.showMilestoneBanner("🛬 RETRO-PROPULSION BURN");

    // Shot A: High Descent Wide Shot
    this.cameraDirector.playShot({
      id: "shot_landing_descent",
      fromPosition: { x: 12, y: 18, z: 20 },
      toPosition: { x: 8, y: 6, z: 14 },
      fromTarget: { x: 0, y: 15, z: 0 },
      toTarget: { x: 0, y: 4, z: 0 },
      duration: 3.8,
      easing: "easeInOutCubic"
    });
  }

  createLandingSurface(destId) {
    return this.createPlanetaryTerrain(destId);
  }

  createPlanetaryTerrain(destId) {
    if (typeof THREE === "undefined") return;

    if (this.surfaceGroup) {
      this.environmentRig.remove(this.surfaceGroup);
      this.disposeObject3D(this.surfaceGroup);
      this.surfaceGroup = null;
    }

    this.surfaceGroup = new THREE.Group();
    this.surfaceGroup.position.set(0, 0, 0);

    const isMars = destId === "mars";
    const surfaceColor = isMars ? 0x991b1b : 0x475569;

    // Displaced PlaneGeometry for Rugged Uneven Terrain
    const terrainGeo = new THREE.PlaneGeometry(100, 100, 40, 40);
    terrainGeo.rotateX(-Math.PI / 2);

    if (terrainGeo.attributes && terrainGeo.attributes.position) {
      const pos = terrainGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const distFromCenter = Math.sqrt(x * x + z * z);
        // Flatter at landing center, rugged dunes/craters outside
        const roughness = Math.min(1.0, distFromCenter / 15.0);
        const elevation = (Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1.8 + Math.sin(x * 0.35 + z * 0.2) * 0.8) * roughness;
        pos.setY(i, this.GROUND_Y + elevation);
      }
      pos.needsUpdate = true;
      if (typeof terrainGeo.computeVertexNormals === "function") terrainGeo.computeVertexNormals();
    }

    const terrainMat = new THREE.MeshStandardMaterial({
      color: surfaceColor,
      roughness: 0.92,
      metalness: 0.08
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.surfaceGroup.add(this.terrainMesh);

    // Contact Landing Shadow
    const shadowGeo = new THREE.CircleGeometry(2.2, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.position.set(0, this.GROUND_Y + 0.02, 0);
    this.surfaceGroup.add(this.contactShadow);

    this.environmentRig.add(this.surfaceGroup);
  }

  emitRadialDust(altitudeOrPos, dustColor = 0xd1d5db) {
    let alt = typeof altitudeOrPos === "number" ? altitudeOrPos : (altitudeOrPos?.y || 0);
    if (alt > 8.0) return;
    if (this.particleSystem) {
      const pos = typeof altitudeOrPos === "object" ? altitudeOrPos : (this.rocket ? this.rocket.position : { x: 0, y: alt, z: 0 });
      const isMars = this.destinationId === "mars";
      this.particleSystem.emitLandingDust(pos, isMars ? 0x991b1b : dustColor, 6);
    }
  }

  updateLandingSystem(dt) {
    this.landingPhaseElapsed += dt;

    // Phase A: High Descent (32m -> 14m, 2.0s)
    if (this.landingPhase === "highDescent") {
      const dur = 2.0;
      const prog = Math.min(1.0, this.landingPhaseElapsed / dur);
      this.rocket.position.y = 32 - prog * 18;
      this.currentVerticalSpeed = 9.0;

      if (prog >= 1.0) {
        this.landingPhase = "retroBurn";
        this.landingPhaseElapsed = 0;
      }
    }

    // Phase B: Retro Burn (14m -> 5m, 1.8s)
    else if (this.landingPhase === "retroBurn") {
      const dur = 1.8;
      const prog = Math.min(1.0, this.landingPhaseElapsed / dur);
      this.rocket.position.y = 14 - prog * 9;
      this.currentVerticalSpeed = 5.0;

      // Shot B: Engine Close-up & Surface Dust
      if (prog >= 0.6 && this.cameraDirector.currentShot?.id !== "shot_engine_dust") {
        this.cameraDirector.playShot({
          id: "shot_engine_dust",
          fromPosition: { x: 3.5, y: 1.0, z: 4.5 },
          toPosition: { x: 3.0, y: 0.8, z: 4.0 },
          fromTarget: { x: 0, y: 1.0, z: 0 },
          toTarget: { x: 0, y: 0.5, z: 0 },
          duration: 2.2,
          easing: "easeOutQuart",
          shake: 0.12
        });
      }

      if (prog >= 1.0) {
        this.landingPhase = "finalDescent";
        this.landingPhaseElapsed = 0;
      }
    }

    // Phase C: Final Descent & Landing Leg Contact (5m -> Touchdown Y, 1.6s)
    else if (this.landingPhase === "finalDescent") {
      const dur = 1.6;
      const prog = Math.min(1.0, this.landingPhaseElapsed / dur);
      this.rocket.position.y = 5.0 - prog * (5.0 - this.touchdownRocketY);
      this.currentVerticalSpeed = Math.max(0.2, (1.0 - prog) * 3.0);

      const th = Math.max(0, 0.7 * (1.0 - prog));
      if (this.engineVfx) this.engineVfx.setThrottle(th);
      if (window.audioManager) window.audioManager.setEngineThrottle(th);

      if (this.particleSystem && prog > 0.3) {
        const isMars = this.destinationId === "mars";
        this.particleSystem.emitLandingDust(this.rocket.position, isMars ? 0x991b1b : 0xd1d5db, 4);
      }

      if (this.contactShadow) {
        this.contactShadow.material.opacity = prog * 0.75;
      }

      if (prog >= 1.0) {
        this.landingPhase = "touchdownHold";
        this.landingPhaseElapsed = 0;
        this.rocket.position.y = this.touchdownRocketY;
        this.currentVerticalSpeed = 0;

        // Cut engine flame completely
        if (this.engineVfx) this.engineVfx.setVisible(false);
        if (this.flameMesh) this.flameMesh.visible = false;
        if (this.engineLight) this.engineLight.intensity = 0;
        if (window.audioManager) {
          window.audioManager.stopEngineLoop();
          window.audioManager.playTouchdownThump();
        }

        const bannerTitle = (this.destinationId === "mars") ? "🔴 MARS SURFACE MISSION COMPLETE" : "🌙 TOUCHDOWN CONFIRMED";
        this.showMilestoneBanner(bannerTitle);

        // Shot D: Touchdown Low-Angle Hero Orbit
        this.cameraDirector.playShot({
          id: "shot_touchdown_hero",
          fromPosition: { x: 5.5, y: 1.5, z: 8.5 },
          toPosition: { x: -6.0, y: 2.2, z: 9.0 },
          fromTarget: { x: 0, y: 2.5, z: 0 },
          toTarget: { x: 0, y: 2.5, z: 0 },
          duration: 3.8,
          easing: "easeInOutCubic"
        });

        // Deploy Payload during hold
        this.scheduleTimeout(() => {
          this.deployMissionPayload("rover");
        }, 1000);
      }
    }

    // Phase D: Extended Touchdown Hold (3.8s celebration before mission complete)
    else if (this.landingPhase === "touchdownHold") {
      this.updatePayloadAnimator(dt);
      const dur = 3.8;
      if (this.landingPhaseElapsed >= dur && !this.hasRecordedVisit) {
        this.finishMissionSuccess();
      }
    }
  }

  /* =========================================================================
   * 9. DELTATIME FRAME-BASED PAYLOAD ANIMATOR
   * ========================================================================= */

  deployMissionPayload(payloadType = "satellite") {
    if (this.payloadState.deploying || this.payloadState.deployed) return;
    this.payloadState.deploying = true;
    this.payloadState.elapsed = 0;

    if (!this.payloadMesh) {
      this.payloadMesh = this.rocket?.getObjectByName("payload_mesh") || null;
    }

    if (this.payloadMesh && typeof THREE !== "undefined") {
      const worldPos = new THREE.Vector3();
      this.payloadMesh.getWorldPosition(worldPos);
      if (this.payloadMesh.parent) this.payloadMesh.parent.remove(this.payloadMesh);
      this.scene.add(this.payloadMesh);
      this.payloadMesh.position.copy(worldPos);
    }
  }

  updatePayloadAnimator(dt) {
    if (!this.payloadState.deploying || !this.payloadMesh) return;

    this.payloadState.elapsed += dt;
    const el = this.payloadState.elapsed;
    const isLanding = CONFIG.DESTINATIONS[this.destinationId]?.type === "landing";

    if (isLanding) {
      // Rover rolls forward and lowers onto surface
      const prog = Math.min(1.0, el / 2.8);
      this.payloadMesh.position.z += 1.8 * dt;
      this.payloadMesh.position.y = this.GROUND_Y + 0.35;
      this.payloadMesh.rotation.y += 0.05 * dt;
      if (prog >= 1.0) {
        this.payloadState.deploying = false;
        this.payloadState.deployed = true;
      }
    } else {
      // Satellite / Probe drifts into orbit and unfolds
      const prog = Math.min(1.0, el / 3.2);
      this.payloadMesh.position.y += 0.8 * dt;
      this.payloadMesh.rotation.y += 0.25 * dt;
      if (prog >= 1.0) {
        this.payloadState.deploying = false;
        this.payloadState.deployed = true;
      }
    }
  }

  showMilestoneBanner(text) {
    const banner = document.getElementById("launch-stage-banner");
    if (!banner) return;
    banner.innerText = text;
    banner.classList.remove("hidden");
    banner.classList.remove("banner-pop");
    void banner.offsetWidth;
    banner.classList.add("banner-pop");

    this.scheduleTimeout(() => {
      banner.classList.add("hidden");
    }, 2400);
  }

  /* =========================================================================
   * 10. VICTORY CELEBRATION & DEBRIEF
   * ========================================================================= */

  finishMissionSuccess() {
    if (this.hasRecordedVisit) return;
    this.hasRecordedVisit = true;
    this.currentStage = "missionComplete";

    if (window.audioManager) {
      window.audioManager.stopEngineLoop();
      window.audioManager.playVictoryFanfare();
    }

    const victoryBanner = document.getElementById("space-victory-banner");
    const victoryTitle = document.getElementById("victory-title-text");
    if (victoryBanner) {
      const titles = {
        moon: "🌙 TOUCHDOWN CONFIRMED — LUNAR BASE SECURED! 🚀",
        mars: "🔴 MARS SURFACE MISSION COMPLETE! 🚩",
        jupiter: "🪐 JOVIAN SCIENCE PASS COMPLETE! 🛰️",
        saturn: "💍 SATURN RING ORBIT ACHIEVED! 💎",
        deepSpace: "🌌 UNKNOWN DEEP SPACE SIGNAL ACQUIRED! 📡",
        earthOrbit: "🌍 ORBITAL DEPLOYMENT SUCCESSFUL! 🛰️"
      };
      if (victoryTitle) victoryTitle.innerText = titles[this.destinationId] || "MISSION SUCCESS! ARRIVED AT DESTINATION! 🌌";
      victoryBanner.classList.remove("hidden");
    }

    if (window.game && typeof window.game.handleMissionCompleted === "function") {
      window.game.handleMissionCompleted(this.destinationId);
    }
    if (typeof this.onCompleteCallback === "function") {
      this.onCompleteCallback(this.destinationId);
    }
  }

  replayLanding() {
    this.hasRecordedVisit = false;
    this.transitionToSurfaceScene();
    if (this.flameMesh) this.flameMesh.visible = true;
    if (this.engineVfx) {
      this.engineVfx.setVisible(true);
      this.engineVfx.setThrottle(0.8);
    }
  }

  jumpToStage(stageName, destId = "moon", containerId = "canvas-container-launch") {
    this.initScene(containerId, destId);
    document.getElementById("launch-checklist")?.classList.add("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");
    document.getElementById("space-victory-banner")?.classList.add("hidden");
    document.getElementById("launch-stage-banner")?.classList.add("hidden");

    this.hasRecordedVisit = false;
    this.hasShownTowerClear = false;
    this.hasTriggeredFlightEvent = false;
    this.timelineElapsed = 0;

    if (stageName === "pad" || stageName === "idle") {
      this.currentStage = "idle";
      if (this.launchPadGroup) this.launchPadGroup.visible = true;
      if (this.cloudsGroup) this.cloudsGroup.visible = true;
      if (this.destinationGroup) this.destinationGroup.visible = false;
      if (this.earthGroup) this.earthGroup.visible = false;
      if (this.surfaceGroup) this.surfaceGroup.visible = false;
      if (this.rocket) {
        this.rocket.position.set(0, 0, 0);
        this.rocket.rotation.set(0, 0, 0);
      }
      if (this.engineVfx) this.engineVfx.setVisible(false);
      if (this.warpVfx) this.warpVfx.setWarpIntensity(0, true);
      this.cameraDirector.playShot({
        id: "shot1_hero_pad",
        fromPosition: { x: 4.5, y: 1.2, z: 9.5 },
        toPosition: { x: 3.5, y: 1.8, z: 8.5 },
        fromTarget: { x: 0, y: 2.5, z: 0 },
        toTarget: { x: 0, y: 3.0, z: 0 },
        duration: 2.0,
        easing: "easeInOutCubic"
      });
    } else if (stageName === "countdown") {
      this.startLaunch({ destinationId: destId });
    } else if (stageName === "ignition") {
      this.currentStage = "ignition";
      if (this.launchPadGroup) this.launchPadGroup.visible = true;
      if (this.cloudsGroup) this.cloudsGroup.visible = true;
      if (this.destinationGroup) this.destinationGroup.visible = false;
      if (this.earthGroup) this.earthGroup.visible = false;
      if (this.surfaceGroup) this.surfaceGroup.visible = false;
      if (this.rocket) {
        this.rocket.position.set(0, 0, 0);
        this.rocket.rotation.set(0, 0, 0);
      }
      if (this.warpVfx) this.warpVfx.setWarpIntensity(0, true);
      this.triggerIgnition();
    } else if (stageName === "liftoff") {
      this.currentStage = "liftoff";
      this.timelineElapsed = 0;
      if (this.launchPadGroup) this.launchPadGroup.visible = true;
      if (this.cloudsGroup) this.cloudsGroup.visible = true;
      if (this.destinationGroup) this.destinationGroup.visible = false;
      if (this.earthGroup) this.earthGroup.visible = false;
      if (this.surfaceGroup) this.surfaceGroup.visible = false;
      if (this.rocket) {
        this.rocket.position.set(0, 0, 0);
        this.rocket.rotation.set(0, 0, 0);
      }
      if (this.warpVfx) this.warpVfx.setWarpIntensity(0, true);
      this.liftoff();
    } else if (stageName === "atmospheric") {
      this.currentStage = "atmospheric";
      this.timelineElapsed = 0;
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = true;
      if (this.destinationGroup) this.destinationGroup.visible = false;
      if (this.earthGroup) this.earthGroup.visible = false;
      if (this.surfaceGroup) this.surfaceGroup.visible = false;
      if (this.rocket) {
        this.rocket.position.set(0, 50, 0);
        this.rocket.rotation.set(0, 0, -0.15);
      }
      if (this.engineVfx) {
        this.engineVfx.setVisible(true);
        this.engineVfx.setEnvironmentMode("atmosphere", 0.5);
        this.engineVfx.setThrottle(1.0);
      }
      if (this.warpVfx) this.warpVfx.setWarpIntensity(0, true);
      this.cameraDirector.playShot({
        id: "shot5_cloud_tracking",
        fromPosition: { x: 12.0, y: 65, z: 12.0 },
        toPosition: { x: 8.0, y: 95, z: 8.0 },
        fromTarget: { x: 0, y: 65, z: 0 },
        toTarget: { x: 0, y: 110, z: 0 },
        duration: 4.5,
        easing: "easeOutQuart",
        shake: 0.15
      });
    } else if (stageName === "earthOrbit") {
      this.currentStage = "earthOrbit";
      this.timelineElapsed = 0;
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = false;
      if (this.destinationGroup) this.destinationGroup.visible = false;
      if (this.earthGroup) {
        this.earthGroup.visible = true;
        this.earthGroup.position.set(0, -32, -45);
      }
      if (this.surfaceGroup) this.surfaceGroup.visible = false;
      if (this.rocket) {
        this.rocket.position.set(0, 0, 0);
        this.rocket.rotation.set(0, 0, 0);
      }
      if (this.engineVfx) {
        this.engineVfx.setVisible(true);
        this.engineVfx.setEnvironmentMode("vacuum", 0.8);
        this.engineVfx.setThrottle(0.2);
      }
      if (this.warpVfx) this.warpVfx.setWarpIntensity(0, true);
      this.cameraDirector.playShot({
        id: "shot7_orbital_reveal",
        fromPosition: { x: -4.0, y: 1.0, z: 7.5 },
        toPosition: { x: 5.5, y: 0.5, z: 8.0 },
        fromTarget: { x: 0, y: 0, z: 0 },
        toTarget: { x: 0, y: -0.5, z: 0 },
        duration: 3.5,
        easing: "easeInOutCubic"
      });
    } else if (stageName === "transfer") {
      this.currentStage = "transfer";
      this.timelineElapsed = 0;
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = false;
      if (this.earthGroup) {
        this.earthGroup.visible = true;
        this.earthGroup.position.set(0, -32, -45);
      }
      if (this.destinationGroup) {
        this.destinationGroup.visible = true;
        this.destinationGroup.position.set(0, 0, -140);
      }
      if (this.surfaceGroup) this.surfaceGroup.visible = false;
      if (this.rocket) {
        this.rocket.position.set(0, 0, 0);
        this.rocket.rotation.set(0, 0, 0);
      }
      this.startTransferBurn();
    } else if (stageName === "destinationApproach" || stageName === "approach") {
      this.currentStage = "destinationApproach";
      this.timelineElapsed = 0;
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = false;
      if (this.earthGroup) this.earthGroup.visible = false;
      if (this.destinationGroup) {
        this.destinationGroup.visible = true;
        this.destinationGroup.position.set(0, 0, -100);
      }
      if (this.surfaceGroup) this.surfaceGroup.visible = false;
      if (this.rocket) {
        this.rocket.position.set(0, 0, 0);
        this.rocket.rotation.set(0, 0, 0);
      }
      if (this.engineVfx) {
        this.engineVfx.setVisible(true);
        this.engineVfx.setEnvironmentMode("vacuum", 0.6);
        this.engineVfx.setThrottle(0.6);
      }
      if (this.warpVfx) this.warpVfx.setWarpIntensity(0, true);
      this.cameraDirector.playShot({
        id: "shot_approach",
        fromPosition: { x: 3.5, y: 1.2, z: 8.0 },
        toPosition: { x: -3.0, y: 0.8, z: 7.0 },
        fromTarget: { x: 0, y: 0, z: 0 },
        toTarget: { x: 0, y: 0, z: 0 },
        duration: 4.5,
        easing: "easeInOutCubic"
      });
    } else if (stageName === "destinationAction" || stageName === "landing") {
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = false;
      if (this.earthGroup) this.earthGroup.visible = (destId === "earthOrbit");
      if (this.warpVfx) this.warpVfx.setWarpIntensity(0, true);

      const isLandingTarget = (stageName === "landing" || destId === "moon" || destId === "mars");
      if (isLandingTarget) {
        if (destId !== "moon" && destId !== "mars") {
          destId = "mars";
          this.destinationId = "mars";
        }
        this.transitionToSurfaceScene();
      } else {
        this.currentStage = "destinationAction";
        this.timelineElapsed = 0;
        if (this.destinationGroup) {
          this.destinationGroup.visible = true;
          this.destinationGroup.position.set(0, 0, -38);
        }
        if (this.surfaceGroup) this.surfaceGroup.visible = false;
        if (this.rocket) {
          this.rocket.position.set(0, 0, 0);
          this.rocket.rotation.set(0, 0, 0);
        }
        if (this.engineVfx) {
          this.engineVfx.setVisible(true);
          this.engineVfx.setEnvironmentMode("vacuum", 0.4);
          this.engineVfx.setThrottle(0.4);
        }
        this.cameraDirector.playShot({
          id: "shot_dest_hero",
          fromPosition: { x: -4.5, y: 1.5, z: 8.0 },
          toPosition: { x: 4.5, y: -0.5, z: 7.5 },
          fromTarget: { x: 0, y: 0, z: 0 },
          toTarget: { x: 0, y: 0, z: 0 },
          duration: 8.0,
          easing: "easeInOutCubic"
        });
      }
    } else if (stageName === "missionComplete") {
      this.finishMissionSuccess();
    }
  }

  /* =========================================================================
   * 11. MAIN RENDER LOOP & CLEAN DISPOSAL
   * ========================================================================= */

  animate() {
    this.animationId = this.requestTrackedRaf(() => this.animate());

    const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    const dt = (this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 0.016) * (this.speedMultiplier || 1.0);
    this.lastTime = now;

    this.updateTimeline(dt);
    if (this.cameraDirector) this.cameraDirector.update(dt);
    if (this.engineVfx) this.engineVfx.update(dt, now / 1000);
    if (this.particleSystem) this.particleSystem.update(dt);

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  disposeObject3D(obj) {
    if (!obj || typeof obj.traverse !== "function") return;
    obj.traverse(child => {
      if (child && child.geometry && child.geometry.dispose) child.geometry.dispose();
      if (child && child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m && m.dispose && m.dispose());
        else if (child.material.dispose) child.material.dispose();
      }
    });
  }

  destroy() {
    if (this.boundVisibilityHandler && typeof document !== "undefined" && document.removeEventListener) {
      document.removeEventListener("visibilitychange", this.boundVisibilityHandler);
      this.boundVisibilityHandler = null;
    }
    if (this.boundResizeHandler && typeof window !== "undefined" && window.removeEventListener) {
      window.removeEventListener("resize", this.boundResizeHandler);
      this.boundResizeHandler = null;
    }

    this.clearScheduledWork();

    if (this.animationId) {
      this.cancelTrackedRaf(this.animationId);
      this.animationId = null;
    }
    this.activeRafs.forEach(id => this.cancelTrackedRaf(id));
    this.activeRafs.clear();

    this.exitCinematicMode();

    if (window.audioManager && typeof window.audioManager.stopEngineLoop === "function") {
      window.audioManager.stopEngineLoop();
    }
    if (this.cameraDirector) {
      this.cameraDirector.stopShot();
      this.cameraDirector = null;
    }
    if (this.warpVfx) {
      this.warpVfx.setWarpIntensity(0, true);
      this.warpVfx.dispose();
      this.warpVfx = null;
    }
    if (this.engineVfx) {
      this.engineVfx.dispose();
      this.engineVfx = null;
    }
    if (this.particleSystem) {
      this.particleSystem.dispose();
      this.particleSystem = null;
    }

    this.event3DMeshes.forEach(m => {
      if (m && m.parent) m.parent.remove(m);
    });
    this.event3DMeshes = [];

    if (this.flightRig && this.scene) {
      this.scene.remove(this.flightRig);
      this.disposeObject3D(this.flightRig);
      this.flightRig = null;
    }
    if (this.planetRig && this.scene) {
      this.scene.remove(this.planetRig);
      this.disposeObject3D(this.planetRig);
      this.planetRig = null;
    }
    if (this.environmentRig && this.scene) {
      this.scene.remove(this.environmentRig);
      this.disposeObject3D(this.environmentRig);
      this.environmentRig = null;
    }
    if (this.fxRig && this.scene) {
      this.scene.remove(this.fxRig);
      this.disposeObject3D(this.fxRig);
      this.fxRig = null;
    }

    this.rocket = null;
    this.flameMesh = null;
    this.terrainMesh = null;
    this.destinationGroup = null;
    this.destinationMesh = null;
    this.saturnRingMesh = null;
    this.earthGroup = null;
    this.earthMesh = null;
    this.launchPadGroup = null;
    this.cloudsGroup = null;
    this.starsGroup = null;

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
  }
}

// Global Launch Sequence Instance
window.launchSequence = new LaunchSequence();
if (typeof module !== "undefined" && module.exports) {
  module.exports = LaunchSequence;
}
