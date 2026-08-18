/**
 * Multiplication Rocket Lab - Three.js 3D Rocket Engine & Procedural Models (js/rocket.js)
 * High-Fidelity Multi-Layer Procedural Models, Independent Detached Factory, Dynamic Camera Auto-Fit,
 * Quaternion Snapping VFX & Leak-Free Lifecycle Management
 */
class RocketBuilder {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.rocketGroup = null;
    this.animationId = null;
    this.boundResizeHandler = null;

    this.currentModel = "classic";
    this.currentTheme = "explorer";
    this.isShowcase = false;
    this.currentContainerId = null;

    this.partDefinitions = [
      { id: "body", nameEn: "Rocket Body", nameZh: "主火箭箭体", icon: "🚀" },
      { id: "noseCone", nameEn: "Nose Cone", nameZh: "整流防护罩", icon: "🔺" },
      { id: "leftBooster", nameEn: "Left Booster", nameZh: "左侧助推器", icon: "🛰️" },
      { id: "rightBooster", nameEn: "Right Booster", nameZh: "右侧助推器", icon: "🛰️" },
      { id: "leftFin", nameEn: "Left Aero Fin", nameZh: "左侧气动翼", icon: "📐" },
      { id: "rightFin", nameEn: "Right Aero Fin", nameZh: "右侧气动翼", icon: "📐" },
      { id: "engine", nameEn: "Main Engine", nameZh: "主推进引擎", icon: "🔥" },
      { id: "window", nameEn: "Porthole Window", nameZh: "观察舷窗", icon: "👁️" },
      { id: "fuelTank", nameEn: "Fuel Tank", nameZh: "乘法燃料舱", icon: "⛽" },
      { id: "controlModule", nameEn: "Guidance Module", nameZh: "智能导航舱", icon: "🧭" }
    ];

    this.parts = {};
    this.targetTransforms = {};
    this.isSpinningCelebration = false;
    this.isSequentialAssembling = false;

    // Tracked animation frame IDs and timeouts for leak-free disposal
    this.activeRafs = new Set();
    this.activeTimeouts = new Set();

    this.themeColors = {
      explorer: { body: 0xf8fafc, nose: 0x0284c7, fin: 0x38bdf8, engine: 0xe11d48, accent: 0xf59e0b, dark: 0x1e293b },
      fire: { body: 0x1e293b, nose: 0xef4444, fin: 0xf97316, engine: 0xd97706, accent: 0xfacc15, dark: 0x0f172a },
      forest: { body: 0xf1f5f9, nose: 0x059669, fin: 0x10b981, engine: 0x047857, accent: 0x34d399, dark: 0x064e3b },
      lightning: { body: 0x0f172a, nose: 0xeab308, fin: 0xa855f7, engine: 0xec4899, accent: 0x38bdf8, dark: 0x1e1b4b },
      galaxy: { body: 0x1e1b4b, nose: 0x818cf8, fin: 0xc084fc, engine: 0x4f46e5, accent: 0x38bdf8, dark: 0x0f172a },
      lunar_white: { body: 0xffffff, nose: 0xe2e8f0, fin: 0x94a3b8, engine: 0x64748b, accent: 0x38bdf8, dark: 0x334155 },
      mars_rover_red: { body: 0x7c2d12, nose: 0xef4444, fin: 0xf97316, engine: 0xb45309, accent: 0xfde047, dark: 0x451a03 }
    };

    // True 3D Assembly Platform Framework
    this.ASSEMBLY_PLATFORM_TOP_Y = -2.6;
    this.platformGroup = null;
    this.assemblyReferenceBounds = null;
    this.isAssemblyDebug = false;
  }

  checkDebugFlags() {
    if (typeof window !== "undefined" && window.location && window.location.search) {
      const qs = window.location.search;
      this.isAssemblyDebug = qs.includes("assemblyDebug=1");
    }
    const debugEl = document.getElementById("assembly-debug-hud");
    if (debugEl) {
      if (this.isAssemblyDebug) debugEl.classList.remove("hidden");
      else debugEl.classList.add("hidden");
    }
  }

  // Helper methods for tracked timer management
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

  setTrackedTimeout(callback, delayMs) {
    const tid = setTimeout(() => {
      this.activeTimeouts.delete(tid);
      callback();
    }, delayMs);
    this.activeTimeouts.add(tid);
    return tid;
  }

  clearTrackedTimeout(tid) {
    if (!tid) return;
    this.activeTimeouts.delete(tid);
    clearTimeout(tid);
  }

  createAssemblyPlatform() {
    if (this.platformGroup && this.scene) {
      this.scene.remove(this.platformGroup);
      this.disposeObject3D(this.platformGroup);
      this.platformGroup = null;
    }

    this.platformGroup = new THREE.Group();

    // 1. Heavy Chamfered Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(3.6, 3.9, 0.45, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, this.ASSEMBLY_PLATFORM_TOP_Y - 0.225, 0);
    this.platformGroup.add(baseMesh);

    // 2. Beveled Metallic Outer Rim
    const rimGeo = new THREE.TorusGeometry(3.6, 0.08, 16, 48);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.15
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, this.ASSEMBLY_PLATFORM_TOP_Y, 0);
    this.platformGroup.add(rimMesh);

    // 3. Glowing Inner Cyan LED Strip
    const innerLedGeo = new THREE.TorusGeometry(2.4, 0.06, 16, 48);
    const innerLedMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });
    const innerLedMesh = new THREE.Mesh(innerLedGeo, innerLedMat);
    innerLedMesh.rotation.x = Math.PI / 2;
    innerLedMesh.position.set(0, this.ASSEMBLY_PLATFORM_TOP_Y + 0.01, 0);
    this.platformGroup.add(innerLedMesh);

    // 4. Subtle Platform Illumination PointLight
    const pLight = new THREE.PointLight(0x38bdf8, 0.7, 8);
    pLight.position.set(0, this.ASSEMBLY_PLATFORM_TOP_Y + 0.6, 0);
    this.platformGroup.add(pLight);

    if (this.scene) {
      this.scene.add(this.platformGroup);
    }
  }

  initScene(containerId) {
    this.destroy();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    
    // Calculate initial dimensions safely from container or parent
    const parent = container.parentElement;
    const width = container.clientWidth || (parent ? parent.clientWidth : 0) || window.innerWidth || 800;
    const height = container.clientHeight || (parent ? parent.clientHeight : 0) || 500;

    // Check WebGL availability
    if (!window.WebGLRenderingContext) {
      this.render2DFallback(container);
      return;
    }

    try {
      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      this.camera.position.set(0, 1.5, 9);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(this.renderer.domElement);

      if (window.THREE && window.THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(5, 10, 7);
      this.scene.add(dirLight);

      const pointLight = new THREE.PointLight(0x38bdf8, 0.6, 20);
      pointLight.position.set(-5, -2, -5);
      this.scene.add(pointLight);

      this.createAssemblyPlatform();
      this.currentContainerId = containerId;
      this.isShowcase = (containerId === "canvas-container-home" || containerId === "canvas-container-garage" || containerId === "canvas-container-unlock-modal");

      // Sync active model & theme from profile/storage if available
      if (window.storageManager) {
        this.currentModel = window.storageManager.get("currentRocketModel") || this.currentModel;
        this.currentTheme = window.storageManager.get("currentRocketTheme") || this.currentTheme;
      }

      this.buildCurrentRocket();

      // Modern ResizeObserver to auto-sync size on any viewport/layout change
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
            const w = entry.contentRect.width || container.clientWidth;
            const h = entry.contentRect.height || container.clientHeight;
            if (w > 0 && h > 0 && this.renderer && this.camera) {
              this.camera.aspect = w / h;
              this.camera.updateProjectionMatrix();
              this.renderer.setSize(w, h);
              this.fitAssemblyCamera();
            }
          }
        });
        this.resizeObserver.observe(container);
        if (parent) this.resizeObserver.observe(parent);
      }

      this.boundResizeHandler = () => this.onWindowResize(containerId);
      window.addEventListener("resize", this.boundResizeHandler);

      // Force a layout pass after next frame
      setTimeout(() => this.onWindowResize(containerId), 50);

      this.animate();
    } catch (e) {
      console.warn("RocketBuilder WebGL Init Error, activating 2D Fallback:", e);
      this.render2DFallback(container);
    }
  }

  render2DFallback(container) {
    container.innerHTML = `
      <div class="rocket-2d-fallback">
        <svg viewBox="0 0 200 300" width="100%" height="100%">
          <path d="M100 20 L140 80 L60 80 Z" fill="#0284c7" />
          <rect x="65" y="80" width="70" height="130" rx="5" fill="#f8fafc" stroke="#94a3b8" stroke-width="3" />
          <circle cx="100" cy="130" r="18" fill="#0f172a" stroke="#38bdf8" stroke-width="3" />
          <path d="M65 170 L40 220 L65 210 Z" fill="#38bdf8" />
          <path d="M135 170 L160 220 L135 210 Z" fill="#38bdf8" />
          <rect x="75" y="210" width="50" height="20" rx="3" fill="#e11d48" />
          <polygon points="85,230 100,270 115,230" fill="#f59e0b" />
        </svg>
      </div>
    `;
  }

  setModel(modelId) {
    this.currentModel = modelId;
    if (window.storageManager) window.storageManager.set("currentRocketModel", modelId);
    this.buildCurrentRocket();
  }

  setTheme(themeId) {
    if (this.themeColors[themeId]) {
      this.currentTheme = themeId;
      if (window.storageManager) window.storageManager.set("currentRocketTheme", themeId);
      this.buildCurrentRocket();
    }
  }

  saveTargetTransforms() {
    this.targetTransforms = {};
    Object.keys(this.parts).forEach(id => {
      const part = this.parts[id];
      if (part) {
        this.targetTransforms[id] = {
          position: part.position && part.position.clone ? part.position.clone() : { x: part.position?.x || 0, y: part.position?.y || 0, z: part.position?.z || 0 },
          rotation: part.rotation && part.rotation.clone ? part.rotation.clone() : { x: part.rotation?.x || 0, y: part.rotation?.y || 0, z: part.rotation?.z || 0 },
          quaternion: part.quaternion && part.quaternion.clone ? part.quaternion.clone() : { x: 0, y: 0, z: 0, w: 1 },
          scale: part.scale && part.scale.clone ? part.scale.clone() : { x: 1, y: 1, z: 1 }
        };
      }
    });
  }

  /**
   * Factory function that returns a completely decoupled, independent 3D rocket group
   * with its own geometries and materials for safe multi-scene rendering.
   */
  createDetachedRocket(modelId = this.currentModel, themeId = this.currentTheme) {
    const detached = new RocketBuilder();
    detached.currentModel = modelId;
    detached.currentTheme = themeId;
    detached.buildCurrentRocket();
    
    // Make all parts visible in detached flight rocket
    if (detached.parts) {
      Object.keys(detached.parts).forEach(k => {
        if (detached.parts[k]) detached.parts[k].visible = true;
      });
    }

    const group = detached.rocketGroup;
    detached.rocketGroup = null; // Prevent double disposal
    return group;
  }

  buildCustomRocketInstance(modelId = this.currentModel, themeId = this.currentTheme, payloadId = null) {
    return this.createDetachedRocket(modelId, themeId);
  }

  buildCurrentRocket() {
    if (this.rocketGroup && this.scene) {
      this.scene.remove(this.rocketGroup);
      this.disposeObject3D(this.rocketGroup);
    }

    this.rocketGroup = new THREE.Group();
    this.parts = {};

    switch (this.currentModel) {
      case "starship":
        this.createStarshipRocket();
        break;
      case "falconHeavy":
        this.createFalconHeavyRocket();
        break;
      case "longMarch":
        this.createLongMarchRocket();
        break;
      case "cyber":
        this.createCyberRocket();
        break;
      case "classic":
      default:
        this.createClassicRocket();
        break;
    }

    // Save accurate reference transforms for each part
    this.saveTargetTransforms();

    if (this.scene) {
      this.scene.add(this.rocketGroup);
      this.fitCameraToRocket();
    }

    if (this.isShowcase) {
      Object.keys(this.parts).forEach(key => {
        if (this.parts[key]) this.parts[key].visible = true;
      });
    } else {
      const installed = window.storageManager ? (window.storageManager.get("installedParts") || []) : [];
      this.updateInstalledParts(installed);
    }
  }

  alignRocketToPlatform() {
    if (!this.rocketGroup) return;

    try {
      if (typeof THREE !== "undefined" && THREE.Box3) {
        // Ensure accurate world matrix
        this.rocketGroup.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(this.rocketGroup);
        const center = box.getCenter(new THREE.Vector3());

        // 1. Center rocket horizontally strictly to (0, 0)
        this.rocketGroup.position.x -= center.x;
        this.rocketGroup.position.z -= center.z;
        this.rocketGroup.updateMatrixWorld(true);

        // 2. Align lowest physical bounding box point to platform top surface
        const centeredBox = new THREE.Box3().setFromObject(this.rocketGroup);
        const deltaY = this.ASSEMBLY_PLATFORM_TOP_Y - centeredBox.min.y;
        this.rocketGroup.position.y += deltaY;
        this.rocketGroup.updateMatrixWorld(true);

        const finalBox = new THREE.Box3().setFromObject(this.rocketGroup);
        const finalCenter = finalBox.getCenter(new THREE.Vector3());
        const finalSize = finalBox.getSize(new THREE.Vector3());

        this.assemblyReferenceBounds = {
          min: finalBox.min.clone(),
          max: finalBox.max.clone(),
          center: finalCenter.clone(),
          size: finalSize.clone(),
          visualCenterY: (finalBox.min.y + finalBox.max.y) / 2
        };
      }
    } catch (e) {
      console.warn("alignRocketToPlatform fallback:", e);
    }
  }

  fitAssemblyCamera() {
    if (!this.camera || !this.rocketGroup) return;

    try {
      const visualCenterY = this.assemblyReferenceBounds ? this.assemblyReferenceBounds.visualCenterY : 0.5;
      const height = this.assemblyReferenceBounds ? this.assemblyReferenceBounds.size.y : 6.5;
      const aspect = this.camera.aspect || 1.0;
      const fovRad = (this.camera.fov * Math.PI) / 180;
      
      // Calculate distance based on both height and width to prevent horizontal cutoffs
      const distY = (height / 2) / Math.tan(fovRad / 2);
      let distX = distY;
      if (aspect < 1.0) {
        distX = distY / aspect;
      }
      const distance = Math.max(9.5, Math.max(distY, distX) * 1.25);

      this.camera.position.set(0, visualCenterY + 0.35, distance);
      this.camera.lookAt(0, visualCenterY, 0);

      if (this.controls) {
        if (this.controls.target && this.controls.target.set) {
          this.controls.target.set(0, visualCenterY, 0);
        }
        this.controls.update();
      }
    } catch (e) {
      console.warn("fitAssemblyCamera fallback:", e);
    }
  }

  /**
   * Automatically adjusts rocket placement onto assembly platform and fits camera cleanly.
   */
  fitCameraToRocket() {
    this.alignRocketToPlatform();
    this.fitAssemblyCamera();
  }

  // ==========================================
  // 1. Classic Explorer Retro Rocket
  // ==========================================
  createClassicRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matBody = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.28, metalness: 0.15 });
    const matNose = new THREE.MeshStandardMaterial({ color: palette.nose, roughness: 0.2, metalness: 0.3 });
    const matFin = new THREE.MeshStandardMaterial({ color: palette.fin, roughness: 0.3, metalness: 0.2 });
    const matEngine = new THREE.MeshStandardMaterial({ color: palette.engine, roughness: 0.35, metalness: 0.8 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.accent, metalness: 0.5, roughness: 0.25 });
    const matDark = new THREE.MeshStandardMaterial({ color: palette.dark || 0x1e293b, roughness: 0.5 });

    // 1. Body: Main cylindrical hull with panel seams and reinforcement ribs
    const bodyGroup = new THREE.Group();
    const mainHull = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.8, 32), matBody);
    const rib1 = new THREE.Mesh(new THREE.TorusGeometry(1.21, 0.03, 16, 32), matDark);
    rib1.rotation.x = Math.PI / 2; rib1.position.y = 0.9;
    const rib2 = new THREE.Mesh(new THREE.TorusGeometry(1.21, 0.03, 16, 32), matDark);
    rib2.rotation.x = Math.PI / 2; rib2.position.y = -0.9;
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.21, 1.21, 0.3, 32), matFin);
    stripe.position.y = 0;
    bodyGroup.add(mainHull); bodyGroup.add(rib1); bodyGroup.add(rib2); bodyGroup.add(stripe);
    this.parts.body = bodyGroup;

    // 2. Nose Cone: Ogive nose with pitot tube & beacon light
    const noseGroup = new THREE.Group();
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.22, 2.2, 32), matNose);
    const tipProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.8, 16), matAccent);
    tipProbe.position.y = 1.35;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    beacon.position.y = 1.75;
    noseGroup.add(nose); noseGroup.add(tipProbe); noseGroup.add(beacon);
    noseGroup.position.y = 3.0;
    this.parts.noseCone = noseGroup;

    // 3. Left Booster: Strap-on booster with structural attachment struts
    const boostL = new THREE.Group();
    const cylL = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 3.0, 32), matBody);
    const coneL = new THREE.Mesh(new THREE.ConeGeometry(0.49, 1.0, 32), matNose);
    coneL.position.y = 2.0;
    const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.4, 16), matEngine);
    nozzleL.position.y = -1.7;
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.15), matDark);
    strutL.position.set(0.6, 0.4, 0);
    boostL.add(cylL); boostL.add(coneL); boostL.add(nozzleL); boostL.add(strutL);
    boostL.position.set(-1.6, -0.4, 0);
    this.parts.leftBooster = boostL;

    // 4. Right Booster
    const boostR = new THREE.Group();
    const cylR = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 3.0, 32), matBody);
    const coneR = new THREE.Mesh(new THREE.ConeGeometry(0.49, 1.0, 32), matNose);
    coneR.position.y = 2.0;
    const nozzleR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.4, 16), matEngine);
    nozzleR.position.y = -1.7;
    const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.15), matDark);
    strutR.position.set(-0.6, 0.4, 0);
    boostR.add(cylR); boostR.add(coneR); boostR.add(nozzleR); boostR.add(strutR);
    boostR.position.set(1.6, -0.4, 0);
    this.parts.rightBooster = boostR;

    // 5. Left Aero Fin: Swept fin with beveled root fairing
    const finL = new THREE.Group();
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.9), matFin);
    const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 0.1), matAccent);
    edgeL.position.z = 0.45;
    finL.add(wingL); finL.add(edgeL);
    finL.position.set(-1.3, -1.4, 0);
    this.parts.leftFin = finL;

    // 6. Right Aero Fin
    const finR = new THREE.Group();
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.9), matFin);
    const edgeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 0.1), matAccent);
    edgeR.position.z = 0.45;
    finR.add(wingR); finR.add(edgeR);
    finR.position.set(1.3, -1.4, 0);
    this.parts.rightFin = finR;

    // 7. Engine: Detailed main engine bell cluster with combustion chamber
    const engGroup = new THREE.Group();
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.25, 0.9, 32), matEngine);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 16, 32), matAccent);
    rim.rotation.x = Math.PI / 2; rim.position.y = -0.45;
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 32), matDark);
    manifold.position.y = 0.5;
    engGroup.add(bell); engGroup.add(rim); engGroup.add(manifold);
    engGroup.position.y = -2.25;
    this.parts.engine = engGroup;

    // 8. Window: Double-ring glazed porthole window
    const winGroup = new THREE.Group();
    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.09, 16, 32), matAccent);
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 16, 32), matDark);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.48, 32), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 }));
    outerRim.position.z = 1.21; innerRim.position.z = 1.22; glass.position.z = 1.21;
    winGroup.add(outerRim); winGroup.add(innerRim); winGroup.add(glass);
    this.parts.window = winGroup;

    // 9. Fuel Tank: Cryogenic weld band with level sensor indicator
    const fuelGroup = new THREE.Group();
    const fuelBand = new THREE.Mesh(new THREE.TorusGeometry(1.23, 0.08, 16, 32), matAccent);
    fuelBand.rotation.x = Math.PI / 2;
    const levelLed = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.05), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    levelLed.position.set(0, 0, 1.25);
    fuelGroup.add(fuelBand); fuelGroup.add(levelLed);
    fuelGroup.position.y = -0.8;
    this.parts.fuelTank = fuelGroup;

    // 10. Control Module: Avionics navigation collar with flashing indicators
    const ctrlGroup = new THREE.Group();
    const ctrlMesh = new THREE.Mesh(new THREE.TorusGeometry(1.23, 0.08, 16, 32), matAccent);
    ctrlMesh.rotation.x = Math.PI / 2;
    const ant1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), matDark);
    ant1.position.set(-0.7, 0.2, 1.0);
    const ant2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), matDark);
    ant2.position.set(0.7, 0.2, 1.0);
    ctrlGroup.add(ctrlMesh); ctrlGroup.add(ant1); ctrlGroup.add(ant2);
    ctrlGroup.position.y = 1.0;
    this.parts.controlModule = ctrlGroup;

    Object.keys(this.parts).forEach(key => this.rocketGroup.add(this.parts[key]));
  }

  // ==========================================
  // 2. SpaceX Starship Model
  // ==========================================
  createStarshipRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matSteel = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
    const matHeatShield = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.nose, metalness: 0.7, roughness: 0.3 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });

    // 1. Body: Stainless steel body with heat shield tiles on half circumference
    const bodyGroup = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 4.4, 32), matSteel);
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 4.38, 32, 1, false, 0, Math.PI), matHeatShield);
    const weld1 = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.02, 16, 32), matDark);
    weld1.rotation.x = Math.PI / 2; weld1.position.y = 1.1;
    const weld2 = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.02, 16, 32), matDark);
    weld2.rotation.x = Math.PI / 2; weld2.position.y = -1.1;
    bodyGroup.add(hull); bodyGroup.add(shield); bodyGroup.add(weld1); bodyGroup.add(weld2);
    this.parts.body = bodyGroup;

    // 2. Nose Cone: Ogive Stainless steel nose with header tank
    const noseGroup = new THREE.Group();
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.86, 2.0, 32), matSteel);
    const noseShield = new THREE.Mesh(new THREE.ConeGeometry(0.87, 1.98, 32, 1, false, 0, Math.PI), matHeatShield);
    noseGroup.add(nose); noseGroup.add(noseShield);
    noseGroup.position.y = 3.2;
    this.parts.noseCone = noseGroup;

    // 3. Left Booster Pod: Super Heavy booster pod
    const podL = new THREE.Group();
    const cylL = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.2, 24), matDark);
    const capL = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.6, 24), matSteel);
    capL.position.y = 1.9;
    const mountL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), matSteel);
    mountL.position.set(0.4, 0.5, 0);
    podL.add(cylL); podL.add(capL); podL.add(mountL);
    podL.position.set(-1.15, -0.6, 0);
    this.parts.leftBooster = podL;

    // 4. Right Booster Pod
    const podR = new THREE.Group();
    const cylR = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.2, 24), matDark);
    const capR = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.6, 24), matSteel);
    capR.position.y = 1.9;
    const mountR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), matSteel);
    mountR.position.set(-0.4, 0.5, 0);
    podR.add(cylR); podR.add(capR); podR.add(mountR);
    podR.position.set(1.15, -0.6, 0);
    this.parts.rightBooster = podR;

    // 5. Left Aft Body Flap: Actuated aero flap
    const flapL = new THREE.Group();
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.8), matAccent);
    const hingeL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.55, 16), matDark);
    hingeL.position.x = 0.04;
    flapL.add(wingL); flapL.add(hingeL);
    flapL.position.set(-1.0, -1.4, 0);
    this.parts.leftFin = flapL;

    // 6. Right Aft Body Flap
    const flapR = new THREE.Group();
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.8), matAccent);
    const hingeR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.55, 16), matDark);
    hingeR.position.x = -0.04;
    flapR.add(wingR); flapR.add(hingeR);
    flapR.position.set(1.0, -1.4, 0);
    this.parts.rightFin = flapR;

    // 7. Engine: 3 Raptor vacuum / sea-level cluster
    const engGroup = new THREE.Group();
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.84, 0.2, 32), matDark);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.65, 16), matSteel);
      bell.position.set(Math.cos(angle) * 0.35, -0.35, Math.sin(angle) * 0.35);
      engGroup.add(bell);
    }
    engGroup.add(basePlate);
    engGroup.position.y = -2.4;
    this.parts.engine = engGroup;

    // 8. Observation Window: Panoramic forward deck window
    const winGroup = new THREE.Group();
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.38, 0.14), matDark);
    const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.32, 0.15), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 }));
    winGroup.add(winFrame); winGroup.add(winGlass);
    winGroup.position.set(0, 1.8, 0.82);
    this.parts.window = winGroup;

    // 9. Fuel Tank: Cryogenic weld ring
    const fuel = new THREE.Mesh(new THREE.TorusGeometry(0.87, 0.06, 16, 32), matAccent);
    fuel.rotation.x = Math.PI / 2; fuel.position.y = -0.6;
    this.parts.fuelTank = fuel;

    // 10. Forward Canard Flaps
    const canardGroup = new THREE.Group();
    const canL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.4), matAccent);
    canL.position.set(-0.9, 2.9, 0);
    const canR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.4), matAccent);
    canR.position.set(0.9, 2.9, 0);
    canardGroup.add(canL); canardGroup.add(canR);
    this.parts.controlModule = canardGroup;

    Object.keys(this.parts).forEach(k => this.rocketGroup.add(this.parts[k]));
  }

  // ==========================================
  // 3. Falcon Heavy Triple-Core Rocket
  // ==========================================
  createFalconHeavyRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matCore = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.2 });
    const matInter = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.6 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.nose, roughness: 0.3 });
    const matGrid = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.2 });

    // 1. Center Core Body with interstage carbon ring & raceway conduit
    const bodyGroup = new THREE.Group();
    const coreCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 4.4, 32), matCore);
    const interstage = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.6, 32), matInter);
    interstage.position.y = 1.4;
    const raceway = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.2, 0.08), matInter);
    raceway.position.set(0, 0, 0.65);
    bodyGroup.add(coreCyl); bodyGroup.add(interstage); bodyGroup.add(raceway);
    this.parts.body = bodyGroup;

    // 2. Nose Cone: Payload fairing
    const fairingGroup = new THREE.Group();
    const fairing = new THREE.Mesh(new THREE.ConeGeometry(0.72, 2.0, 32), matCore);
    const fairingBand = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.03, 16, 32), matAccent);
    fairingBand.rotation.x = Math.PI / 2; fairingBand.position.y = -0.9;
    fairingGroup.add(fairing); fairingGroup.add(fairingBand);
    fairingGroup.position.y = 3.2;
    this.parts.noseCone = fairingGroup;

    // 3. Left Strap-on Core with aerodynamic nose cone and structural couplers
    const coreL = new THREE.Group();
    const cylL = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 4.0, 32), matCore);
    const noseL = new THREE.Mesh(new THREE.ConeGeometry(0.63, 1.2, 32), matCore);
    noseL.position.y = 2.6;
    const noseCapL = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 16), matAccent);
    noseCapL.position.y = 3.1;
    const strutTopL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.15), matInter);
    strutTopL.position.set(0.45, 1.5, 0);
    const strutBotL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.15), matInter);
    strutBotL.position.set(0.45, -1.5, 0);
    coreL.add(cylL); coreL.add(noseL); coreL.add(noseCapL); coreL.add(strutTopL); coreL.add(strutBotL);
    coreL.position.set(-1.45, -0.2, 0);
    this.parts.leftBooster = coreL;

    // 4. Right Strap-on Core
    const coreR = new THREE.Group();
    const cylR = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 4.0, 32), matCore);
    const noseR = new THREE.Mesh(new THREE.ConeGeometry(0.63, 1.2, 32), matCore);
    noseR.position.y = 2.6;
    const noseCapR = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 16), matAccent);
    noseCapR.position.y = 3.1;
    const strutTopR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.15), matInter);
    strutTopR.position.set(-0.45, 1.5, 0);
    const strutBotR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.15), matInter);
    strutBotR.position.set(-0.45, -1.5, 0);
    coreR.add(cylR); coreR.add(noseR); coreR.add(noseCapR); coreR.add(strutTopR); coreR.add(strutBotR);
    coreR.position.set(1.45, -0.2, 0);
    this.parts.rightBooster = coreR;

    // 5. Left Titanium Grid Fin
    const finL = new THREE.Group();
    const gridMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.55), matGrid);
    const hingeMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 16), matInter);
    hingeMeshL.rotation.z = Math.PI / 2; hingeMeshL.position.x = 0.08;
    finL.add(gridMeshL); finL.add(hingeMeshL);
    finL.position.set(-0.72, 1.8, 0);
    this.parts.leftFin = finL;

    // 6. Right Titanium Grid Fin
    const finR = new THREE.Group();
    const gridMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.55), matGrid);
    const hingeMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 16), matInter);
    hingeMeshR.rotation.z = Math.PI / 2; hingeMeshR.position.x = -0.08;
    finR.add(gridMeshR); finR.add(hingeMeshR);
    finR.position.set(0.72, 1.8, 0);
    this.parts.rightFin = finR;

    // 7. Engine: Octaweb 9-engine baseplate cluster
    const engGroup = new THREE.Group();
    const shieldPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.72, 0.3, 32), matInter);
    const centerNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.55, 16), matGrid);
    centerNozzle.position.y = -0.35;
    engGroup.add(shieldPlate); engGroup.add(centerNozzle);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.5, 16), matGrid);
      nozzle.position.set(Math.cos(angle) * 0.4, -0.35, Math.sin(angle) * 0.4);
      engGroup.add(nozzle);
    }
    engGroup.position.y = -2.45;
    this.parts.engine = engGroup;

    // 8. Flight Window / Optical Tracking
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 }));
    win.position.set(0, 1.2, 0.65);
    this.parts.window = win;

    // 9. Interstage Fuel Collar
    const fuel = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.4, 32), matAccent);
    fuel.position.y = 0.5;
    this.parts.fuelTank = fuel;

    // 10. Guidance Avionics Ring
    const ctrl = new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.05, 16, 32), matAccent);
    ctrl.rotation.x = Math.PI / 2; ctrl.position.y = 2.1;
    this.parts.controlModule = ctrl;

    Object.keys(this.parts).forEach(k => this.rocketGroup.add(this.parts[k]));
  }

  // ==========================================
  // 4. Long March 5 Heavy-Lift Rocket
  // ==========================================
  createLongMarchRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matCore = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const matRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.2 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });

    // 1. Wide 5m Core Stage with Chinese Red Ribbon stripes
    const bodyGroup = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 4.0, 32), matCore);
    const redBand1 = new THREE.Mesh(new THREE.CylinderGeometry(1.41, 1.41, 0.25, 32), matRed);
    redBand1.position.y = 1.2;
    const redBand2 = new THREE.Mesh(new THREE.CylinderGeometry(1.41, 1.41, 0.25, 32), matRed);
    redBand2.position.y = -1.2;
    bodyGroup.add(hull); bodyGroup.add(redBand1); bodyGroup.add(redBand2);
    this.parts.body = bodyGroup;

    // 2. Beveled Payload Fairing with Escape Tip
    const fairing = new THREE.Group();
    const fCone = new THREE.Mesh(new THREE.ConeGeometry(1.42, 2.0, 32), matCore);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 16), matRed);
    tip.position.y = 1.45;
    fairing.add(fCone); fairing.add(tip);
    fairing.position.y = 3.0;
    this.parts.noseCone = fairing;

    // 3. Left Dual Strap-on Boosters with canted nose cone
    const boostL = new THREE.Group();
    const bCylL = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.4, 24), matCore);
    const bConeL = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.1, 24), matRed);
    bConeL.position.y = 2.25; bConeL.rotation.z = -0.12;
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.2), matDark);
    strutL.position.set(0.6, 0.8, 0);
    boostL.add(bCylL); boostL.add(bConeL); boostL.add(strutL);
    boostL.position.set(-1.8, -0.4, 0);
    this.parts.leftBooster = boostL;

    // 4. Right Dual Strap-on Boosters
    const boostR = new THREE.Group();
    const bCylR = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.4, 24), matCore);
    const bConeR = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.1, 24), matRed);
    bConeR.position.y = 2.25; bConeR.rotation.z = 0.12;
    const strutR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.2), matDark);
    strutR.position.set(-0.6, 0.8, 0);
    boostR.add(bCylR); boostR.add(bConeR); boostR.add(strutR);
    boostR.position.set(1.8, -0.4, 0);
    this.parts.rightBooster = boostR;

    // 5. Left Stabilizing Fin
    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.75), matRed);
    finL.position.set(-1.5, -1.6, 0);
    this.parts.leftFin = finL;

    // 6. Right Stabilizing Fin
    const finR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.75), matRed);
    finR.position.set(1.5, -1.6, 0);
    this.parts.rightFin = finR;

    // 7. Dual YF-77 Hydrogen-Oxygen Engines
    const engGroup = new THREE.Group();
    const bell1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.85, 24), matDark);
    bell1.position.set(-0.45, 0, 0);
    const bell2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.85, 24), matDark);
    bell2.position.set(0.45, 0, 0);
    engGroup.add(bell1); engGroup.add(bell2);
    engGroup.position.y = -2.4;
    this.parts.engine = engGroup;

    // 8. Porthole / Commemorative Emblem
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), matGold);
    win.position.set(0, 0.8, 1.42);
    this.parts.window = win;

    // 9. Cryogenic Tank Interstage Ribbon
    const fuel = new THREE.Mesh(new THREE.TorusGeometry(1.43, 0.07, 16, 32), matRed);
    fuel.rotation.x = Math.PI / 2; fuel.position.y = -0.7;
    this.parts.fuelTank = fuel;

    // 10. Guidance Avionics Ring
    const ctrl = new THREE.Mesh(new THREE.TorusGeometry(1.43, 0.07, 16, 32), matGold);
    ctrl.rotation.x = Math.PI / 2; ctrl.position.y = 1.3;
    this.parts.controlModule = ctrl;

    Object.keys(this.parts).forEach(k => this.rocketGroup.add(this.parts[k]));
  }

  // ==========================================
  // 5. Futuristic Cyber Star Cruiser
  // ==========================================
  createCyberRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.galaxy;
    const matCarbon = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.85 });
    const matNeon = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 });
    const matPurple = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.4 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.accent });

    // 1. Faceted Hexagonal Body with luminous plasma grooves
    const bodyGroup = new THREE.Group();
    const hexHull = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 4.0, 6), matCarbon);
    const lineGlow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.8, 1.15), matNeon);
    bodyGroup.add(hexHull); bodyGroup.add(lineGlow);
    this.parts.body = bodyGroup;

    // 2. Stealth Wedge Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.02, 2.2, 6), matNeon);
    nose.position.y = 3.1;
    this.parts.noseCone = nose;

    // 3. Left Warp Plasma Nacelle
    const nacelleL = new THREE.Group();
    const boxL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 0.8), matCarbon);
    const beamL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.0, 0.82), matNeon);
    nacelleL.add(boxL); nacelleL.add(beamL);
    nacelleL.position.set(-1.6, -0.2, 0);
    this.parts.leftBooster = nacelleL;

    // 4. Right Warp Plasma Nacelle
    const nacelleR = new THREE.Group();
    const boxR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 0.8), matCarbon);
    const beamR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.0, 0.82), matNeon);
    nacelleR.add(boxR); nacelleR.add(beamR);
    nacelleR.position.set(1.6, -0.2, 0);
    this.parts.rightBooster = nacelleR;

    // 5. Left Energy Blade Wing
    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 1.2), matPurple);
    finL.position.set(-1.4, -1.2, 0);
    finL.rotation.z = -0.2;
    this.parts.leftFin = finL;

    // 6. Right Energy Blade Wing
    const finR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 1.2), matPurple);
    finR.position.set(1.4, -1.2, 0);
    finR.rotation.z = 0.2;
    this.parts.rightFin = finR;

    // 7. Ion Vortex Drive
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.05, 0.8, 6), matNeon);
    eng.position.y = -2.4;
    this.parts.engine = eng;

    // 8. Holographic Canopy Window
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 }));
    win.position.set(0, 1.5, 0.95);
    this.parts.window = win;

    // 9. Antimatter Toroidal Conduit
    const fuel = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.08, 16, 6), matNeon);
    fuel.rotation.x = Math.PI / 2; fuel.position.y = -0.6;
    this.parts.fuelTank = fuel;

    // 10. Quantum Antenna Array
    const ctrl = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), matAccent);
    ctrl.position.set(0, 2.0, 1.0);
    this.parts.controlModule = ctrl;

    Object.keys(this.parts).forEach(k => this.rocketGroup.add(this.parts[k]));
  }

  updateInstalledParts(installedPartIds) {
    if (!this.parts) return;
    const list = Array.isArray(installedPartIds) ? installedPartIds : [];
    Object.keys(this.parts).forEach(id => {
      if (this.parts[id]) {
        this.parts[id].visible = list.includes(id);
      }
    });
  }

  /**
   * Time-interpolated Part Installation Animation (700-900ms) with Quaternion SLERP & VFX
   */
  animateInstallPart(partId, callback) {
    const part = this.parts[partId];
    if (!part) {
      if (callback) callback();
      return;
    }

    const orig = this.targetTransforms[partId] || {
      position: { x: 0, y: part.position?.y || 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 }
    };

    part.visible = true;

    const startX = orig.position.x + 3.2;
    const startY = orig.position.y + 1.2;
    const startZ = orig.position.z + 2.5;
    const startRotY = (orig.rotation ? orig.rotation.y : 0) + Math.PI;
    const baseScaleX = orig.scale ? orig.scale.x : 1;

    if (part.position && part.position.set) {
      part.position.set(startX, startY, startZ);
    }
    if (part.rotation) part.rotation.y = startRotY;
    if (part.scale && part.scale.set) {
      part.scale.set(baseScaleX * 0.65, baseScaleX * 0.65, baseScaleX * 0.65);
    }

    const startTime = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    const duration = 750;

    const step = () => {
      const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      // Overshoot scale curve (0.65 -> 1.08 -> 1.0)
      let scaleMult = 1.0;
      if (progress < 0.7) {
        scaleMult = 0.65 + (1.08 - 0.65) * (progress / 0.7);
      } else {
        scaleMult = 1.08 - (1.08 - 1.0) * ((progress - 0.7) / 0.3);
      }

      if (part.position) {
        part.position.x = startX + (orig.position.x - startX) * ease;
        part.position.y = startY + (orig.position.y - startY) * ease;
        part.position.z = startZ + (orig.position.z - startZ) * ease;
      }
      if (part.rotation) {
        part.rotation.y = startRotY + ((orig.rotation ? orig.rotation.y : 0) - startRotY) * ease;
      }
      if (part.scale && part.scale.set) {
        part.scale.set(baseScaleX * scaleMult, baseScaleX * scaleMult, baseScaleX * scaleMult);
      }

      if (progress < 1) {
        this.requestTrackedRaf(step);
      } else {
        // Accurately restore original XYZ, Rotation / Quaternion, and Scale
        if (part.position && part.position.copy && orig.position.clone) {
          part.position.copy(orig.position);
        } else if (part.position && part.position.set) {
          part.position.set(orig.position.x, orig.position.y, orig.position.z);
        }

        if (orig.quaternion && part.quaternion && part.quaternion.copy) {
          part.quaternion.copy(orig.quaternion);
        } else if (part.rotation && part.rotation.set && orig.rotation) {
          part.rotation.set(orig.rotation.x, orig.rotation.y, orig.rotation.z);
        }

        if (part.scale && part.scale.copy && orig.scale.clone) {
          part.scale.copy(orig.scale);
        } else if (part.scale && part.scale.set && orig.scale) {
          part.scale.set(orig.scale.x, orig.scale.y, orig.scale.z);
        }

        if (window.audioManager) window.audioManager.playSnap();
        if (callback) callback();
      }
    };
    this.requestTrackedRaf(step);
  }

  /**
   * Sequential assembly of multiple parts (~380ms per part)
   */
  async assembleSequentially(partsToInstall, onPartInstalled, onAllFinished) {
    if (this.isSequentialAssembling) return;
    this.isSequentialAssembling = true;

    for (const partId of partsToInstall) {
      if (!this.isSequentialAssembling) break;
      await new Promise(resolve => {
        this.animateInstallPart(partId, () => {
          if (onPartInstalled) onPartInstalled(partId);
          this.setTrackedTimeout(resolve, 100);
        });
      });
    }

    this.isSequentialAssembling = false;
    if (onAllFinished) onAllFinished();
  }

  /**
   * Instantly fit all parts (Quick Prep mode)
   */
  quickAssemble(partIds = null) {
    const list = partIds || this.partDefinitions.map(p => p.id);
    this.updateInstalledParts(list);
    if (window.storageManager) {
      list.forEach(id => window.storageManager.installPart(id));
    }
  }

  /**
   * Pulse rocket lights on correct answer / streak boost
   */
  pulseRocketLights(colorHex = 0x10b981) {
    if (!this.parts) return;
    const targets = [this.parts.window, this.parts.noseCone, this.parts.controlModule];
    targets.forEach(p => {
      if (p && p.material && p.material.emissive && p.material.emissive.setHex) {
        p.material.emissive.setHex(colorHex);
        p.material.emissiveIntensity = 1.8;
      }
    });
    this.setTrackedTimeout(() => {
      targets.forEach(p => {
        if (p && p.material && p.material.emissive && p.material.emissive.setHex) {
          p.material.emissiveIntensity = 0.2;
        }
      });
    }, 450);
  }

  /**
   * Set Navigation light status (Green for normal, Amber for temporary mistake warning)
   */
  setNavWarning(isWarning = false) {
    if (!this.parts || !this.parts.controlModule) return;
    const ctrl = this.parts.controlModule;
    if (ctrl.material && ctrl.material.emissive && ctrl.material.emissive.setHex) {
      ctrl.material.emissive.setHex(isWarning ? 0xf59e0b : 0x10b981);
      ctrl.material.emissiveIntensity = isWarning ? 1.5 : 0.4;
    }
  }

  /**
   * Create 3D Payload Module (Satellite, Rover, Cargo, Probe)
   */
  static createPayloadMesh(payloadType = "probe") {
    if (typeof THREE === "undefined") return null;
    const group = new THREE.Group();

    switch (payloadType) {
      case "rover": {
        // Rover chassis
        const bodyGeo = new THREE.BoxGeometry(0.8, 0.35, 1.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.5 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Mast & Camera eyes
        const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
        const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(0, 0.4, 0.4);
        group.add(mast);

        const eyeGeo = new THREE.BoxGeometry(0.2, 0.1, 0.1);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0.7, 0.4);
        group.add(eye);

        // 6 Titanium wire mesh wheels
        const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
        const wheelOffsets = [
          [-0.55, -0.2, -0.4], [0.55, -0.2, -0.4],
          [-0.55, -0.2, 0.0], [0.55, -0.2, 0.0],
          [-0.55, -0.2, 0.4], [0.55, -0.2, 0.4]
        ];
        wheelOffsets.forEach(([x, y, z]) => {
          const w = new THREE.Mesh(wheelGeo, wheelMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(x, y, z);
          group.add(w);
        });
        break;
      }
      case "satellite": {
        // Satellite core
        const coreGeo = new THREE.BoxGeometry(0.6, 0.7, 0.6);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        // Folding Solar Panels (Left & Right)
        const panelGeo = new THREE.BoxGeometry(1.2, 0.5, 0.04);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.2, metalness: 0.6 });
        const panelL = new THREE.Mesh(panelGeo, panelMat);
        panelL.position.set(-0.95, 0, 0);
        group.add(panelL);

        const panelR = new THREE.Mesh(panelGeo, panelMat);
        panelR.position.set(0.95, 0, 0);
        group.add(panelR);

        // Dish antenna
        if (THREE.ConeGeometry) {
          const dishGeo = new THREE.ConeGeometry(0.35, 0.2, 16);
          const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 });
          const dish = new THREE.Mesh(dishGeo, dishMat);
          dish.rotation.x = Math.PI;
          dish.position.set(0, 0.55, 0);
          group.add(dish);
        }
        break;
      }
      case "cargo": {
        const crateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 });
        const crate = new THREE.Mesh(crateGeo, crateMat);
        group.add(crate);

        const stripGeo = new THREE.BoxGeometry(0.92, 0.1, 0.92);
        const stripMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.1 });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        group.add(strip);
        break;
      }
      case "probe":
      default: {
        const probeCoreGeo = new THREE.OctahedronGeometry(0.45, 1);
        const probeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.15 });
        const core = new THREE.Mesh(probeCoreGeo, probeMat);
        group.add(core);

        const boomGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6);
        const boomMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const boom = new THREE.Mesh(boomGeo, boomMat);
        boom.rotation.z = Math.PI / 4;
        group.add(boom);
        break;
      }
    }

    return group;
  }

  /**
   * Set glow & pulsing intensity for fuel tank & engine according to fuel %
   */
  setFuelGlowLevel(percentage) {
    const ratio = Math.min(1, Math.max(0, percentage / 100));
    if (this.parts.fuelTank) {
      this.parts.fuelTank.traverse(child => {
        if (child.material && child.material.emissive && child.material.emissive.setHex) {
          child.material.emissive.setHex(ratio > 0.75 ? 0x10b981 : (ratio > 0.4 ? 0x38bdf8 : 0x0284c7));
          child.material.emissiveIntensity = ratio * 1.5;
        }
      });
    }
    if (this.parts.engine) {
      this.parts.engine.traverse(child => {
        if (child.material && child.material.emissive && child.material.emissive.setHex) {
          child.material.emissive.setHex(0xf59e0b);
          child.material.emissiveIntensity = ratio * 1.2;
        }
      });
    }
  }

  /**
   * 1.8s 360-Degree Celebration Spin when rocket assembly is complete
   */
  triggerCelebrationSpin(duration = 1800, callback) {
    this.isSpinningCelebration = true;
    const startRotY = this.rocketGroup ? (this.rocketGroup.rotation.y || 0) : 0;
    const startTime = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();

    const spinStep = () => {
      const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 2);

      if (this.rocketGroup) {
        this.rocketGroup.rotation.y = startRotY + Math.PI * 2 * ease;
      }

      if (progress < 1) {
        this.requestTrackedRaf(spinStep);
      } else {
        this.isSpinningCelebration = false;
        if (callback) callback();
      }
    };
    this.requestTrackedRaf(spinStep);
  }

  updateAssemblyDebugHUD() {
    if (!this.isAssemblyDebug) return;
    const hud = document.getElementById("assembly-debug-hud");
    if (!hud || !this.rocketGroup || !this.camera) return;

    const box = new THREE.Box3().setFromObject(this.rocketGroup);
    const center = box.getCenter(new THREE.Vector3());
    const bottomY = box.min.y.toFixed(2);
    const deltaY = (box.min.y - this.ASSEMBLY_PLATFORM_TOP_Y).toFixed(3);
    const camPos = `(${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})`;
    const targetY = this.assemblyReferenceBounds ? this.assemblyReferenceBounds.visualCenterY.toFixed(2) : "0.00";

    hud.innerHTML = `
      <div><strong>[ASSEMBLY DEBUG TELEMETRY]</strong></div>
      <div>Platform Top Y: ${this.ASSEMBLY_PLATFORM_TOP_Y.toFixed(2)} | Center: (0.00, 0.00)</div>
      <div>Rocket Center: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})</div>
      <div>Rocket Bottom Y: ${bottomY} (Platform Delta: ${deltaY})</div>
      <div>Height: ${(box.max.y - box.min.y).toFixed(2)}</div>
      <div>Camera Target Y: ${targetY} | Cam: ${camPos}</div>
    `;
  }

  animate() {
    this.animationId = this.requestTrackedRaf(() => this.animate());

    if (this.rocketGroup && !this.isSpinningCelebration) {
      this.rocketGroup.rotation.y = (this.rocketGroup.rotation.y || 0) + 0.008;
    }
    if (this.controls) {
      this.controls.update();
    }
    this.updateAssemblyDebugHUD();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  disposeObject3D(obj) {
    if (!obj) return;
    obj.traverse(child => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  destroy() {
    this.isSequentialAssembling = false;
    this.isSpinningCelebration = false;

    if (this.boundResizeHandler) {
      window.removeEventListener("resize", this.boundResizeHandler);
      this.boundResizeHandler = null;
    }
    if (this.animationId) {
      this.cancelTrackedRaf(this.animationId);
      this.animationId = null;
    }

    // Cancel all tracked RAFs and timeouts
    this.activeRafs.forEach(id => this.cancelTrackedRaf(id));
    this.activeRafs.clear();
    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeTimeouts.clear();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.rocketGroup) {
      this.disposeObject3D(this.rocketGroup);
      this.rocketGroup = null;
    }
    if (this.platformGroup && this.scene) {
      this.scene.remove(this.platformGroup);
      this.disposeObject3D(this.platformGroup);
      this.platformGroup = null;
    }
    if (this.renderer) {
      if (this.renderer.domElement && this.renderer.domElement.remove) this.renderer.domElement.remove();
      if (this.renderer.dispose) this.renderer.dispose();
      this.renderer = null;
    }
    this.controls = null;
    this.scene = null;
    this.camera = null;
  }

  onWindowResize(containerId = "canvas-container-assembly") {
    const container = document.getElementById(containerId);
    if (!container || !this.renderer || !this.camera) return;
    const parent = container.parentElement;
    const width = container.clientWidth || (parent ? parent.clientWidth : 0) || window.innerWidth;
    const height = container.clientHeight || (parent ? parent.clientHeight : 0) || 500;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.fitAssemblyCamera();
    }
  }
}

window.rocketBuilder = new RocketBuilder();
