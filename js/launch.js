/**
 * Multiplication Rocket Lab - Cinematic Interplanetary Launch & Landing Engine (js/launch.js)
 * Version 3.1.0 Local Planetary Surface Coordinate System, Procedural Landing Gear, Box3 Touchdown Precision & Contact Shadow
 */
class LaunchSequence {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rocket = null;
    this.flameMesh = null;
    this.engineLight = null;
    this.landingGearGroup = null;
    this.contactShadow = null;

    this.smokePool = [];
    this.dustPool = [];
    this.iceParticlesPool = [];
    this.starsGroup = null;
    this.starPositions = null;
    this.earthMesh = null;
    this.destinationMesh = null;
    this.saturnRingsGroup = null;
    this.saturnRingMesh = null;
    this.surfaceGroup = null;
    this.cloudsGroup = null;
    this.launchPadGroup = null;

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

  initScene(containerId, destId = "moon") {
    this.destroy();
    this.destinationId = destId;
    this.hasRecordedVisit = false;
    this.currentStage = "idle";
    this.landingPhase = "idle";

    this.checkDebugFlags();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    if (!window.WebGLRenderingContext) return;

    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0f172a);
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

      this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 3000);
      this.camera.position.set(0, 1.5, 9);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(this.renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(10, 20, 15);
      this.scene.add(dirLight);

      this.engineLight = new THREE.PointLight(0xff4500, 0, 35);
      this.engineLight.position.set(0, -2.5, 0);
      this.scene.add(this.engineLight);

      this.createLaunchPad();
      this.createCloudLayer();
      this.createSpaceEnvironment();
      this.createDestinationPlanet(destId);
      this.createRocketCopy();
      this.initParticlePools();

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
    document.getElementById("launch-checklist")?.classList.remove("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");
    document.getElementById("space-victory-banner")?.classList.add("hidden");
    document.getElementById("launch-stage-banner")?.classList.add("hidden");
    document.getElementById("touchdown-banner")?.classList.add("hidden");

    const checkItems = [1, 2, 3, 4];
    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    checkItems.forEach(id => {
      const el = document.getElementById(`check-item-${id}`);
      if (el) {
        const stEl = el.querySelector(".status");
        if (stEl) {
          stEl.innerText = isZh ? "自检中..." : "Standby";
          stEl.style.color = "";
        }
      }
    });
  }

  createLaunchPad() {
    this.launchPadGroup = new THREE.Group();

    const padGeo = new THREE.CylinderGeometry(6.5, 7.2, 0.7, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = -2.35;
    this.launchPadGroup.add(pad);

    const towerGeo = new THREE.BoxGeometry(0.9, 15, 0.9);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-2.8, 5.0, -1.2);
    this.launchPadGroup.add(tower);

    const armGeo = new THREE.BoxGeometry(2.2, 0.3, 0.4);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(-1.6, 7.5, -0.6);
    this.launchPadGroup.add(arm);

    this.scene.add(this.launchPadGroup);
  }

  createCloudLayer() {
    this.cloudsGroup = new THREE.Group();
    const cloudGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });

    for (let i = 0; i < 24; i++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 80,
        30 + Math.random() * 30,
        (Math.random() - 0.5) * 80
      );
      const s = 0.8 + Math.random() * 0.7;
      if (cloud.scale && cloud.scale.set) {
        cloud.scale.set(s, s * 0.6, s);
      }
      this.cloudsGroup.add(cloud);
    }
    this.scene.add(this.cloudsGroup);
  }

  createSpaceEnvironment() {
    const starCount = 2600;
    const starsGeo = new THREE.BufferGeometry();
    this.starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      this.starPositions[i] = (Math.random() - 0.5) * 800;
      this.starPositions[i + 1] = Math.random() * 800 + 20;
      this.starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(this.starPositions, 3));

    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.95 });
    this.starsGroup = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.starsGroup);

    // High-Fidelity Earth with Glowing Atmosphere
    const earthGroup = new THREE.Group();
    const earthGeo = new THREE.SphereGeometry(68, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.1 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    const atmosGeo = new THREE.SphereGeometry(71, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, side: THREE.BackSide });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    earthGroup.add(atmosMesh);

    earthGroup.position.set(0, -78, -40);
    earthGroup.visible = false;
    this.earthMesh = earthGroup;
    this.scene.add(this.earthMesh);
  }

  createDestinationPlanet(destId) {
    if (this.destinationMesh && this.scene) {
      this.scene.remove(this.destinationMesh);
      this.disposeObject3D(this.destinationMesh);
    }

    const planetGroup = new THREE.Group();

    switch (destId) {
      case "earthOrbit": {
        const stationGeo = new THREE.TorusGeometry(20, 2.5, 16, 32);
        const stationMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
        const station = new THREE.Mesh(stationGeo, stationMat);
        station.rotation.x = Math.PI / 3;
        planetGroup.add(station);
        break;
      }
      case "moon": {
        const moonGeo = new THREE.SphereGeometry(30, 64, 64);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        planetGroup.add(moonMesh);
        break;
      }
      case "mars": {
        const marsGeo = new THREE.SphereGeometry(34, 64, 64);
        const marsMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.65 });
        const marsMesh = new THREE.Mesh(marsGeo, marsMat);
        planetGroup.add(marsMesh);

        const atmoGeo = new THREE.SphereGeometry(36, 32, 32);
        const atmoMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.25, side: THREE.BackSide });
        planetGroup.add(new THREE.Mesh(atmoGeo, atmoMat));
        break;
      }
      case "jupiter": {
        const jupGeo = new THREE.SphereGeometry(56, 64, 64);
        const jupMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
        const jupMesh = new THREE.Mesh(jupGeo, jupMat);
        planetGroup.add(jupMesh);

        // Great Red Spot
        const grsGeo = new THREE.SphereGeometry(12, 16, 16);
        const grsMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
        const grs = new THREE.Mesh(grsGeo, grsMat);
        grs.position.set(0, -10, 48);
        grs.scale.set(1.4, 0.8, 0.4);
        planetGroup.add(grs);

        // Moons
        const io = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
        io.position.set(-85, 20, -25);
        planetGroup.add(io);

        const europa = new THREE.Mesh(new THREE.SphereGeometry(2.8, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
        europa.position.set(78, -15, 20);
        planetGroup.add(europa);
        break;
      }
      case "saturn": {
        const satGeo = new THREE.SphereGeometry(40, 64, 64);
        const satMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
        const satMesh = new THREE.Mesh(satGeo, satMat);
        planetGroup.add(satMesh);

        // Multi-Layer Concentric Rings (Cassini Division)
        const ringsGroup = new THREE.Group();
        const ringConfigs = [
          { inner: 46, outer: 56, color: 0xfef08a, opacity: 0.45 },
          { inner: 57, outer: 72, color: 0xfacc15, opacity: 0.85 },
          { inner: 76, outer: 88, color: 0xfef08a, opacity: 0.75 },
          { inner: 90, outer: 96, color: 0xeab308, opacity: 0.35 }
        ];

        ringConfigs.forEach(cfg => {
          const rGeo = new THREE.RingGeometry(cfg.inner, cfg.outer, 64);
          const rMat = new THREE.MeshBasicMaterial({ color: cfg.color, side: THREE.DoubleSide, transparent: true, opacity: cfg.opacity });
          const ring = new THREE.Mesh(rGeo, rMat);
          ringsGroup.add(ring);
        });

        ringsGroup.rotation.x = Math.PI / 2.35;
        planetGroup.add(ringsGroup);
        this.saturnRingsGroup = ringsGroup;
        this.saturnRingMesh = ringsGroup.children[1] || ringsGroup.children[0];
        break;
      }
      case "deepSpace": {
        const coreGeo = new THREE.OctahedronGeometry(36, 4);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, wireframe: true });
        const core = new THREE.Mesh(coreGeo, coreMat);
        planetGroup.add(core);

        const nebGeo = new THREE.SphereGeometry(48, 16, 16);
        const nebMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true, transparent: true, opacity: 0.45 });
        planetGroup.add(new THREE.Mesh(nebGeo, nebMat));
        break;
      }
    }

    this.destinationMesh = planetGroup;
    this.destinationMesh.position.set(0, 0, -140);
    this.destinationMesh.visible = false;
    this.scene.add(this.destinationMesh);
  }

  /**
   * Builds an isolated Local Surface Landing Scene (Moon or Mars) strictly situated at GROUND_Y = 0, z = 0
   */
  createLandingSurface(destId) {
    if (this.surfaceGroup && this.scene) {
      this.scene.remove(this.surfaceGroup);
      this.disposeObject3D(this.surfaceGroup);
    }

    this.surfaceGroup = new THREE.Group();
    const isMoon = destId === "moon";
    const surfaceColor = isMoon ? 0x475569 : 0x9a3412;

    // 1. Natural Terrain Plane with vertex perturbations
    const groundGeo = new THREE.BoxGeometry ? new THREE.BoxGeometry(180, 2, 180) : new THREE.CylinderGeometry(90, 95, 2, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: surfaceColor,
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, this.GROUND_Y - 1.0, 0);
    this.surfaceGroup.add(ground);

    // 2. Surface Craters / Boulders / Craters with raised rims
    const featureColor = isMoon ? 0x334155 : 0x7c2d12;
    const rimMat = new THREE.MeshStandardMaterial({ color: featureColor, roughness: 0.9 });

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 55;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      if (i % 3 === 0) {
        // Low crater ring
        const craterRing = new THREE.Mesh(new THREE.TorusGeometry(1.5 + Math.random() * 2.5, 0.4, 8, 16), rimMat);
        craterRing.rotation.x = Math.PI / 2;
        craterRing.position.set(x, this.GROUND_Y + 0.1, z);
        this.surfaceGroup.add(craterRing);
      } else {
        // Scattered Boulders / Rocks
        const rockGeo = new THREE.DodecahedronGeometry ? new THREE.DodecahedronGeometry(0.5 + Math.random() * 1.4, 1) : new THREE.BoxGeometry(1, 1, 1);
        const rock = new THREE.Mesh(rockGeo, rimMat);
        rock.position.set(x, this.GROUND_Y + 0.2, z);
        this.surfaceGroup.add(rock);
      }
    }

    // 3. Ground Contact Shadow beneath rocket
    const shadowGeo = new THREE.CircleGeometry(2.2, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.set(0, this.GROUND_Y + 0.02, 0);
    this.surfaceGroup.add(this.contactShadow);

    // 4. Distant Horizon (Earth in Moon sky / Martian ridge)
    if (isMoon) {
      const distantEarthGeo = new THREE.SphereGeometry(8, 32, 32);
      const distantEarthMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const distantEarth = new THREE.Mesh(distantEarthGeo, distantEarthMat);
      distantEarth.position.set(-65, 55, -110);
      this.surfaceGroup.add(distantEarth);
    } else {
      const martianSunGeo = new THREE.SphereGeometry(6, 16, 16);
      const martianSunMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      const martianSun = new THREE.Mesh(martianSunGeo, martianSunMat);
      martianSun.position.set(50, 45, -110);
      this.surfaceGroup.add(martianSun);
    }

    // Position surface scene directly at GROUND_Y = 0, z = 0
    this.surfaceGroup.position.set(0, 0, 0);
    this.surfaceGroup.visible = false;
    this.scene.add(this.surfaceGroup);
  }

  /**
   * Attaches realistic 3 or 4-leg landing gear for Moon and Mars missions
   */
  attachLandingGear(rocket, modelId) {
    if (this.landingGearGroup && this.rocket) {
      this.rocket.remove(this.landingGearGroup);
      this.disposeObject3D(this.landingGearGroup);
      this.landingGearGroup = null;
    }

    this.landingGearGroup = new THREE.Group();

    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const padMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });

    let legRadius = 1.35;
    let attachY = -1.8;
    let legLength = 1.35;
    let padOffsetY = -2.55;

    if (modelId === "starship") {
      legRadius = 1.05; attachY = -2.0; legLength = 1.15; padOffsetY = -2.52;
    } else if (modelId === "falconHeavy") {
      legRadius = 1.85; attachY = -1.9; legLength = 1.45; padOffsetY = -2.60;
    } else if (modelId === "longMarch") {
      legRadius = 2.1; attachY = -1.8; legLength = 1.55; padOffsetY = -2.58;
    } else if (modelId === "cyber") {
      legRadius = 1.5; attachY = -1.9; legLength = 1.35; padOffsetY = -2.55;
    }

    const legCount = 4;
    for (let i = 0; i < legCount; i++) {
      const angle = (i * Math.PI * 2) / legCount;
      const legGroup = new THREE.Group();

      // Angled main strut
      const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, legLength, 12);
      const strut = new THREE.Mesh(strutGeo, legMat);
      strut.rotation.z = 0.35;
      strut.position.set(0.25, -0.35, 0);
      legGroup.add(strut);

      // Foot pad
      const footGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
      const foot = new THREE.Mesh(footGeo, padMat);
      foot.position.set(0.55, -legLength * 0.65, 0);
      legGroup.add(foot);

      legGroup.position.set(Math.cos(angle) * (legRadius * 0.7), attachY, Math.sin(angle) * (legRadius * 0.7));
      legGroup.rotation.y = -angle;
      this.landingGearGroup.add(legGroup);
    }

    rocket.add(this.landingGearGroup);
  }

  /**
   * BoundingBox Calculation: Accurately finds physical lowest point excluding flame
   */
  calculateRocketDimensions() {
    if (!this.rocket) return;

    const prevFlameVis = this.flameMesh ? this.flameMesh.visible : false;
    if (this.flameMesh) this.flameMesh.visible = false;

    try {
      if (THREE.Box3) {
        const box = new THREE.Box3().setFromObject(this.rocket);
        const currentY = this.rocket.position.y || 0;
        this.rocketLocalMinY = box.min.y - currentY;
        this.rocketLocalMaxY = box.max.y - currentY;
      } else {
        this.rocketLocalMinY = -2.55;
        this.rocketLocalMaxY = 3.5;
      }
    } catch (e) {
      this.rocketLocalMinY = -2.55;
      this.rocketLocalMaxY = 3.5;
    }

    if (this.flameMesh) this.flameMesh.visible = prevFlameVis;

    this.rocketHeight = this.rocketLocalMaxY - this.rocketLocalMinY;
    this.rocketCenterY = (this.rocketLocalMinY + this.rocketLocalMaxY) / 2;
    this.touchdownRocketY = this.GROUND_Y - this.rocketLocalMinY + this.CONTACT_EPSILON;
  }

  createRocketCopy() {
    if (window.rocketBuilder) {
      const activeModel = window.storageManager ? (window.storageManager.get("currentRocketModel") || "classic") : "classic";
      const activeTheme = window.storageManager ? (window.storageManager.get("currentRocketTheme") || "explorer") : "explorer";

      this.rocket = window.rocketBuilder.createDetachedRocket(activeModel, activeTheme);
      this.rocket.position.set(0, 0, 0);

      // Attach landing gear if Moon or Mars mission
      if (this.destinationId === "moon" || this.destinationId === "mars") {
        this.attachLandingGear(this.rocket, activeModel);
      }

      if (this.scene && this.rocket) {
        this.scene.add(this.rocket);
      }

      // Flame plume
      const flameGroup = new THREE.Group();

      const coreFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 2.6, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      coreFlame.rotation.x = Math.PI;
      flameGroup.add(coreFlame);

      const mainFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 3.8, 32),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 })
      );
      mainFlame.rotation.x = Math.PI;
      flameGroup.add(mainFlame);

      const outerFlame = new THREE.Mesh(
        new THREE.ConeGeometry(1.1, 5.0, 32),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.7 })
      );
      outerFlame.rotation.x = Math.PI;
      flameGroup.add(outerFlame);

      flameGroup.position.set(0, -2.7, 0);
      flameGroup.visible = false;
      this.flameMesh = flameGroup;
      this.rocket.add(this.flameMesh);

      this.calculateRocketDimensions();
    }
  }

  initParticlePools() {
    this.smokePool = [];
    this.dustPool = [];

    // Launch Smoke Pool
    const smokeGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat);
      p.visible = false;
      this.scene.add(p);
      this.smokePool.push({
        mesh: p,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -0.04 - Math.random() * 0.04,
        vz: (Math.random() - 0.5) * 0.08,
        life: 0,
        maxLife: 60
      });
    }

    // Radial Landing Dust Pool
    const isMars = this.destinationId === "mars";
    const dustColor = isMars ? 0xef4444 : 0xe2e8f0;
    const dustGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const dustMat = new THREE.MeshBasicMaterial({ color: dustColor, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 28; i++) {
      const p = new THREE.Mesh(dustGeo, dustMat);
      p.visible = false;
      this.scene.add(p);
      this.dustPool.push({
        mesh: p,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 65
      });
    }
  }

  startLaunchSequence(onComplete) {
    this.currentStage = "checking";
    this.onCompleteCallback = onComplete;
    this.resetHUDUI();
    this.timelineElapsed = 0;
    
    const checkItems = [1, 2, 3, 4];
    checkItems.forEach((item, idx) => {
      const t = setTimeout(() => {
        const el = document.getElementById(`check-item-${item}`);
        if (el) {
          const st = el.querySelector(".status");
          if (st) {
            st.innerHTML = "✅ Ready";
            st.style.color = "#34d399";
          }
        }
        if (window.audioManager) window.audioManager.playBeep(false);
      }, (idx + 1) * 280);
      this.timeouts.push(t);
    });

    const t2 = setTimeout(() => {
      document.getElementById("launch-checklist")?.classList.add("hidden");
      document.getElementById("launch-countdown-box")?.classList.remove("hidden");
      this.startCountdown(() => {
        this.triggerIgnition(() => {
          this.triggerVoyage();
        });
      });
    }, 1350);
    this.timeouts.push(t2);
  }

  startCountdown(onFinished) {
    this.currentStage = "countdown";
    this.countdownValue = 5;
    const numEl = document.getElementById("countdown-num");
    if (numEl) numEl.innerText = 5;

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      if (numEl) numEl.innerText = this.countdownValue > 0 ? this.countdownValue : "IGNITION!";
      if (window.audioManager) {
        window.audioManager.playBeep(this.countdownValue <= 2);
      }

      if (this.countdownValue <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        document.getElementById("launch-countdown-box")?.classList.add("hidden");
        if (onFinished) onFinished();
      }
      this.countdownValue--;
    }, 800);
  }

  triggerIgnition(onFinished) {
    this.currentStage = "ignition";
    if (this.flameMesh) this.flameMesh.visible = true;
    if (this.engineLight) this.engineLight.intensity = 7.0;
    this.cameraShakeIntensity = 0.25;

    this.smokePool.forEach(p => {
      p.mesh.visible = true;
      p.mesh.position.set((Math.random() - 0.5) * 3, -2.2, (Math.random() - 0.5) * 3);
      p.life = p.maxLife;
    });

    if (window.audioManager) window.audioManager.playIgnition();

    const t = setTimeout(() => {
      if (onFinished) onFinished();
    }, 900);
    this.timeouts.push(t);
  }

  triggerVoyage() {
    this.currentStage = "liftoff";
    this.timelineElapsed = 0;
  }

  showMilestoneBanner(text) {
    const banner = document.getElementById("launch-stage-banner");
    const textEl = document.getElementById("stage-banner-text");
    if (banner && textEl) {
      textEl.innerText = text;
      banner.classList.remove("hidden");
      const t = setTimeout(() => {
        banner.classList.add("hidden");
      }, 1800);
      this.timeouts.push(t);
    }
  }

  showTouchdownBanner(text, type = "lunar") {
    const banner = document.getElementById("touchdown-banner");
    const textEl = document.getElementById("touchdown-title-text");
    if (banner && textEl) {
      textEl.innerText = text;
      banner.className = `touchdown-banner ${type}`;
      banner.classList.remove("hidden");
    }
  }

  /**
   * Natural transition into Local Surface Landing Scene with Atmospheric Flash
   */
  transitionToSurfaceScene() {
    const flash = document.getElementById("landing-transition-flash");
    if (flash) {
      flash.classList.remove("hidden");
      flash.classList.add("active");
    }

    const t = setTimeout(() => {
      // Hide launch pad, cloud layers, and distant sphere
      if (this.launchPadGroup) this.launchPadGroup.visible = false;
      if (this.cloudsGroup) this.cloudsGroup.visible = false;
      if (this.destinationMesh) this.destinationMesh.visible = false;
      if (this.earthMesh) this.earthMesh.visible = false;

      // Build & enable surface scene situated at GROUND_Y = 0, z = 0
      this.createLandingSurface(this.destinationId);
      if (this.surfaceGroup) this.surfaceGroup.visible = true;

      // Re-position rocket high above local landing site
      this.rocket.position.set(0, 32, 0);
      this.rocket.rotation.set(0, 0, 0);
      if (this.flameMesh) this.flameMesh.visible = true;
      if (this.engineLight) this.engineLight.intensity = 4.0;

      // Position landing camera in local frame
      this.camera.position.set(14, 12, 22);
      this.camera.lookAt(0, 10, 0);

      this.currentStage = "destinationAction";
      this.landingPhase = "highDescent";
      this.timelineElapsed = 0;
      this.landingPhaseElapsed = 0;

      if (flash) {
        flash.classList.remove("active");
        setTimeout(() => flash.classList.add("hidden"), 350);
      }
    }, 280);
    this.timeouts.push(t);
  }

  /**
   * Radial Dust Plume Emitter from Rocket Base
   */
  emitRadialDust(distToGround) {
    if (distToGround > 8.0) return;

    const count = distToGround < 2.0 ? 4 : (distToGround < 5.0 ? 2 : 1);
    const speed = 0.12 + Math.max(0, 1 - distToGround / 8.0) * 0.38;

    let emitted = 0;
    this.dustPool.forEach(p => {
      if (p.life <= 0 && emitted < count) {
        emitted++;
        p.mesh.visible = true;

        const angle = Math.random() * Math.PI * 2;
        p.mesh.position.set(
          this.rocket.position.x + Math.cos(angle) * 0.4,
          this.GROUND_Y + 0.15,
          this.rocket.position.z + Math.sin(angle) * 0.4
        );
        p.vx = Math.cos(angle) * speed;
        p.vz = Math.sin(angle) * speed;
        p.vy = Math.random() * 0.08 + 0.02;
        p.life = p.maxLife;
      }
    });
  }

  /**
   * Update Landing System in Local Surface Coordinates (GROUND_Y = 0)
   */
  updateLandingSystem(dt) {
    const isMoon = this.destinationId === "moon";
    const destType = (CONFIG.DESTINATIONS[this.destinationId] && CONFIG.DESTINATIONS[this.destinationId].type) || "orbit";

    if (destType !== "landing") {
      this.updateFlybyOrOrbit(dt);
      return;
    }

    this.landingPhaseElapsed += dt;
    const currentAltitude = this.rocket.position.y;
    const distToGround = Math.max(0, currentAltitude - this.touchdownRocketY);

    // Update Contact Shadow
    if (this.contactShadow) {
      const shadowFactor = Math.max(0, Math.min(1, 1 - distToGround / 25));
      this.contactShadow.material.opacity = 0.15 + shadowFactor * 0.65;
      const s = 0.6 + shadowFactor * 0.7;
      this.contactShadow.scale.set(s, s, s);
      this.contactShadow.position.x = this.rocket.position.x;
      this.contactShadow.position.z = this.rocket.position.z;
    }

    // 1. Phase A: High Descent (32 -> 16m, ~1.5s)
    if (this.landingPhase === "highDescent") {
      const progress = Math.min(1, this.landingPhaseElapsed / 1.5);
      const ease = progress * progress * 0.5 + progress * 0.5;
      const targetY = 32 - (32 - 16) * ease;
      this.currentVerticalSpeed = (targetY - this.rocket.position.y) / dt;
      this.rocket.position.y = targetY;

      if (this.camera) {
        this.camera.position.set(14 - progress * 3, 12 - progress * 4, 22 - progress * 5);
        this.camera.lookAt(0, targetY * 0.6, 0);
      }

      if (this.flameMesh) {
        this.flameMesh.scale.set(1.0, 1.0, 1.0);
      }

      if (progress >= 1) {
        this.landingPhase = "retroBurn";
        this.landingPhaseElapsed = 0;
        this.showMilestoneBanner(isMoon ? "🌙 LUNAR RETRO-PROPULSION BURN" : "🔴 MARTIAN RETRO-PROPULSION BURN");
        if (window.audioManager) window.audioManager.playIgnition();
      }
    }

    // 2. Phase B: Retro Burn (16 -> 7m, ~1.3s)
    else if (this.landingPhase === "retroBurn") {
      const progress = Math.min(1, this.landingPhaseElapsed / 1.3);
      const ease = Math.sin(progress * Math.PI * 0.5);
      const targetY = 16 - (16 - 7) * ease;
      this.currentVerticalSpeed = (targetY - this.rocket.position.y) / dt;
      this.rocket.position.y = targetY;

      this.cameraShakeIntensity = 0.16 * (1 - progress * 0.4);

      if (this.flameMesh) {
        this.flameMesh.scale.set(1.2, 1.35, 1.2);
      }
      if (this.engineLight) {
        this.engineLight.intensity = 8.5;
      }

      if (this.camera) {
        this.camera.position.set(11 - progress * 2, 8 - progress * 2.5, 17 - progress * 3);
        this.camera.lookAt(0, targetY, 0);
      }

      this.emitRadialDust(distToGround);

      if (progress >= 1) {
        this.landingPhase = "finalDescent";
        this.landingPhaseElapsed = 0;
        this.cameraShakeIntensity = 0;
      }
    }

    // 3. Phase C: Final Descent (7m -> touchdownRocketY, ~1.6s)
    else if (this.landingPhase === "finalDescent") {
      const progress = Math.min(1, this.landingPhaseElapsed / 1.6);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const targetY = 7 - (7 - this.touchdownRocketY) * ease;
      this.currentVerticalSpeed = (targetY - this.rocket.position.y) / dt;
      this.rocket.position.y = targetY;

      // Flame shrinks proportionally with ground distance so it never clips into terrain
      const flameRatio = Math.max(0, Math.min(1, (targetY - this.touchdownRocketY) / 5.5));
      if (this.flameMesh) {
        this.flameMesh.scale.set(flameRatio, flameRatio, flameRatio);
        if (flameRatio < 0.05) this.flameMesh.visible = false;
      }
      if (this.engineLight) {
        this.engineLight.intensity = flameRatio * 6.0;
      }

      if (this.camera) {
        this.camera.position.set(9 - progress * 0.5, 5.5 - progress * 2.0, 14 - progress * 1.5);
        this.camera.lookAt(0, targetY + this.rocketCenterY, 0);
      }

      this.emitRadialDust(distToGround);

      if (progress >= 1) {
        // Strict Touchdown Condition
        this.rocket.position.y = this.touchdownRocketY;
        this.currentVerticalSpeed = 0;
        this.landingPhase = "touchdownHold";
        this.landingPhaseElapsed = 0;

        if (this.flameMesh) this.flameMesh.visible = false;
        if (this.engineLight) this.engineLight.intensity = 0;

        const touchdownMsg = isMoon ? "🌙 TOUCHDOWN! LUNAR MISSION COMPLETE" : "🔴 TOUCHDOWN ON MARS! MARS MISSION COMPLETE";
        this.showTouchdownBanner(touchdownMsg, isMoon ? "lunar" : "mars");
        if (window.audioManager) window.audioManager.playVictory();
      }
    }

    // 4. Phase D: Touchdown Hold (2.6s Hero Angle Inspection)
    else if (this.landingPhase === "touchdownHold") {
      this.rocket.position.y = this.touchdownRocketY;
      this.currentVerticalSpeed = 0;
      if (this.flameMesh) this.flameMesh.visible = false;
      if (this.engineLight) this.engineLight.intensity = 0;

      const progress = Math.min(1, this.landingPhaseElapsed / 2.6);

      // Low-Angle Slow Hero Orbit Camera
      if (this.camera) {
        const heroAngle = 0.35 + progress * Math.PI * 0.35;
        this.camera.position.set(
          Math.sin(heroAngle) * 11.5,
          2.6 + Math.sin(progress * Math.PI * 0.5) * 0.6,
          Math.cos(heroAngle) * 11.5
        );
        this.camera.lookAt(0, this.touchdownRocketY + this.rocketCenterY, 0);
      }

      if (progress >= 1 && !this.hasRecordedVisit) {
        // Physical Settlement Validation
        const settled = Math.abs(this.rocket.position.y - this.touchdownRocketY) < 0.08 && Math.abs(this.currentVerticalSpeed) < 0.05;
        if (settled) {
          this.hasRecordedVisit = true;
          this.finishMissionSuccess();
        }
      }
    }
  }

  updateFlybyOrOrbit(dt) {
    this.timelineElapsed += dt;

    if (this.destinationId === "jupiter") {
      const progress = Math.min(1, this.timelineElapsed / 3.0);
      const altitude = progress * 20;
      this.rocket.rotation.z = Math.sin(progress * Math.PI) * 0.45;
      this.rocket.rotation.y += 0.015;

      if (this.destinationMesh) this.destinationMesh.rotation.y += 0.02;

      if (this.camera) {
        this.camera.position.set(8 * (1 - progress), altitude + 1, 9 + progress * 4);
        this.camera.lookAt(0, altitude, 0);
      }

      if (progress >= 1 && !this.hasRecordedVisit) {
        this.showMilestoneBanner("🪐 JUPITER FLYBY COMPLETE");
        this.hasRecordedVisit = true;
        this.finishMissionSuccess();
      }
    } else if (this.destinationId === "saturn") {
      const progress = Math.min(1, this.timelineElapsed / 3.2);
      const altitude = Math.sin(progress * Math.PI * 0.5) * 5;

      if (this.destinationMesh) this.destinationMesh.rotation.y += 0.012;

      if (this.camera) {
        const angle = progress * Math.PI * 0.7;
        this.camera.position.set(Math.sin(angle) * 10, altitude + 0.6, Math.cos(angle) * 10);
        this.camera.lookAt(0, altitude + 1.2, 0);
      }

      if (progress >= 1 && !this.hasRecordedVisit) {
        this.showMilestoneBanner("🪐 SATURN RING ORBIT ACHIEVED");
        this.hasRecordedVisit = true;
        this.finishMissionSuccess();
      }
    } else {
      const progress = Math.min(1, this.timelineElapsed / 2.8);
      if (this.destinationMesh) this.destinationMesh.rotation.y += 0.015;

      if (this.camera) {
        const camAngle = progress * Math.PI * 0.6;
        this.camera.position.set(Math.sin(camAngle) * 8, 1, Math.cos(camAngle) * 8);
        this.camera.lookAt(0, 1.5, 0);
      }

      if (progress >= 1 && !this.hasRecordedVisit) {
        this.hasRecordedVisit = true;
        this.finishMissionSuccess();
      }
    }
  }

  /**
   * Unified Launch & Interplanetary Timeline Loop
   */
  updateTimeline(dt) {
    if (!this.rocket || this.currentStage === "idle" || this.currentStage === "checking" || this.currentStage === "countdown") {
      return;
    }

    const isReducedMotion = window.storageManager ? window.storageManager.get("reducedMotion") : false;

    // 1. Liftoff Stage (0 - 45m, ~3.0s)
    if (this.currentStage === "liftoff") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 3.0);
      const altitude = progress * progress * 45;
      this.rocket.position.y = altitude;

      if (!isReducedMotion) {
        this.cameraShakeIntensity = 0.2 * (1 - progress * 0.5);
      }

      if (this.scene) {
        this.scene.background = new THREE.Color(0x0f172a).lerp(new THREE.Color(0x0284c7), progress);
      }

      if (this.camera) {
        this.camera.position.set(0, altitude + 1.6, 9.5);
        this.camera.lookAt(0, altitude + 3.0, 0);
      }

      if (progress >= 1) {
        this.currentStage = "atmospheric";
        this.timelineElapsed = 0;
      }
    }

    // 2. Atmospheric Ascent (45 - 120m, ~3.0s)
    else if (this.currentStage === "atmospheric") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 3.0);
      const altitude = 45 + progress * 75;
      this.rocket.position.y = altitude;

      if (!isReducedMotion) {
        this.cameraShakeIntensity = 0.1 * (1 - progress);
      }

      if (this.scene) {
        const skyCol = new THREE.Color(0x0284c7).lerp(new THREE.Color(0x0b0e1b), progress);
        this.scene.background = skyCol;
        this.scene.fog = new THREE.FogExp2(0x0b0e1b, 0.015 * (1 - progress));
      }

      if (this.camera) {
        this.camera.position.set(4 * progress, altitude + 1.2, 11 - 2 * progress);
        this.camera.lookAt(0, altitude + 2.5, 0);
      }

      if (progress >= 1) {
        this.currentStage = "earthOrbit";
        this.timelineElapsed = 0;
        if (this.earthMesh) this.earthMesh.visible = true;
        this.showMilestoneBanner(window.i18n ? window.i18n.t("orbitAchievedBanner") : "🌍 ORBIT ACHIEVED");
        if (window.audioManager) window.audioManager.playUnlock();
      }
    }

    // 3. Earth Orbit Insertion (120 - 160m, ~1.8s)
    else if (this.currentStage === "earthOrbit") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 1.8);
      const altitude = 120 + progress * 40;
      this.rocket.position.y = altitude;
      this.cameraShakeIntensity = 0;

      if (this.camera) {
        this.camera.position.set(6, altitude - 1.5, 12);
        this.camera.lookAt(0, altitude, 0);
      }

      if (progress >= 1) {
        this.currentStage = "transfer";
        this.timelineElapsed = 0;
        this.showMilestoneBanner(window.i18n ? window.i18n.t("transferBurnBanner") : "🚀 HYPER-DRIVE TRANSFER BURN");
        if (this.destinationMesh) this.destinationMesh.visible = true;
      }
    }

    // 4. Interplanetary Transfer (160 - 220m, ~2.5s)
    else if (this.currentStage === "transfer") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 2.5);
      const altitude = 160 + progress * 60;
      this.rocket.position.y = altitude;

      if (this.camera) {
        if (!isReducedMotion) {
          this.camera.fov = 50 + Math.sin(progress * Math.PI) * 18;
          this.camera.updateProjectionMatrix();
        }
        this.camera.position.set(0, altitude + 2, 7.5);
        this.camera.lookAt(0, altitude + 12, 0);
      }

      if (this.destinationMesh) {
        this.destinationMesh.rotation.y += 0.012;
      }

      if (progress >= 1) {
        this.currentStage = "destinationApproach";
        this.timelineElapsed = 0;
        if (this.camera) {
          this.camera.fov = 50;
          this.camera.updateProjectionMatrix();
        }
      }
    }

    // 5. Cinematic Planet Approach (Planet distance closes in from 140 to 55)
    else if (this.currentStage === "destinationApproach") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 2.5);

      if (this.destinationMesh) {
        // Interpolate distance from -140 to -55 and scale up
        const distZ = -140 + progress * 85;
        this.destinationMesh.position.z = distZ;
        this.destinationMesh.rotation.y += 0.015;
        const s = 0.6 + progress * 1.0;
        this.destinationMesh.scale.set(s, s, s);
      }

      if (this.camera) {
        const camAngle = progress * Math.PI * 0.4;
        this.camera.position.set(Math.sin(camAngle) * 8, 2, Math.cos(camAngle) * 8 + 3);
        this.camera.lookAt(0, 0, 0);
      }

      if (progress >= 1) {
        const isLanding = CONFIG.DESTINATIONS[this.destinationId]?.type === "landing";
        if (isLanding) {
          this.transitionToSurfaceScene();
        } else {
          this.currentStage = "destinationAction";
          this.timelineElapsed = 0;
        }
      }
    }

    // 6. Destination Specific Action (Landing or Flyby/Orbit)
    else if (this.currentStage === "destinationAction") {
      this.updateLandingSystem(dt);
    }
  }

  /**
   * Final Climax: Show Victory Banner with [View Results] & [Replay Landing] buttons
   */
  finishMissionSuccess() {
    this.currentStage = "missionComplete";

    if (window.profileManager) {
      window.profileManager.recordDestinationVisited(this.destinationId);
      const active = window.profileManager.getActiveProfile();
      if (active) {
        active.gamesCompleted = (active.gamesCompleted || 0) + 1;
        window.profileManager.save();
      }
    }

    const t = setTimeout(() => {
      document.getElementById("space-victory-banner")?.classList.remove("hidden");
      document.getElementById("victory-badge-notice")?.classList.remove("hidden");

      if (window.game) {
        window.game.setGameState(GAME_STATES.MISSION_COMPLETE);
      }

      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }, 1200);
    this.timeouts.push(t);
  }

  /**
   * Replay Landing Descent from start of surface scene
   */
  replayLanding() {
    document.getElementById("space-victory-banner")?.classList.add("hidden");
    document.getElementById("touchdown-banner")?.classList.add("hidden");

    this.hasRecordedVisit = true;
    this.rocket.position.set(0, 32, 0);
    this.rocket.rotation.set(0, 0, 0);
    if (this.flameMesh) this.flameMesh.visible = true;
    if (this.engineLight) this.engineLight.intensity = 4.0;

    this.camera.position.set(14, 12, 22);
    this.camera.lookAt(0, 10, 0);

    this.currentStage = "destinationAction";
    this.landingPhase = "highDescent";
    this.landingPhaseElapsed = 0;
  }

  /**
   * Developer Shortcut to jump directly to any mission stage
   */
  jumpToStage(stageName, destId = "moon") {
    this.initScene("canvas-container-launch", destId);
    document.getElementById("launch-checklist")?.classList.add("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");

    if (stageName === "approach") {
      this.currentStage = "destinationApproach";
      this.timelineElapsed = 1.0;
      if (this.destinationMesh) this.destinationMesh.visible = true;
    } else if (stageName === "landing") {
      this.transitionToSurfaceScene();
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
      <div><strong>[LANDING DEBUG TELEMETRY]</strong></div>
      <div>GROUND_Y: ${this.GROUND_Y.toFixed(2)} | Target: (0,0,0)</div>
      <div>Rocket Y: ${rY} | Base Y: ${rBaseY}</div>
      <div>Touchdown Y: ${this.touchdownRocketY.toFixed(2)} (Height: ${this.rocketHeight.toFixed(2)})</div>
      <div>Distance to Ground: ${distToGround}m</div>
      <div>Phase: ${this.landingPhase} (${this.landingPhaseElapsed.toFixed(1)}s)</div>
      <div>Speed: ${this.currentVerticalSpeed.toFixed(2)} m/s</div>
      <div>Camera: ${camPos}</div>
    `;
  }

  animate() {
    this.animationId = this.requestTrackedRaf(() => this.animate());

    const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    const dt = this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 0.016;
    this.lastTime = now;

    this.updateTimeline(dt);
    this.updateDebugHUD();

    // Camera Shake
    if (this.cameraShakeIntensity > 0 && this.camera) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
    }

    // Engine Flame Flicker
    if (this.flameMesh && this.flameMesh.visible) {
      const flicker = 1.0 + Math.sin(now * 0.04) * 0.15;
      const baseScaleY = this.flameMesh.scale.y || 1.0;
      this.flameMesh.scale.y = baseScaleY * flicker;
    }

    // Smoke Particles
    this.smokePool.forEach(p => {
      if (p.mesh.visible && p.life > 0) {
        p.life--;
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        const s = (1 - p.life / p.maxLife) * 2.2 + 0.8;
        p.mesh.scale.set(s, s, s);
        if (p.life <= 0) p.mesh.visible = false;
      }
    });

    // Radial Landing Dust Particles
    this.dustPool.forEach(p => {
      if (p.mesh.visible && p.life > 0) {
        p.life--;
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        const s = (1 - p.life / p.maxLife) * 2.8 + 0.5;
        p.mesh.scale.set(s, s, s);
        if (p.life <= 0) p.mesh.visible = false;
      }
    });

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  disposeObject3D(obj) {
    if (!obj) return;
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
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

    if (this.destinationMesh && this.scene) {
      this.scene.remove(this.destinationMesh);
      this.disposeObject3D(this.destinationMesh);
      this.destinationMesh = null;
    }

    this.smokePool.forEach(p => {
      if (p.mesh && this.scene) this.scene.remove(p.mesh);
    });
    this.smokePool = [];

    this.dustPool.forEach(p => {
      if (p.mesh && this.scene) this.scene.remove(p.mesh);
    });
    this.dustPool = [];

    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.remove) this.renderer.domElement.remove();
      if (this.renderer.dispose) this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
  }

  onWindowResize(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !this.renderer || !this.camera) return;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.launchSequence = new LaunchSequence();
