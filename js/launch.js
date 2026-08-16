/**
 * Multiplication Rocket Lab - Cinematic Interplanetary Launch Engine (js/launch.js)
 * Version 3.0.0 Unified Timeline Engine, High-Fidelity Celestial VFX & Dopamine Reward System
 */
class LaunchSequence {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rocket = null;
    this.flameMesh = null;
    this.engineLight = null;

    this.smokePool = [];
    this.sparksPool = [];
    this.starsGroup = null;
    this.starPositions = null;
    this.earthMesh = null;
    this.destinationMesh = null;
    this.saturnRingMesh = null;
    this.cloudsGroup = null;
    this.moonsGroup = null;

    this.animationId = null;
    this.lastTime = 0;
    this.timelineElapsed = 0;
    this.currentStage = "idle"; // idle | checking | countdown | ignition | liftoff | atmospheric | orbit | warp | arrival | complete
    this.countdownValue = 5;
    this.countdownTimer = null;
    this.timeouts = [];
    
    this.cameraShakeIntensity = 0;
    this.cameraTargetPos = { x: 0, y: 1.5, z: 9 };
    this.cameraLookAtPos = { x: 0, y: 3, z: 0 };
    
    this.destinationId = "moon";
    this.hasRecordedVisit = false;
    this.onCompleteCallback = null;

    this.boundVisibilityHandler = null;
    this.boundResizeHandler = null;
  }

  initScene(containerId, destId = "moon") {
    this.destroy();
    this.destinationId = destId;
    this.hasRecordedVisit = false;

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

      this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2500);
      this.camera.position.set(0, 1.5, 9);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  resetHUDUI() {
    document.getElementById("launch-checklist")?.classList.remove("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");
    document.getElementById("space-victory-banner")?.classList.add("hidden");
    document.getElementById("launch-stage-banner")?.classList.add("hidden");

    const checkItems = [
      { id: 1, textEn: "⚙️ Guidance & Navigation", textZh: "⚙️ 姿态与航向导航" },
      { id: 2, textEn: "🔥 Engine Ignition System", textZh: "🔥 主发动机点火器" },
      { id: 3, textEn: "⛽ Math High-Energy Fuel", textZh: "⛽ 高能乘法燃料" },
      { id: 4, textEn: "🛰️ Math Core Processor", textZh: "🛰️ 数学核心处理器" }
    ];

    const isZh = window.i18n && window.i18n.currentLanguage === "zh";

    checkItems.forEach(item => {
      const el = document.getElementById(`check-item-${item.id}`);
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
    const starCount = 2400;
    const starsGeo = new THREE.BufferGeometry();
    this.starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      this.starPositions[i] = (Math.random() - 0.5) * 600;
      this.starPositions[i + 1] = Math.random() * 600 + 30;
      this.starPositions[i + 2] = (Math.random() - 0.5) * 600;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(this.starPositions, 3));

    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.95 });
    this.starsGroup = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.starsGroup);

    // High-Fidelity Earth Sphere with Atmosphere Glow
    const earthGroup = new THREE.Group();
    const earthGeo = new THREE.SphereGeometry(68, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.1 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Atmosphere Rim Glow
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

        // Mars Atmosphere Glow
        const atmoGeo = new THREE.SphereGeometry(36, 32, 32);
        const atmoMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.25, side: THREE.BackSide });
        planetGroup.add(new THREE.Mesh(atmoGeo, atmoMat));
        break;
      }
      case "jupiter": {
        const jupGeo = new THREE.SphereGeometry(52, 64, 64);
        const jupMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
        const jupMesh = new THREE.Mesh(jupGeo, jupMat);
        planetGroup.add(jupMesh);

        // Orbiting Moons
        const moon1 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
        moon1.position.set(-75, 15, -20);
        planetGroup.add(moon1);
        break;
      }
      case "saturn": {
        const satGeo = new THREE.SphereGeometry(40, 64, 64);
        const satMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
        const satMesh = new THREE.Mesh(satGeo, satMat);
        planetGroup.add(satMesh);

        // Multi-Layer Translucent Rings
        const innerRingGeo = new THREE.RingGeometry(48, 68, 64);
        const innerRingMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
        const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        innerRing.rotation.x = Math.PI / 2.3;
        planetGroup.add(innerRing);

        const outerRingGeo = new THREE.RingGeometry(72, 92, 64);
        const outerRingMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
        const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        outerRing.rotation.x = Math.PI / 2.3;
        planetGroup.add(outerRing);

        this.saturnRingMesh = innerRing;
        break;
      }
      case "deepSpace": {
        const coreGeo = new THREE.OctahedronGeometry(36, 4);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x818cf8, wireframe: true });
        const core = new THREE.Mesh(coreGeo, coreMat);
        planetGroup.add(core);

        const nebGeo = new THREE.SphereGeometry(45, 16, 16);
        const nebMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true, transparent: true, opacity: 0.4 });
        planetGroup.add(new THREE.Mesh(nebGeo, nebMat));
        break;
      }
    }

    this.destinationMesh = planetGroup;
    this.destinationMesh.position.set(0, 240, -130);
    this.destinationMesh.visible = false;
    this.scene.add(this.destinationMesh);
  }

  createRocketCopy() {
    if (window.rocketBuilder) {
      window.rocketBuilder.buildCurrentRocket();
      this.rocket = window.rocketBuilder.rocketGroup.clone();
      this.rocket.position.set(0, 0, 0);

      // Make all parts visible for launch
      this.rocket.traverse(child => {
        child.visible = true;
      });

      if (this.scene && this.rocket) {
        this.scene.add(this.rocket);
      }

      // Multi-layer Engine Flame (White-hot core, orange main flame, red transparent plume)
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
    }
  }

  initParticlePools() {
    this.smokePool = [];
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
      }, (idx + 1) * 300);
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
    }, 1400);
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

    // Activate smoke pool around pad
    this.smokePool.forEach((p, idx) => {
      p.mesh.visible = true;
      p.mesh.position.set((Math.random() - 0.5) * 3, -2.2, (Math.random() - 0.5) * 3);
      p.life = p.maxLife;
    });

    if (window.audioManager) window.audioManager.playIgnition();

    const t = setTimeout(() => {
      if (onFinished) onFinished();
    }, 1000);
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

  /**
   * Single controlled animation timeline frame
   */
  updateTimeline(dt) {
    if (!this.rocket || this.currentStage === "idle" || this.currentStage === "checking" || this.currentStage === "countdown") {
      return;
    }

    const isReducedMotion = window.storageManager ? window.storageManager.get("reducedMotion") : false;

    // 1. Liftoff Stage (0 - 45m Altitude, ~0 - 3.5s)
    if (this.currentStage === "liftoff") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 3.5);
      const altitude = progress * progress * 45;
      this.rocket.position.y = altitude;

      if (!isReducedMotion) {
        this.cameraShakeIntensity = 0.2 * (1 - progress * 0.5);
      }

      // Smooth Sky Color: Dark Blue -> Azure
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

    // 2. Atmospheric Ascent (45 - 120m Altitude, ~3.5 - 7.0s)
    else if (this.currentStage === "atmospheric") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 3.5);
      const altitude = 45 + progress * 75;
      this.rocket.position.y = altitude;

      if (!isReducedMotion) {
        this.cameraShakeIntensity = 0.1 * (1 - progress);
      }

      // Sky Color: Azure Blue -> Stratosphere Dark Purple -> Black
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
        this.currentStage = "orbit";
        this.timelineElapsed = 0;
        if (this.earthMesh) this.earthMesh.visible = true;
        this.showMilestoneBanner(window.i18n ? window.i18n.t("orbitAchievedBanner") : "🌍 ORBIT ACHIEVED");
        if (window.audioManager) window.audioManager.playUnlock();
      }
    }

    // 3. Orbit Insertion (120 - 160m, ~1.8s)
    else if (this.currentStage === "orbit") {
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
        this.currentStage = "warp";
        this.timelineElapsed = 0;
        this.showMilestoneBanner(window.i18n ? window.i18n.t("transferBurnBanner") : "🚀 HYPER-DRIVE TRANSFER BURN");
        if (this.destinationMesh) this.destinationMesh.visible = true;
      }
    }

    // 4. Hyper-Drive Transfer Burn (160 - 230m, ~3.0s)
    else if (this.currentStage === "warp") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 3.0);
      const altitude = 160 + progress * 70;
      this.rocket.position.y = altitude;

      // Camera dynamic warp follow
      if (this.camera) {
        if (!isReducedMotion) {
          this.camera.fov = 50 + Math.sin(progress * Math.PI) * 20;
          this.camera.updateProjectionMatrix();
        }
        this.camera.position.set(0, altitude + 2, 7.5);
        this.camera.lookAt(0, altitude + 12, 0);
      }

      if (this.destinationMesh) {
        this.destinationMesh.rotation.y += 0.012;
      }

      if (progress >= 1) {
        this.currentStage = "arrival";
        this.timelineElapsed = 0;
        if (this.camera) {
          this.camera.fov = 50;
          this.camera.updateProjectionMatrix();
        }
      }
    }

    // 5. Planetary Arrival & Flyby Climax
    else if (this.currentStage === "arrival") {
      this.timelineElapsed += dt;
      const progress = Math.min(1, this.timelineElapsed / 2.5);
      const altitude = 230 + Math.min( progress * 15, 15);
      this.rocket.position.y = altitude;

      // Rocket banking into planetary orbit
      this.rocket.rotation.z = Math.sin(progress * Math.PI * 0.5) * 0.4;
      this.rocket.rotation.y += 0.01;

      if (this.destinationMesh) {
        this.destinationMesh.rotation.y += 0.015;
      }

      if (this.camera) {
        const camAngle = progress * Math.PI * 0.6;
        this.camera.position.set(Math.sin(camAngle) * 8, altitude + 1, Math.cos(camAngle) * 8);
        this.camera.lookAt(0, altitude + 1.5, 0);
      }

      if (progress >= 1 && !this.hasRecordedVisit) {
        this.hasRecordedVisit = true;
        this.currentStage = "complete";

        document.getElementById("space-victory-banner")?.classList.remove("hidden");
        document.getElementById("victory-badge-notice")?.classList.remove("hidden");
        
        if (window.audioManager) window.audioManager.playVictory();
        if (window.profileManager) {
          window.profileManager.recordDestinationVisited(this.destinationId);
          const active = window.profileManager.getActiveProfile();
          if (active) {
            active.gamesCompleted = (active.gamesCompleted || 0) + 1;
            window.profileManager.save();
          }
        }

        if (this.onCompleteCallback) this.onCompleteCallback();
      }
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    const dt = this.lastTime ? Math.min(0.1, (now - this.lastTime) / 1000) : 0.016;
    this.lastTime = now;

    this.updateTimeline(dt);

    // Camera Shake
    if (this.cameraShakeIntensity > 0 && this.camera) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
    }

    // Engine Flame Flicker
    if (this.flameMesh && this.flameMesh.visible) {
      const flicker = 1.0 + Math.sin(now * 0.04) * 0.25;
      this.flameMesh.scale.set(1, flicker, 1);
    }

    // Smoke Particles Animation
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
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.rocket && this.scene) {
      this.scene.remove(this.rocket);
      this.disposeObject3D(this.rocket);
      this.rocket = null;
    }
    this.smokePool.forEach(p => {
      if (p.mesh && this.scene) this.scene.remove(p.mesh);
    });
    this.smokePool = [];

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
