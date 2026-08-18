/**
 * Multiplication Rocket Lab - Cinematic Interplanetary Launch & Landing Engine (js/launch.js)
 * Version 4.2.0 Cinematic VFX & Animation Overhaul
 * 
 * Features:
 * - Local Flight Rig Coordinate System (Zero coordinate snapping, continuous camera paths)
 * - Multi-Shot Cinematic Camera Director (Pad Hero, Engine Close-up, 2.0s Ignition, Tower Clear, Chase Cam, Orbital Reveal)
 * - Advanced Engine VFX (Additive white-hot core, gradient plume, supersonic shock diamonds, bloom glow sprite, vacuum expansion)
 * - Soft Particle Smoke (Procedural canvas radial gradient sprites, horizontal launch pad trench blast)
 * - Procedural Multi-Layered Planets (Earth with continents/clouds, Moon with craters, Mars with polar caps, Jupiter with bands/Red Spot, Saturn rings & ice field, Deep Space nebula)
 * - DeltaTime Physics (Frame-rate independent smoke, dust, sparks, and ring ice particles)
 * - World Space Payload Detachment Lifecycle (State machine: attached -> deploying -> deployed)
 * - Continuous WebAudio Engine Loops & Soundscapes
 * - Fullscreen Cinematic Mode (Clean HUD, fading distracting page cards, graceful fade-in at debrief)
 */
class LaunchSequence {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;

    // Rigs & VFX Subsystems
    this.flightRig = null;
    this.rocketRig = null;
    this.planetRig = null;
    this.cameraDirector = null;
    this.engineVfx = null;
    this.particleSystem = null;
    this.warpVfx = null;

    // Meshes & Lights
    this.rocket = null;
    this.flameMesh = null; // Compatibility bridge to engineVfx
    this.flameBaseScale = (typeof THREE !== "undefined" && THREE.Vector3) ? new THREE.Vector3(1, 1, 1) : { x: 1, y: 1, z: 1 };
    this.flameThrottle = 1.0;
    this.engineLight = null;
    this.landingGearGroup = null;
    this.contactShadow = null;

    this.earthGroup = null;
    this.earthMesh = null;
    this.destinationGroup = null;
    this.destinationMesh = null;
    this.saturnRingsGroup = null;
    this.saturnRingMesh = null;
    this.surfaceGroup = null;
    this.cloudsGroup = null;
    this.launchPadGroup = null;
    this.starsGroup = null;

    this.payloadMesh = null;
    this.payloadState = {
      attached: true,
      deploying: false,
      deployed: false
    };

    // Timeline & Pacing
    this.animationId = null;
    this.lastTime = 0;
    this.timelineElapsed = 0;
    this.currentStage = "idle";
    this.landingPhase = "idle"; // Phase A (highDescent), Phase B (retroBurn), Phase C (finalDescent), Phase D (touchdownHold)
    this.landingPhaseElapsed = 0;

    this.countdownValue = 5;
    this.countdownTimer = null;
    this.timeouts = [];
    this.activeRafs = new Set();
    
    this.cameraShakeIntensity = 0;
    this.destinationId = "moon";
    this.hasRecordedVisit = false;
    this.onCompleteCallback = null;
    this.hasShownTowerClear = false;

    // Local Landing Coordinate Framework
    this.GROUND_Y = 0;
    this.LANDING_CENTER = (typeof THREE !== "undefined" && THREE.Vector3) ? new THREE.Vector3(0, 0, 0) : { x: 0, y: 0, z: 0 };
    this.CONTACT_EPSILON = 0.02;

    this.rocketLocalMinY = -2.5;
    this.rocketLocalMaxY = 3.5;
    this.rocketHeight = 6.0;
    this.rocketCenterY = 0.5;
    this.touchdownRocketY = 2.5;
    this.currentVerticalSpeed = 0;

    this.isDebugMode = false;
    this.isLandingDebug = false;
    this.isEventPaused = false;
    this.hasTriggeredFlightEvent = false;
    this.isPayloadDeployed = false;
    this.speedMultiplier = 1.0;

    // Compatibility Pools for unit tests
    this.smokePool = [];
    this.dustPool = [];
    this.iceParticlesPool = [];

    this.boundVisibilityHandler = null;
    this.boundResizeHandler = null;
  }

  requestTrackedRaf(callback) {
    if (typeof requestAnimationFrame === "undefined") {
      const id = setTimeout(callback, 16);
      this.activeRafs.add(id);
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

  /**
   * Initialize 3D Scene, VFX Subsystems, and Procedural Celestial Bodies
   */
  initScene(containerId, destId = "moon") {
    this.destroy();
    this.destinationId = destId;
    this.hasRecordedVisit = false;
    this.currentStage = "idle";
    this.landingPhase = "idle";
    this.payloadState = { attached: true, deploying: false, deployed: false };
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

      // Subsystems Initialization
      this.cameraDirector = new CinematicCameraDirector(this.camera);
      const isReduced = (typeof document !== "undefined" && document.body && document.body.classList) ? document.body.classList.contains("reduced-motion") : false;
      this.cameraDirector.setReducedMotion(isReduced);

      this.particleSystem = new ParticleSystem(this.scene, "high");
      this.smokePool = this.particleSystem.smokePool;
      this.dustPool = this.particleSystem.dustPool;

      this.warpVfx = new WarpVFXSystem(this.scene, 280);
      this.warpVfx.setReducedMotion(isReduced);
      this.scene.add(this.warpVfx.group);

      // Lighting Setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(20, 30, 25);
      this.scene.add(dirLight);

      this.engineLight = new THREE.PointLight(0xff7722, 0, 45);
      this.engineLight.position.set(0, -2.5, 0);
      this.scene.add(this.engineLight);

      // Build Procedural Scene Elements
      this.createLaunchPad();
      this.createCloudLayer();
      this.createSpaceEnvironment();
      this.createDestinationPlanet(destId);
      this.createRocketCopy();

      // Initialize Advanced Engine VFX on Rocket
      this.engineVfx = new EngineVFXSystem(this.scene);
      if (this.rocket) {
        this.rocket.add(this.engineVfx.group);
        this.engineVfx.group.position.set(0, this.rocketLocalMinY, 0);
      }
      this.flameMesh = this.engineVfx.plumeMesh;

      if (this.isLandingDebug && THREE.AxesHelper) {
        const axes = new THREE.AxesHelper(6);
        this.scene.add(axes);
      }

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
    const debugEl = document.getElementById("landing-debug-hud");
    if (debugEl) {
      if (this.isLandingDebug) debugEl.classList.remove("hidden");
      else debugEl.classList.add("hidden");
    }
  }

  resetHUDUI() {
    this.hasRecordedVisit = false;
    if (this.launchPadGroup) this.launchPadGroup.visible = true;
    if (this.cloudsGroup) this.cloudsGroup.visible = true;
    if (this.surfaceGroup) this.surfaceGroup.visible = false;
    if (this.destinationGroup) this.destinationGroup.visible = false;
    if (this.earthGroup) this.earthGroup.visible = false;

    document.getElementById("launch-checklist")?.classList.remove("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");
    document.getElementById("space-victory-banner")?.classList.add("hidden");
    document.getElementById("launch-stage-banner")?.classList.add("hidden");
    document.getElementById("touchdown-banner")?.classList.add("hidden");

    const checkItems = [1, 2, 3, 4];
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";
    const textMap = {
      1: isZh ? "✓ 航天器电气与遥测回路校验完毕" : "✓ Avionics & Telemetry Check OK",
      2: isZh ? "✓ 主发动机液氧低温推进剂加注完毕" : "✓ Cryogenic Propellant Loaded 100%",
      3: isZh ? "✓ 任务载荷锁止与空间姿态自检正常" : "✓ Mission Payload Locked & Ready",
      4: isZh ? "✓ 星际发射走廊与轨道净空就绪" : "✓ Launch Corridor Clear"
    };

    checkItems.forEach(i => {
      const el = document.getElementById(`chk-item-${i}`);
      if (el) el.innerText = textMap[i];
    });

    const btnStart = document.getElementById("btn-start-countdown");
    if (btnStart) {
      btnStart.disabled = false;
      btnStart.innerText = isZh ? "🚀 点火起飞 (Ignition & Liftoff)" : "🚀 Ignition & Liftoff";
    }
  }

  /**
   * Enter Fullscreen Cinematic Mode (Fades distracting web menus)
   */
  enterCinematicMode() {
    document.body.classList.add("cinematic-mode-active");
    const container = this.container || document.getElementById("screen-launch");
    if (container) container.classList.add("cinematic-active");
  }

  /**
   * Exit Fullscreen Cinematic Mode
   */
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

  /**
   * Create Launch Pad with Detailed Gantry, Warning Beacons & Fuel Umbilical
   */
  createLaunchPad() {
    if (typeof THREE === "undefined") return;
    this.launchPadGroup = new THREE.Group();

    // 1. Heavy Concrete Launch Table with Trench
    const padGeo = new THREE.CylinderGeometry(5.0, 6.0, 1.2, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = -0.6;
    this.launchPadGroup.add(pad);

    // Flame Trench Hole
    const trenchGeo = new THREE.CylinderGeometry(1.8, 1.8, 1.3, 24);
    const trenchMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const trench = new THREE.Mesh(trenchGeo, trenchMat);
    trench.position.y = -0.55;
    this.launchPadGroup.add(trench);

    // Yellow Safety Line Markings
    const ringGeo = new THREE.RingGeometry(3.0, 3.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.02;
    this.launchPadGroup.add(ring);

    // 2. Heavy Service Truss Tower
    const towerGeo = new THREE.BoxGeometry(1.2, 16.0, 1.2);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6, metalness: 0.4 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-3.2, 7.5, 0);
    this.launchPadGroup.add(tower);

    // Warning Beacon on Tower Tip
    const beaconGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(-3.2, 15.6, 0);
    this.launchPadGroup.add(beacon);

    // Retractable Crew & Umbilical Service Arm
    const armGeo = new THREE.BoxGeometry(2.6, 0.4, 0.4);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.5 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(-1.8, 6.0, 0);
    this.launchPadGroup.add(arm);

    this.scene.add(this.launchPadGroup);
  }

  /**
   * Create Realistic Multi-Layer Atmospheric Clouds
   */
  createCloudLayer() {
    if (typeof THREE === "undefined") return;
    this.cloudsGroup = new THREE.Group();

    const cloudCount = 18;
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.55,
      roughness: 1.0,
      depthWrite: false
    });

    for (let i = 0; i < cloudCount; i++) {
      const geo = new THREE.DodecahedronGeometry(6 + Math.random() * 8, 1);
      const mesh = new THREE.Mesh(geo, cloudMat);
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        35 + Math.random() * 25,
        (Math.random() - 0.5) * 80
      );
      this.cloudsGroup.add(mesh);
    }

    this.scene.add(this.cloudsGroup);
  }

  /**
   * Create Deep Space Starfield Environment
   */
  createSpaceEnvironment() {
    if (typeof THREE === "undefined") return;
    const q = ParticleSystem.getQualityConfig("high");
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

      // Star Color Diversity (White, Ice Blue, Amber)
      const colorType = Math.random();
      if (colorType > 0.8) {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0; // Blue giant
      } else if (colorType > 0.65) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.6; // Amber star
      } else {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1.0; // White star
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
    this.scene.add(this.starsGroup);

    // Procedural Earth Orbit Globe
    this.earthGroup = PlanetVisualFactory.createEarth(18.0);
    this.earthGroup.position.set(0, -32, -45);
    this.earthGroup.visible = false;
    this.scene.add(this.earthGroup);
    this.earthMesh = this.earthGroup.userData?.baseMesh || this.earthGroup;
  }

  /**
   * Create Procedural Destination Planet/Environment
   */
  createDestinationPlanet(destId) {
    if (typeof THREE === "undefined") return;

    if (this.destinationGroup) {
      this.scene.remove(this.destinationGroup);
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
      if (this.particleSystem) this.particleSystem.createSaturnIceField(500);
    } else if (destId === "deepSpace") {
      this.destinationGroup = PlanetVisualFactory.createDeepSpace(20.0);
    } else {
      // Default Earth Orbit
      this.destinationGroup = PlanetVisualFactory.createEarth(18.0);
    }

    this.destinationGroup.position.set(0, 0, -60);
    this.destinationGroup.visible = false;
    this.scene.add(this.destinationGroup);
    this.destinationMesh = this.destinationGroup.userData?.baseMesh || this.destinationGroup;
  }

  /**
   * Clone Active Rocket and Attach Installed Parts & Payload
   */
  createRocketCopy() {
    if (!window.rocketBuilder) return;
    this.rocket = window.rocketBuilder.createDetachedRocket();
    this.rocket.position.set(0, 0, 0);
    this.scene.add(this.rocket);

    this.calculateRocketDimensions();
    this.payloadMesh = this.rocket.getObjectByName("payload_mesh") || null;
  }

  calculateRocketDimensions() {
    if (!this.rocket || typeof THREE === "undefined" || !THREE.Box3) {
      this.rocketLocalMinY = -2.5;
      this.rocketLocalMaxY = 3.5;
      this.rocketHeight = 6.0;
      this.rocketCenterY = 0.5;
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
    this.rocketCenterY = (box.min.y + box.max.y) / 2;
    this.touchdownRocketY = Math.abs(this.rocketLocalMinY) + this.GROUND_Y;

    this.rocket.position.copy(prevPos);
  }

  /**
   * Start Launch Flow with Multishot Storyboard
   */
  startLaunch() {
    this.enterCinematicMode();
    document.getElementById("launch-checklist")?.classList.add("hidden");
    const box = document.getElementById("launch-countdown-box");
    if (box) box.classList.remove("hidden");

    this.countdownValue = 5;
    const numEl = document.getElementById("countdown-number");
    if (numEl) numEl.innerText = "5";

    // Shot 1: Hero Pad (3/4 Low Angle, Full Rocket & Service Tower)
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
        // Shot 2: Engine Close-up (Ignition Sparks & Steam Vents)
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
        if (this.particleSystem) {
          this.particleSystem.emitIgnitionSparks({ x: 0, y: -0.5, z: 0 }, 15);
        }
      }

      if (this.countdownValue <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.triggerIgnition();
      }
    }, 1000);
  }

  /**
   * Trigger Ignition (Full 2.0s duration with ground shockwave & audio loop)
   */
  triggerIgnition() {
    this.currentStage = "ignition";
    this.timelineElapsed = 0;

    const box = document.getElementById("launch-countdown-box");
    if (box) box.classList.add("hidden");

    // Audio Continuous Engine Loop
    if (window.audioManager) {
      window.audioManager.startEngineLoop();
      window.audioManager.setEngineThrottle(0.85);
    }

    // Engine VFX
    if (this.engineVfx) {
      this.engineVfx.setVisible(true);
      this.engineVfx.setEnvironmentMode("atmosphere", 0);
      this.engineVfx.setThrottle(0.85);
    }
    if (this.engineLight) this.engineLight.intensity = 4.0;

    // Shot 3: Ignition Blast (Explosive Horizontal Smoke)
    this.cameraDirector.playShot({
      id: "shot3_ignition",
      fromPosition: { x: -3.5, y: 0.5, z: 7.0 },
      toPosition: { x: -4.0, y: 0.8, z: 8.0 },
      fromTarget: { x: 0, y: 1.0, z: 0 },
      toTarget: { x: 0, y: 1.5, z: 0 },
      duration: CONFIG.CINEMATIC_TIMING.ignition || 2.0,
      easing: "easeInOutQuad",
      shake: 0.35
    });

    if (this.particleSystem) {
      this.particleSystem.emitIgnitionSmoke(0, -0.5, 0, 35);
    }

    const ignDuration = (CONFIG.CINEMATIC_TIMING.ignition || 2.0) * 1000;
    const t = setTimeout(() => {
      this.liftoff();
    }, ignDuration);
    this.timeouts.push(t);
  }

  /**
   * Liftoff into Sky
   */
  liftoff() {
    this.currentStage = "liftoff";
    this.timelineElapsed = 0;

    if (window.audioManager) {
      window.audioManager.setEngineThrottle(1.0);
      window.audioManager.playAtmosphereRush();
    }
    if (this.engineVfx) this.engineVfx.setThrottle(1.0);

    // Shot 4: Tower Clear (Low Angle looking up as rocket clears overhead)
    this.cameraDirector.playShot({
      id: "shot4_tower_clear",
      fromPosition: { x: -2.0, y: -0.2, z: 4.5 },
      toPosition: { x: -2.0, y: 0.5, z: 5.5 },
      fromTarget: { x: 0, y: 3.0, z: 0 },
      toTarget: { x: 0, y: 18.0, z: 0 },
      duration: CONFIG.CINEMATIC_TIMING.liftoff || 4.0,
      easing: "easeInOutCubic",
      shake: 0.2
    });
  }

  /**
   * Update Main Flight Timeline Frame-by-Frame
   */
  updateTimeline(dt) {
    if (this.isEventPaused || this.currentStage === "idle") return;

    this.timelineElapsed += dt;
    const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();

    // 1. LIFTOFF STAGE (0 to 4s)
    if (this.currentStage === "liftoff") {
      const dur = CONFIG.CINEMATIC_TIMING.liftoff || 4.0;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      // Rocket ascends smoothly from y=0 to y=50
      this.rocket.position.y = prog * prog * 50;

      if (this.particleSystem) {
        this.particleSystem.emitFlightSmoke(this.rocket.position, 2);
      }

      if (prog >= 0.45 && !this.hasShownTowerClear) {
        this.hasShownTowerClear = true;
        this.showMilestoneBanner("🚀 TOWER CLEAR");
      }

      if (prog >= 1.0) {
        this.currentStage = "atmospheric";
        this.timelineElapsed = 0;
        // Shot 5: Side Tracking through Cloud Layer
        this.cameraDirector.playShot({
          id: "shot5_cloud_tracking",
          fromPosition: { x: 12.0, y: 65, z: 12.0 },
          toPosition: { x: 8.0, y: 95, z: 8.0 },
          fromTarget: { x: 0, y: 65, z: 0 },
          toTarget: { x: 0, y: 110, z: 0 },
          duration: CONFIG.CINEMATIC_TIMING.atmosphere || 4.5,
          easing: "easeOutQuart",
          shake: 0.15
        });
      }
    }

    // 2. ATMOSPHERIC ASCENT & CLOUD PUNCH-THROUGH (4 to 8.5s)
    else if (this.currentStage === "atmospheric") {
      const dur = CONFIG.CINEMATIC_TIMING.atmosphere || 4.5;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      this.rocket.position.y = 50 + prog * 70;
      // Slight aerodynamic gravity turn
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

        // Transition to Local Origin Rig for Deep Space
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

        // Shot 7: Orbital Reveal (Slow horizontal pan holding on Earth)
        this.cameraDirector.playShot({
          id: "shot7_orbital_reveal",
          fromPosition: { x: -4.0, y: 1.0, z: 7.5 },
          toPosition: { x: 5.5, y: 0.5, z: 8.0 },
          fromTarget: { x: 0, y: 0, z: 0 },
          toTarget: { x: 0, y: -0.5, z: 0 },
          duration: CONFIG.CINEMATIC_TIMING.earthOrbit || 3.0,
          easing: "easeInOutCubic"
        });
      }
    }

    // 3. EARTH ORBIT INSERTION (8.5 to 11.5s)
    else if (this.currentStage === "earthOrbit") {
      const dur = CONFIG.CINEMATIC_TIMING.earthOrbit || 3.0;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      // Rotate Earth & Atmosphere
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

      // Warp FX acceleration
      if (this.warpVfx) {
        this.warpVfx.setWarpIntensity(Math.sin(prog * Math.PI));
        this.warpVfx.update(dt, this.rocket.position);
      }

      // Earth recedes into the background
      if (this.earthGroup && this.earthGroup.visible) {
        this.earthGroup.position.z -= 40 * dt;
        if (this.earthGroup.position.z < -250) this.earthGroup.visible = false;
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

        // Dramatic approach shot
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

    // 5. PLANET APPROACH & SENSE OF SCALE
    else if (this.currentStage === "destinationApproach") {
      const destCfg = CONFIG.DESTINATIONS[this.destinationId] || CONFIG.DESTINATIONS.moon;
      const dur = destCfg.cinematic?.approachSeconds || 4.5;
      const prog = Math.min(1.0, this.timelineElapsed / dur);

      // Planet grows from 10% to 75% of viewport
      if (this.destinationGroup) {
        const startZ = -120;
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

    // 6. DESTINATION ACTION (Landing / Flyby / Orbit / Payload Deployment)
    else if (this.currentStage === "destinationAction") {
      const isLanding = CONFIG.DESTINATIONS[this.destinationId]?.type === "landing";
      if (isLanding) {
        this.updateLandingSystem(dt);
      } else {
        this.updateFlybyOrOrbit(dt);
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

  /**
   * Transition to Local Planetary Surface Scene (Moon / Mars)
   */
  transitionToSurfaceScene() {
    if (this.launchPadGroup) this.launchPadGroup.visible = false;
    if (this.cloudsGroup) this.cloudsGroup.visible = false;
    if (this.destinationGroup) this.destinationGroup.visible = false;

    this.createLandingSurface(this.destinationId);
    if (this.surfaceGroup) this.surfaceGroup.visible = true;

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

    // Descent Wide Shot
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
    if (typeof THREE === "undefined") return;

    if (this.surfaceGroup) {
      this.scene.remove(this.surfaceGroup);
      this.surfaceGroup = null;
    }

    this.surfaceGroup = new THREE.Group();
    const isMars = destId === "mars";
    const surfaceColor = isMars ? 0x991b1b : 0x475569;

    // Ground Plane situated at GROUND_Y = 0
    const groundGeo = new THREE.CircleGeometry(45, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: surfaceColor,
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, this.GROUND_Y, 0);
    this.surfaceGroup.add(ground);

    // Procedural Crater Rims
    const craterMat = new THREE.MeshStandardMaterial({ color: isMars ? 0x7f1d1d : 0x334155, roughness: 0.9 });
    for (let i = 0; i < 10; i++) {
      const ringGeo = new THREE.RingGeometry(2.5 + Math.random() * 5, 3.2 + Math.random() * 5.5, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const crater = new THREE.Mesh(ringGeo, craterMat);
      const ang = Math.random() * Math.PI * 2;
      const d = 8 + Math.random() * 25;
      crater.position.set(Math.cos(ang) * d, this.GROUND_Y + 0.02, Math.sin(ang) * d);
      this.surfaceGroup.add(crater);
    }

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
    this.contactShadow.position.set(0, this.GROUND_Y + 0.01, 0);
    this.surfaceGroup.add(this.contactShadow);

    this.scene.add(this.surfaceGroup);
  }

  /**
   * Update 4-Phase Landing Timeline (Phase A: High Descent, B: Retro Burn, C: Final Descent, D: Touchdown Hold)
   */
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

      // Engine Close Shot (<5m)
      if (prog >= 0.8 && this.cameraDirector.currentShot?.id !== "shot_engine_dust") {
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

    // Phase C: Final Descent & Flame Cutoff (5m -> Touchdown Y, 1.6s)
    else if (this.landingPhase === "finalDescent") {
      const dur = 1.6;
      const prog = Math.min(1.0, this.landingPhaseElapsed / dur);
      this.rocket.position.y = 5.0 - prog * (5.0 - this.touchdownRocketY);
      this.currentVerticalSpeed = Math.max(0.2, (1.0 - prog) * 3.0);

      // Smooth throttle decline
      const th = Math.max(0, 0.7 * (1.0 - prog));
      if (this.engineVfx) this.engineVfx.setThrottle(th);
      if (window.audioManager) window.audioManager.setEngineThrottle(th);

      // Emit Radial Dust
      if (this.particleSystem && prog > 0.3) {
        const isMars = this.destinationId === "mars";
        this.particleSystem.emitLandingDust(this.rocket.position, isMars ? 0x991b1b : 0xd1d5db, 4);
      }

      // Contact Shadow Darkening
      if (this.contactShadow) {
        this.contactShadow.material.opacity = prog * 0.75;
      }

      if (prog >= 1.0) {
        this.landingPhase = "touchdownHold";
        this.landingPhaseElapsed = 0;
        this.rocket.position.y = this.touchdownRocketY;
        this.currentVerticalSpeed = 0;

        // Cut engine and flame completely
        if (this.engineVfx) this.engineVfx.setVisible(false);
        if (this.flameMesh) this.flameMesh.visible = false;
        if (this.engineLight) this.engineLight.intensity = 0;
        if (window.audioManager) {
          window.audioManager.stopEngineLoop();
          window.audioManager.playTouchdownThump();
        }

        this.showMilestoneBanner("🏆 TOUCHDOWN CONFIRMED");

        // Touchdown Hero Orbit Shot
        this.cameraDirector.playShot({
          id: "shot_touchdown_hero",
          fromPosition: { x: 5.5, y: 1.5, z: 8.5 },
          toPosition: { x: -6.0, y: 2.2, z: 9.0 },
          fromTarget: { x: 0, y: 2.5, z: 0 },
          toTarget: { x: 0, y: 2.5, z: 0 },
          duration: 2.6,
          easing: "easeInOutCubic"
        });

        // Deploy Rover/Payload after 1s
        setTimeout(() => {
          this.deployMissionPayload(this.destinationId);
        }, 1000);
      }
    }

    // Phase D: Touchdown Hold (2.6s celebration before results)
    else if (this.landingPhase === "touchdownHold") {
      const dur = 2.6;
      if (this.landingPhaseElapsed >= dur && !this.hasRecordedVisit) {
        this.finishMissionSuccess();
      }
    }
  }

  /**
   * Update Flyby or Orbital Destinations (Earth Orbit / Jupiter / Saturn / Deep Space)
   */
  updateFlybyOrOrbit(dt) {
    const destCfg = CONFIG.DESTINATIONS[this.destinationId] || CONFIG.DESTINATIONS.earthOrbit;
    const dur = destCfg.cinematic?.destinationSeconds || 7.0;
    const prog = Math.min(1.0, this.timelineElapsed / dur);

    // Rotate Celestial Target
    if (this.destinationGroup) {
      this.destinationGroup.rotation.y += 0.02 * dt;
    }

    // Deploy payload at 30% progress
    if (prog >= 0.3 && !this.payloadState.deploying && !this.payloadState.deployed) {
      this.deployMissionPayload(this.destinationId);
    }

    if (prog >= 1.0 && !this.hasRecordedVisit) {
      this.finishMissionSuccess();
    }
  }

  /**
   * World-Space Payload Detachment & Rich Task Animation
   */
  deployMissionPayload(destId) {
    if (this.payloadState.deploying || this.payloadState.deployed) return;
    this.payloadState.deploying = true;
    this.payloadState.deployed = true;

    if (!this.payloadMesh) {
      this.payloadMesh = this.rocket?.getObjectByName("payload_mesh") || null;
    }

    if (this.payloadMesh && typeof THREE !== "undefined") {
      // Detach from rocket and attach to world scene
      const worldPos = new THREE.Vector3();
      this.payloadMesh.getWorldPosition(worldPos);
      if (this.payloadMesh.parent) this.payloadMesh.parent.remove(this.payloadMesh);
      this.scene.add(this.payloadMesh);
      this.payloadMesh.position.copy(worldPos);

      // Animate Payload in World Space
      const isLanding = CONFIG.DESTINATIONS[destId]?.type === "landing";
      if (isLanding) {
        // Rover roll out
        const startZ = this.payloadMesh.position.z;
        const targetZ = startZ + 6.0;
        let rollElapsed = 0;
        const rollInterval = setInterval(() => {
          rollElapsed += 0.03;
          const p = Math.min(1.0, rollElapsed / 2.5);
          this.payloadMesh.position.z = startZ + (targetZ - startZ) * p;
          this.payloadMesh.position.y = this.GROUND_Y + 0.35;
          if (p >= 1.0) clearInterval(rollInterval);
        }, 30);
      } else {
        // Satellite / Probe float into orbit
        const startY = this.payloadMesh.position.y;
        const targetY = startY + 4.0;
        let orbitElapsed = 0;
        const orbitInterval = setInterval(() => {
          orbitElapsed += 0.03;
          const p = Math.min(1.0, orbitElapsed / 3.0);
          this.payloadMesh.position.y = startY + (targetY - startY) * p;
          this.payloadMesh.rotation.y += 0.02;
          if (p >= 1.0) clearInterval(orbitInterval);
        }, 30);
      }
    }
  }

  showMilestoneBanner(text) {
    const banner = document.getElementById("launch-stage-banner");
    if (!banner) return;
    banner.innerText = text;
    banner.classList.remove("hidden");
    banner.classList.remove("banner-pop");
    void banner.offsetWidth; // trigger reflow
    banner.classList.add("banner-pop");

    setTimeout(() => {
      banner.classList.add("hidden");
    }, 2400);
  }

  emitRadialDust(altitude) {
    if (altitude > 8.0) return;
    if (this.particleSystem) {
      const isMars = this.destinationId === "mars";
      this.particleSystem.emitLandingDust(this.rocket ? this.rocket.position : { x: 0, y: altitude, z: 0 }, isMars ? 0x991b1b : 0xd1d5db, 6);
    }
  }

  finishMissionSuccess() {
    if (this.hasRecordedVisit) return;
    this.hasRecordedVisit = true;
    this.currentStage = "missionComplete";

    if (window.audioManager) {
      window.audioManager.stopEngineLoop();
      window.audioManager.playVictoryFanfare();
    }

    this.exitCinematicMode();

    if (window.game && typeof window.game.handleMissionCompleted === "function") {
      window.game.handleMissionCompleted(this.destinationId);
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

  /**
   * Jump directly to any mission stage for Developer & Animation Lab Testing
   */
  jumpToStage(stageName, destId = "moon", containerId = "canvas-container-launch") {
    this.initScene(containerId, destId);
    document.getElementById("launch-checklist")?.classList.add("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");

    if (stageName === "liftoff") {
      this.currentStage = "liftoff";
      this.timelineElapsed = 0;
      if (this.engineVfx) {
        this.engineVfx.setVisible(true);
        this.engineVfx.setThrottle(1.0);
      }
    } else if (stageName === "atmospheric") {
      this.currentStage = "atmospheric";
      this.timelineElapsed = 0;
      this.rocket.position.y = 50;
      if (this.engineVfx) this.engineVfx.setVisible(true);
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
    } else if (stageName === "earthOrbit") {
      this.currentStage = "earthOrbit";
      this.timelineElapsed = 0;
      this.rocket.position.set(0, 0, 0);
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = false;
      if (this.earthGroup) this.earthGroup.visible = true;
    } else if (stageName === "transfer") {
      this.currentStage = "transfer";
      this.timelineElapsed = 0;
      this.rocket.position.set(0, 0, 0);
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = false;
      if (this.destinationGroup) this.destinationGroup.visible = true;
      this.startTransferBurn();
    } else if (stageName === "destinationApproach" || stageName === "approach") {
      this.currentStage = "destinationApproach";
      this.timelineElapsed = 0;
      this.rocket.position.set(0, 0, 0);
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = false;
      if (this.destinationGroup) this.destinationGroup.visible = true;
    } else if (stageName === "destinationAction" || stageName === "landing") {
      const isLanding = CONFIG.DESTINATIONS[destId]?.type === "landing";
      if (isLanding) {
        this.transitionToSurfaceScene();
      } else {
        this.currentStage = "destinationAction";
        this.timelineElapsed = 0;
        this.rocket.position.set(0, 0, 0);
        if (this.destinationGroup) this.destinationGroup.visible = true;
      }
    } else if (stageName === "missionComplete") {
      this.finishMissionSuccess();
    }
  }

  updateDebugHUD() {
    if (!this.isLandingDebug) return;
    const hud = document.getElementById("landing-debug-hud");
    if (!hud || !this.rocket || !this.camera) return;

    const rY = this.rocket.position.y.toFixed(2);
    const rBaseY = (this.rocket.position.y + this.rocketLocalMinY).toFixed(2);
    const distToGround = Math.max(0, this.rocket.position.y - this.touchdownRocketY).toFixed(2);
    const camPos = `(${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})`;

    hud.innerHTML = `
      <div><strong>[CINEMATIC TELEMETRY]</strong></div>
      <div>Stage: ${this.currentStage} | Phase: ${this.landingPhase}</div>
      <div>Rocket Pos: (${this.rocket.position.x.toFixed(1)}, ${rY}, ${this.rocket.position.z.toFixed(1)})</div>
      <div>Dist to Ground: ${distToGround}m | Vertical Speed: ${this.currentVerticalSpeed.toFixed(1)} m/s</div>
      <div>Camera: ${camPos}</div>
      <div>Payload State: ${this.payloadState.deployed ? "DEPLOYED" : (this.payloadState.deploying ? "DEPLOYING" : "ATTACHED")}</div>
    `;
  }

  /**
   * Main Render & Physics Loop
   */
  animate() {
    this.animationId = this.requestTrackedRaf(() => this.animate());

    const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    const dt = (this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 0.016) * (this.speedMultiplier || 1.0);
    this.lastTime = now;

    this.updateTimeline(dt);
    if (this.cameraDirector) this.cameraDirector.update(dt);
    if (this.engineVfx) this.engineVfx.update(dt, now / 1000);
    if (this.particleSystem) this.particleSystem.update(dt);
    this.updateDebugHUD();

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
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];

    if (this.animationId) {
      this.cancelTrackedRaf(this.animationId);
      this.animationId = null;
    }
    this.activeRafs.forEach(id => this.cancelTrackedRaf(id));
    this.activeRafs.clear();

    if (this.engineVfx) {
      this.engineVfx.dispose();
      this.engineVfx = null;
    }
    if (this.particleSystem) {
      this.particleSystem.dispose();
      this.particleSystem = null;
    }
    if (this.warpVfx) {
      this.warpVfx.dispose();
      this.warpVfx = null;
    }

    if (this.rocket && this.scene) {
      this.scene.remove(this.rocket);
      this.disposeObject3D(this.rocket);
      this.rocket = null;
    }

    if (this.surfaceGroup && this.scene) {
      this.scene.remove(this.surfaceGroup);
      this.disposeObject3D(this.surfaceGroup);
      this.surfaceGroup = null;
    }

    if (this.destinationGroup && this.scene) {
      this.scene.remove(this.destinationGroup);
      this.disposeObject3D(this.destinationGroup);
      this.destinationGroup = null;
    }
    this.destinationMesh = null;
    this.saturnRingMesh = null;

    if (this.earthGroup && this.scene) {
      this.scene.remove(this.earthGroup);
      this.disposeObject3D(this.earthGroup);
      this.earthGroup = null;
    }
    this.earthMesh = null;

    if (this.launchPadGroup && this.scene) {
      this.scene.remove(this.launchPadGroup);
      this.disposeObject3D(this.launchPadGroup);
      this.launchPadGroup = null;
    }

    if (this.cloudsGroup && this.scene) {
      this.scene.remove(this.cloudsGroup);
      this.disposeObject3D(this.cloudsGroup);
      this.cloudsGroup = null;
    }

    if (this.starsGroup && this.scene) {
      this.scene.remove(this.starsGroup);
      this.disposeObject3D(this.starsGroup);
      this.starsGroup = null;
    }

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
