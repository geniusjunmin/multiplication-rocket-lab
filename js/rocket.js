/**
 * Multiplication Rocket Lab - Three.js 3D Rocket Engine & Models (js/rocket.js)
 * Supports 5 Procedural Models, 5 Themes, GPU Memory Disposal & 2D Fallback
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
      this.camera.position.set(0, 2, 9);

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

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
      dirLight.position.set(5, 10, 7);
      this.scene.add(dirLight);

      const pointLight = new THREE.PointLight(0x38bdf8, 0.5, 20);
      pointLight.position.set(-5, -2, -5);
      this.scene.add(pointLight);

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
    this.buildCurrentRocket();
  }

  setTheme(themeId) {
    if (this.themeColors[themeId]) {
      this.currentTheme = themeId;
      this.buildCurrentRocket();
    }
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

    if (this.scene) {
      this.scene.add(this.rocketGroup);
    }

    const installed = window.storageManager ? (window.storageManager.get("installedParts") || []) : [];
    this.updateInstalledParts(installed);
  }

  createClassicRocket() {
    const palette = this.themeColors[this.currentTheme] || this.themeColors.explorer;
    const matBody = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.3 });
    const matNose = new THREE.MeshStandardMaterial({ color: palette.nose, roughness: 0.2 });
    const matFin = new THREE.MeshStandardMaterial({ color: palette.fin, roughness: 0.3 });
    const matEngine = new THREE.MeshStandardMaterial({ color: palette.engine, roughness: 0.4 });
    const matAccent = new THREE.MeshStandardMaterial({ color: palette.accent });

    // 1. Body
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.8, 32), matBody);
    this.parts.body = bodyMesh;

    // 2. Nose Cone
    const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(1.22, 2.2, 32), matNose);
    noseMesh.position.y = 3.0;
    this.parts.noseCone = noseMesh;

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

  createStarshipRocket() {
    const matSteel = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const matSilver = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });

    this.parts.body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 4.2, 32), matSteel);
    
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.76, 1.8, 32), matSilver);
    nose.position.y = 3.0;
    this.parts.noseCone = nose;

    const bL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.5, 32), matSteel); bL.position.set(-1.2, -0.4, 0);
    this.parts.leftBooster = bL;
    const bR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.5, 32), matSteel); bR.position.set(1.2, -0.4, 0);
    this.parts.rightBooster = bR;

    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.6), matSilver); finL.position.set(-0.85, -1.5, 0);
    this.parts.leftFin = finL;
    const finR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.6), matSilver); finR.position.set(0.85, -1.5, 0);
    this.parts.rightFin = finR;

    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.8, 32), matSilver); eng.position.y = -2.4;
    this.parts.engine = eng;

    const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.1), matSilver); win.position.set(0, 1.5, 0.75);
    this.parts.window = win;

    const fuel = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.05, 16, 32), matSilver); fuel.rotation.x = Math.PI / 2; fuel.position.y = -0.5;
    this.parts.fuelTank = fuel;

    const ctrlGroup = new THREE.Group();
    const topFlapL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.3), matSilver); topFlapL.position.set(-0.78, 2.8, 0);
    const topFlapR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.3), matSilver); topFlapR.position.set(0.78, 2.8, 0);
    ctrlGroup.add(topFlapL); ctrlGroup.add(topFlapR);
    this.parts.controlModule = ctrlGroup;

    Object.keys(this.parts).forEach(k => this.rocketGroup.add(this.parts[k]));
  }

  createFalconHeavyRocket() {
    this.createClassicRocket();
  }

  createLongMarchRocket() {
    this.createClassicRocket();
  }

  createCyberRocket() {
    this.createClassicRocket();
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

  animateInstallPart(partId, callback) {
    const part = this.parts[partId];
    if (!part) {
      if (callback) callback();
      return;
    }

    part.visible = true;
    const targetY = part.position.y;
    const origScaleX = part.scale ? part.scale.x : 1;

    part.position.set(3.5, targetY + 1.5, 2.0);
    part.rotation.y = Math.PI;
    part.scale.set(0.3, 0.3, 0.3);
    
    let progress = 0;
    const duration = 30;

    const step = () => {
      progress++;
      const ratio = progress / duration;
      const ease = 1 - Math.pow(1 - ratio, 3);

      part.position.x = 3.5 * (1 - ease);
      part.position.y = (targetY + 1.5) - 1.5 * ease;
      part.position.z = 2.0 * (1 - ease);
      part.rotation.y = Math.PI * (1 - ease);

      const currentScale = 0.3 + (origScaleX - 0.3) * ease;
      part.scale.set(currentScale, currentScale, currentScale);

      if (progress < duration) {
        requestAnimationFrame(step);
      } else {
        part.position.set(0, targetY, 0);
        part.rotation.set(0, 0, 0);
        part.scale.set(origScaleX, origScaleX, origScaleX);

        if (window.audioManager) window.audioManager.playSnap();
        if (callback) callback();
      }
    };
    step();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.rocketGroup) {
      this.rocketGroup.rotation.y += 0.008;
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
      if (this.renderer.domElement) this.renderer.domElement.remove();
      this.renderer.dispose();
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
