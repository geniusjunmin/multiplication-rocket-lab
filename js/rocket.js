/**
 * Multiplication Rocket Lab - Three.js 3D Rocket Engine & Models (js/rocket.js)
 * Supports 5 Distinct Procedural Models, 5 Themes, Precise Transform Tracking, GPU Memory Disposal & 2D Fallback
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

    this.themeColors = {
      explorer: { body: 0xf8fafc, nose: 0x0284c7, fin: 0x38bdf8, engine: 0xe11d48, accent: 0xf59e0b },
      fire: { body: 0x1e293b, nose: 0xef4444, fin: 0xf97316, engine: 0xd97706, accent: 0xfacc15 },
      forest: { body: 0xf1f5f9, nose: 0x059669, fin: 0x10b981, engine: 0x047857, accent: 0x34d399 },
      lightning: { body: 0x0f172a, nose: 0xeab308, fin: 0xa855f7, engine: 0xec4899, accent: 0x38bdf8 },
      galaxy: { body: 0x1e1b4b, nose: 0x818cf8, fin: 0xc084fc, engine: 0x4f46e5, accent: 0x38bdf8 }
    };
  }

  initScene(containerId) {
    this.destroy();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

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
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(this.renderer.domElement);

      if (window.THREE && window.THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
      dirLight.position.set(5, 10, 7);
      this.scene.add(dirLight);

      const pointLight = new THREE.PointLight(0x38bdf8, 0.6, 20);
      pointLight.position.set(-5, -2, -5);
      this.scene.add(pointLight);

      // Sync active model & theme from storage if available
      if (window.storageManager) {
        this.currentModel = window.storageManager.get("currentRocketModel") || this.currentModel;
        this.currentTheme = window.storageManager.get("currentRocketTheme") || this.currentTheme;
      }

      this.buildCurrentRocket();

      this.boundResizeHandler = () => this.onWindowResize(containerId);
      window.addEventListener("resize", this.boundResizeHandler);

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
          quaternion: part.quaternion && part.quaternion.clone ? part.quaternion.clone() : null,
          scale: part.scale && part.scale.clone ? part.scale.clone() : { x: 1, y: 1, z: 1 }
        };
      }
    });
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
    }

    const installed = window.storageManager ? (window.storageManager.get("installedParts") || []) : [];
    this.updateInstalledParts(installed);
  }

  // 1. Classic Explorer Retro Rocket
  createClassicRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matBody = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.3 });
    const matNose = new THREE.MeshStandardMaterial({ color: palette.nose, roughness: 0.2 });
    const matFin = new THREE.MeshStandardMaterial({ color: palette.fin, roughness: 0.3 });
    const matEngine = new THREE.MeshStandardMaterial({ color: palette.engine, roughness: 0.4 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.accent });

    // 1. Body
    this.parts.body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.8, 32), matBody);

    // 2. Nose Cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.22, 2.2, 32), matNose);
    nose.position.y = 3.0;
    this.parts.noseCone = nose;

    // 3. Left Booster
    const boostL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.0, 32), matBody);
    boostL.position.set(-1.6, -0.4, 0);
    const coneL = new THREE.Mesh(new THREE.ConeGeometry(0.51, 1.0, 32), matNose);
    coneL.position.y = 2.0;
    boostL.add(coneL);
    this.parts.leftBooster = boostL;

    // 4. Right Booster
    const boostR = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 3.0, 32), matBody);
    boostR.position.set(1.6, -0.4, 0);
    const coneR = new THREE.Mesh(new THREE.ConeGeometry(0.51, 1.0, 32), matNose);
    coneR.position.y = 2.0;
    boostR.add(coneR);
    this.parts.rightBooster = boostR;

    // 5. Left Fin
    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), matFin);
    finL.position.set(-1.3, -1.4, 0);
    this.parts.leftFin = finL;

    // 6. Right Fin
    const finR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), matFin);
    finR.position.set(1.3, -1.4, 0);
    this.parts.rightFin = finR;

    // 7. Engine
    const engMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.8, 32), matEngine);
    engMesh.position.y = -2.2;
    this.parts.engine = engMesh;

    // 8. Window
    const winGroup = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 16, 32), matAccent);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.48, 32), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
    rim.position.z = 1.21; glass.position.z = 1.21;
    winGroup.add(rim); winGroup.add(glass);
    this.parts.window = winGroup;

    // 9. Fuel Tank
    const fuelMesh = new THREE.Mesh(new THREE.TorusGeometry(1.23, 0.08, 16, 32), matAccent);
    fuelMesh.rotation.x = Math.PI / 2; fuelMesh.position.y = -0.8;
    this.parts.fuelTank = fuelMesh;

    // 10. Control Module
    const ctrlMesh = new THREE.Mesh(new THREE.TorusGeometry(1.23, 0.08, 16, 32), matAccent);
    ctrlMesh.rotation.x = Math.PI / 2; ctrlMesh.position.y = 1.0;
    this.parts.controlModule = ctrlMesh;

    Object.keys(this.parts).forEach(key => this.rocketGroup.add(this.parts[key]));
  }

  // 2. SpaceX Starship Model
  createStarshipRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matSteel = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.nose, metalness: 0.7, roughness: 0.3 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

    // 1. Body
    this.parts.body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 4.4, 32), matSteel);

    // 2. Nose Cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.86, 2.0, 32), matSteel);
    nose.position.y = 3.2;
    this.parts.noseCone = nose;

    // 3. Left Booster Pod
    const podL = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.2, 24), matDark);
    podL.position.set(-1.15, -0.6, 0);
    this.parts.leftBooster = podL;

    // 4. Right Booster Pod
    const podR = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.2, 24), matDark);
    podR.position.set(1.15, -0.6, 0);
    this.parts.rightBooster = podR;

    // 5. Left Aft Flap
    const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.7), matAccent);
    flapL.position.set(-1.0, -1.4, 0);
    this.parts.leftFin = flapL;

    // 6. Right Aft Flap
    const flapR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.7), matAccent);
    flapR.position.set(1.0, -1.4, 0);
    this.parts.rightFin = flapR;

    // 7. Engine Cluster (3 Raptor engines)
    const engGroup = new THREE.Group();
    const baseBell = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.88, 0.7, 32), matDark);
    engGroup.add(baseBell);
    engGroup.position.y = -2.5;
    this.parts.engine = engGroup;

    // 8. Observation Window
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.12), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 }));
    win.position.set(0, 1.8, 0.82);
    this.parts.window = win;

    // 9. Fuel Tank Weld Ring
    const fuel = new THREE.Mesh(new THREE.TorusGeometry(0.87, 0.06, 16, 32), matAccent);
    fuel.rotation.x = Math.PI / 2; fuel.position.y = -0.6;
    this.parts.fuelTank = fuel;

    // 10. Forward Canard Flaps
    const canardGroup = new THREE.Group();
    const canL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.35), matAccent);
    canL.position.set(-0.88, 2.9, 0);
    const canR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.35), matAccent);
    canR.position.set(0.88, 2.9, 0);
    canardGroup.add(canL); canardGroup.add(canR);
    this.parts.controlModule = canardGroup;

    Object.keys(this.parts).forEach(k => this.rocketGroup.add(this.parts[k]));
  }

  // 3. Falcon Heavy Triple-Core Rocket
  createFalconHeavyRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matCore = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const matInter = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.nose, roughness: 0.3 });

    // 1. Body (Center Core)
    this.parts.body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 4.4, 32), matCore);

    // 2. Nose Cone (Center Fairing)
    const fairing = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.8, 32), matAccent);
    fairing.position.y = 3.1;
    this.parts.noseCone = fairing;

    // 3. Left Strap-on Core
    const coreL = new THREE.Group();
    const cylL = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 4.0, 32), matCore);
    const noseL = new THREE.Mesh(new THREE.ConeGeometry(0.63, 1.2, 32), matAccent);
    noseL.position.y = 2.6;
    coreL.add(cylL); coreL.add(noseL);
    coreL.position.set(-1.45, -0.2, 0);
    this.parts.leftBooster = coreL;

    // 4. Right Strap-on Core
    const coreR = new THREE.Group();
    const cylR = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 4.0, 32), matCore);
    const noseR = new THREE.Mesh(new THREE.ConeGeometry(0.63, 1.2, 32), matAccent);
    noseR.position.y = 2.6;
    coreR.add(cylR); coreR.add(noseR);
    coreR.position.set(1.45, -0.2, 0);
    this.parts.rightBooster = coreR;

    // 5. Left Titanium Grid Fin
    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.5), matInter);
    finL.position.set(-0.72, 1.8, 0);
    this.parts.leftFin = finL;

    // 6. Right Titanium Grid Fin
    const finR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.5), matInter);
    finR.position.set(0.72, 1.8, 0);
    this.parts.rightFin = finR;

    // 7. Engine Cluster
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, 0.7, 32), matInter);
    eng.position.y = -2.55;
    this.parts.engine = eng;

    // 8. Flight Window / Optical Tracking
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    win.position.set(0, 1.2, 0.65);
    this.parts.window = win;

    // 9. Interstage Fuel Collar
    const fuel = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.4, 32), matInter);
    fuel.position.y = 1.0;
    this.parts.fuelTank = fuel;

    // 10. Guidance Avionics Ring
    const ctrl = new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.05, 16, 32), matAccent);
    ctrl.rotation.x = Math.PI / 2; ctrl.position.y = 2.1;
    this.parts.controlModule = ctrl;

    Object.keys(this.parts).forEach(k => this.rocketGroup.add(this.parts[k]));
  }

  // 4. Long March 5 Heavy-Lift Rocket
  createLongMarchRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matCore = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const matRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x334155 });

    // 1. Wide 5m Core Stage
    this.parts.body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 4.0, 32), matCore);

    // 2. Beveled Payload Fairing
    const fairing = new THREE.Group();
    const fCone = new THREE.Mesh(new THREE.ConeGeometry(1.42, 2.0, 32), matCore);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 16), matRed);
    tip.position.y = 1.4;
    fairing.add(fCone); fairing.add(tip);
    fairing.position.y = 3.0;
    this.parts.noseCone = fairing;

    // 3. Left Dual Strap-on Boosters with canted nose cone
    const boostL = new THREE.Group();
    const bCylL = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.4, 24), matCore);
    const bConeL = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.1, 24), matRed);
    bConeL.position.y = 2.25;
    bConeL.rotation.z = -0.1;
    boostL.add(bCylL); boostL.add(bConeL);
    boostL.position.set(-1.8, -0.4, 0);
    this.parts.leftBooster = boostL;

    // 4. Right Dual Strap-on Boosters
    const boostR = new THREE.Group();
    const bCylR = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.4, 24), matCore);
    const bConeR = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.1, 24), matRed);
    bConeR.position.y = 2.25;
    bConeR.rotation.z = 0.1;
    boostR.add(bCylR); boostR.add(bConeR);
    boostR.position.set(1.8, -0.4, 0);
    this.parts.rightBooster = boostR;

    // 5. Left Stabilizing Fin
    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.7), matRed);
    finL.position.set(-1.5, -1.6, 0);
    this.parts.leftFin = finL;

    // 6. Right Stabilizing Fin
    const finR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.7), matRed);
    finR.position.set(1.5, -1.6, 0);
    this.parts.rightFin = finR;

    // 7. Dual YF-77 Engines
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, 0.8, 32), matDark);
    eng.position.y = -2.4;
    this.parts.engine = eng;

    // 8. Porthole / National Insignia Emblem
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), matGold);
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

  // 5. Futuristic Cyber Star Cruiser
  createCyberRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.galaxy;
    const matCarbon = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const matNeon = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const matPurple = new THREE.MeshStandardMaterial({ color: 0xa855f7 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.accent });

    // 1. Faceted Hexagonal Body
    this.parts.body = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 4.0, 6), matCarbon);

    // 2. Stealth Wedge Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.02, 2.2, 6), matNeon);
    nose.position.y = 3.1;
    this.parts.noseCone = nose;

    // 3. Left Warp Plasma Nacelle
    const nacelleL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 0.8), matCarbon);
    nacelleL.position.set(-1.6, -0.2, 0);
    this.parts.leftBooster = nacelleL;

    // 4. Right Warp Plasma Nacelle
    const nacelleR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 0.8), matCarbon);
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
   * Time-interpolated Part Installation Animation (700-900ms) with accurate transform restoration
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
        requestAnimationFrame(step);
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
    step();
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
   * 1.5s 360-Degree Celebration Spin when rocket assembly is complete
   */
  triggerCelebrationSpin(duration = 1500, callback) {
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
        requestAnimationFrame(spinStep);
      } else {
        this.isSpinningCelebration = false;
        if (callback) callback();
      }
    };
    spinStep();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.rocketGroup && !this.isSpinningCelebration) {
      this.rocketGroup.rotation.y = (this.rocketGroup.rotation.y || 0) + 0.008;
    }
    if (this.controls) {
      this.controls.update();
    }
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
    if (this.boundResizeHandler) {
      window.removeEventListener("resize", this.boundResizeHandler);
      this.boundResizeHandler = null;
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.rocketGroup) {
      this.disposeObject3D(this.rocketGroup);
      this.rocketGroup = null;
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

  onWindowResize(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !this.renderer || !this.camera) return;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.rocketBuilder = new RocketBuilder();
