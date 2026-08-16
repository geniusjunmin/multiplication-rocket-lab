/**
 * Multiplication Rocket Lab - Extended Cinematic Interplanetary Launch Engine (js/launch.js)
 * Version 3.0.0 Prolonged Cinematic Voyage & Dopamine Reward System
 */
class LaunchSequence {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rocket = null;
    this.flameMesh = null;
    this.smokePool = [];
    this.starsGroup = null;
    this.earthMesh = null;
    this.destinationMesh = null;
    this.saturnRingMesh = null;
    this.cloudsGroup = null;
    
    this.animationId = null;
    this.currentStage = "idle";
    this.countdownValue = 5;
    this.countdownTimer = null;
    this.timeouts = [];
    this.cameraShakeIntensity = 0;
    this.flightSpeedometer = 0;

    this.destinationId = "moon";
    this.graphicsQuality = "auto";
  }

  initScene(containerId, destId = "moon") {
    this.destroy();
    this.destinationId = destId;

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    if (!window.WebGLRenderingContext) return;

    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0f172a);
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

      this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
      this.camera.position.set(0, 1.5, 9);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(this.renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(10, 20, 15);
      this.scene.add(dirLight);

      this.engineLight = new THREE.PointLight(0xff4500, 0, 30);
      this.engineLight.position.set(0, -2, 0);
      this.scene.add(this.engineLight);

      this.createLaunchPad();
      this.createCloudLayer();
      this.createSpaceEnvironment();
      this.createDestinationPlanet(destId);
      this.createRocketCopy();

      this.resetHUDUI();
      this.animate();
    } catch (e) {
      console.warn("LaunchSequence WebGL Init Error:", e);
    }
  }

  resetHUDUI() {
    document.getElementById("launch-checklist")?.classList.remove("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");
    document.getElementById("space-victory-banner")?.classList.add("hidden");

    const checkItems = [
      { id: 1, text: "⚙️ Guidance & Navigation", status: "Checking..." },
      { id: 2, text: "🔥 Engine Ignition System", status: "Standby" },
      { id: 3, text: "⛽ Math High-Energy Fuel", status: "Standby" },
      { id: 4, text: "🛰️ Math Core Processor", status: "Standby" }
    ];

    checkItems.forEach(item => {
      const el = document.getElementById(`check-item-${item.id}`);
      if (el) {
        const stEl = el.querySelector(".status");
        if (stEl) {
          stEl.innerText = item.status;
          stEl.style.color = "";
        }
      }
    });
  }

  createLaunchPad() {
    this.launchPadGroup = new THREE.Group();

    const padGeo = new THREE.CylinderGeometry(6, 6.5, 0.6, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = -2.3;
    this.launchPadGroup.add(pad);

    const towerGeo = new THREE.BoxGeometry(0.8, 14, 0.8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-2.5, 4.5, -1);
    this.launchPadGroup.add(tower);

    this.scene.add(this.launchPadGroup);
  }

  createCloudLayer() {
    this.cloudsGroup = new THREE.Group();
    const cloudGeo = new THREE.SphereGeometry(3, 16, 16);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

    for (let i = 0; i < 20; i++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 60,
        35 + Math.random() * 20,
        (Math.random() - 0.5) * 60
      );
      this.cloudsGroup.add(cloud);
    }
    this.scene.add(this.cloudsGroup);
  }

  createSpaceEnvironment() {
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 500;
      positions[i + 1] = Math.random() * 500 + 40;
      positions[i + 2] = (Math.random() - 0.5) * 500;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.0, transparent: true, opacity: 0.95 });
    this.starsGroup = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.starsGroup);

    const earthGeo = new THREE.SphereGeometry(65, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.position.set(0, -70, -35);
    this.earthMesh.visible = false;
    this.scene.add(this.earthMesh);
  }

  createDestinationPlanet(destId) {
    if (this.destinationMesh && this.scene) {
      this.scene.remove(this.destinationMesh);
    }

    const planetGroup = new THREE.Group();

    switch (destId) {
      case "moon": {
        const geo = new THREE.SphereGeometry(28, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      case "mars": {
        const geo = new THREE.SphereGeometry(32, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      case "jupiter": {
        const geo = new THREE.SphereGeometry(50, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      case "saturn": {
        const planetGeo = new THREE.SphereGeometry(38, 64, 64);
        const planetMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetGroup.add(planetMesh);

        // 3D Translucent Multi-Tiered RingGeometry
        const ringGeo = new THREE.RingGeometry(48, 85, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        this.saturnRingMesh = new THREE.Mesh(ringGeo, ringMat);
        this.saturnRingMesh.rotation.x = Math.PI / 2.3;
        planetGroup.add(this.saturnRingMesh);
        break;
      }
      case "deepSpace": {
        const geo = new THREE.OctahedronGeometry(35, 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0x818cf8, wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      default:
        break;
    }

    this.destinationMesh = planetGroup;
    this.destinationMesh.position.set(0, 220, -120);
    this.destinationMesh.visible = false;
    this.scene.add(this.destinationMesh);
  }

  createRocketCopy() {
    if (window.rocketBuilder) {
      window.rocketBuilder.buildCurrentRocket();
      this.rocket = window.rocketBuilder.rocketGroup.clone();
      this.rocket.position.set(0, 0, 0);
      if (this.scene && this.rocket) {
        this.scene.add(this.rocket);
      }

      this.rocket.children.forEach(child => child.visible = true);

      // Multi-layer engine flame
      const flameGroup = new THREE.Group();

      const innerFlameGeo = new THREE.ConeGeometry(0.5, 3.0, 32);
      innerFlameGeo.rotateX(Math.PI);
      const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const innerMesh = new THREE.Mesh(innerFlameGeo, innerMat);
      flameGroup.add(innerMesh);

      const outerFlameGeo = new THREE.ConeGeometry(0.9, 4.2, 32);
      outerFlameGeo.rotateX(Math.PI);
      const outerMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.85 });
      const outerMesh = new THREE.Mesh(outerFlameGeo, outerMat);
      flameGroup.add(outerMesh);

      flameGroup.position.set(0, -2.8, 0);
      flameGroup.visible = false;
      this.flameMesh = flameGroup;
      this.rocket.add(this.flameMesh);
    }
  }

  startLaunchSequence(onComplete) {
    this.currentStage = "checking";
    this.resetHUDUI();
    
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
          this.triggerExtendedVoyage(onComplete);
        });
      });
    }, 1400);
    this.timeouts.push(t2);
  }

  startCountdown(onFinished) {
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
    if (this.engineLight) this.engineLight.intensity = 6.0;
    this.cameraShakeIntensity = 0.2;

    if (window.audioManager) window.audioManager.playIgnition();

    const t = setTimeout(() => {
      if (onFinished) onFinished();
    }, 1000);
    this.timeouts.push(t);
  }

  /**
   * Prolonged Multi-Stage Cinematic Voyage for Dopamine Rewards (15-20s Journey)
   */
  triggerExtendedVoyage(onComplete) {
    this.currentStage = "liftoff";
    let speed = 0.06;
    let altitude = 0;

    const voyageLoop = () => {
      if (!this.rocket) return;

      altitude += speed;
      this.rocket.position.y = altitude;
      speed += 0.008;

      // Stage 1: Liftoff & Atmospheric Breakout
      if (altitude < 40) {
        if (this.camera) {
          this.camera.position.set(0, altitude + 1.5, 9);
          this.camera.lookAt(0, altitude + 3, 0);
        }
        // Sky transition: Azure Blue ➔ Stratosphere Dark Blue
        if (this.scene) {
          const ratio = altitude / 40;
          this.scene.background = new THREE.Color(0x0f172a).lerp(new THREE.Color(0x020617), ratio);
        }
      } 
      // Stage 2: Low Earth Orbit & Transfer Burn (Speedometer acceleration!)
      else if (altitude >= 40 && altitude < 120) {
        if (this.currentStage !== "orbit") {
          this.currentStage = "orbit";
          if (this.scene) this.scene.fog = new THREE.FogExp2(0x000000, 0.0008);
          if (this.earthMesh) this.earthMesh.visible = true;
          this.cameraShakeIntensity = 0.05;
        }

        if (this.camera) {
          this.camera.position.set(5, altitude - 2, 12);
          this.camera.lookAt(0, altitude, 0);
        }
      } 
      // Stage 3: Hyper-Warp Interplanetary Transfer & Star Streaks
      else if (altitude >= 120 && altitude < 200) {
        if (this.currentStage !== "transfer") {
          this.currentStage = "transfer";
          if (this.destinationMesh) this.destinationMesh.visible = true;
        }

        // Camera dramatic glide
        if (this.camera) {
          this.camera.position.set(0, altitude + 2, 6);
          this.camera.lookAt(0, altitude + 10, 0);
        }
        if (this.destinationMesh) {
          this.destinationMesh.rotation.y += 0.01;
        }
      } 
      // Stage 4: Destination Arrival & Orbital Insertion Flyby
      else if (altitude >= 200) {
        if (this.currentStage !== "space") {
          this.currentStage = "space";
          this.cameraShakeIntensity = 0;

          document.getElementById("space-victory-banner")?.classList.remove("hidden");
          if (window.audioManager) window.audioManager.playVictory();
          if (window.profileManager) window.profileManager.recordDestinationVisited(this.destinationId);

          if (onComplete) onComplete();
        }

        if (this.destinationMesh) {
          this.destinationMesh.rotation.y += 0.015;
        }
      }

      if (altitude < 240) {
        requestAnimationFrame(voyageLoop);
      }
    };
    voyageLoop();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.cameraShakeIntensity > 0 && this.camera) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
    }

    if (this.flameMesh && this.flameMesh.visible) {
      this.flameMesh.scale.y = 1 + Math.sin(Date.now() * 0.03) * 0.3;
    }

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
    if (this.renderer) {
      if (this.renderer.domElement) this.renderer.domElement.remove();
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
  }
}

window.launchSequence = new LaunchSequence();
