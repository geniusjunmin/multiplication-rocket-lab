/**
 * 乘法火箭实验室 - Three.js 3D 火箭构建与多型号组装车间引擎 (rocket.js)
 */
class RocketBuilder {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.rocketGroup = null;
    this.parts = {};
    this.currentTheme = "explorer";
    this.currentModel = "classic"; // 'classic' | 'starship' | 'falconHeavy' | 'longMarch' | 'cyber'
    this.animationId = null;

    // 10 大零件元数据与定义
    this.partDefinitions = [
      { id: "body", name: "火箭主体", desc: "坚固的主承载舱体，容纳核心系统。", order: 1, icon: "🚀" },
      { id: "noseCone", name: "火箭头锥", desc: "流线型头锥，能够有效降低空气阻力。", order: 2, icon: "🔺" },
      { id: "engine", name: "火箭发动机", desc: "产生强大推力，帮助火箭克制引力升空。", order: 3, icon: "🔥" },
      { id: "leftBooster", name: "左侧助推器", desc: "提供起飞阶段所需的额外高能助推。", order: 4, icon: "⚡" },
      { id: "rightBooster", name: "右侧助推器", desc: "平衡火箭推力，保持飞行的稳定。", order: 5, icon: "⚡" },
      { id: "leftFin", name: "左尾翼", desc: "在空气层中保持火箭飞行的方向稳定。", order: 6, icon: "🛩️" },
      { id: "rightFin", name: "右尾翼", desc: "配合左尾翼修正飞行姿态。", order: 7, icon: "🛩️" },
      { id: "window", name: "观察窗", desc: "宇航员观察太空景色与轨道的视窗。", order: 8, icon: "🪟" },
      { id: "fuelTank", name: "高能燃料箱", desc: "储备高能数学燃料的主燃料舱。", order: 9, icon: "⛽" },
      { id: "controlModule", name: "智能控制舱", desc: "航天电脑与自动巡航系统的中枢。", order: 10, icon: "🎛️" }
    ];

    // 外观涂装配色配置
    this.themeColors = {
      explorer: { main: 0xf8fafc, stripe: 0x3b82f6, fin: 0x2563eb, window: 0x0284c7, engine: 0x475569, metalness: 0.2, roughness: 0.3 },
      fire: { main: 0xffedd5, stripe: 0xef4444, fin: 0xd97706, window: 0x7c2d12, engine: 0x334155, metalness: 0.3, roughness: 0.3 },
      forest: { main: 0xecfdf5, stripe: 0x10b981, fin: 0x047857, window: 0x064e3b, engine: 0x334155, metalness: 0.2, roughness: 0.4 },
      lightning: { main: 0xfef9c3, stripe: 0xeab308, fin: 0xca8a04, window: 0x854d0e, engine: 0x334155, metalness: 0.4, roughness: 0.2 },
      galaxy: { main: 0xf3e8ff, stripe: 0x8b5cf6, fin: 0x6d28d9, window: 0x4c1d95, engine: 0x334155, metalness: 0.5, roughness: 0.2 }
    };
  }

  /**
   * 初始化 3D 渲染画布与场景
   */
  initScene(containerId) {
    this.destroy();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera: 调整相机位置与视角，使火箭居中显示在底部操作面板上方
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    if (containerId === "canvas-container-assembly") {
      this.camera.position.set(0, 1.2, 13);
    } else {
      this.camera.position.set(0, 1.5, 11);
    }

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.target.set(0, 0.6, 0); // 将镜头焦点微调向上，防遮挡
      this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 20;
    }

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf59e0b, 0.6, 12);
    pointLight.position.set(0, -1, 3);
    this.scene.add(pointLight);

    // 6. Build Rocket Group
    this.buildCurrentRocket();

    // 7. Start Render Loop
    this.animate();

    window.addEventListener("resize", () => this.onWindowResize(containerId));
  }

  /**
   * 根据当前选中的火箭型号与涂装构建 3D 模型
   */
  buildCurrentRocket() {
    if (this.rocketGroup && this.scene) {
      this.scene.remove(this.rocketGroup);
    }

    this.rocketGroup = new THREE.Group();
    // 全局微调火箭 Y 轴，提升视觉居中度
    this.rocketGroup.position.set(0, 0.6, 0);
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

    // 将 10 大零件 Mesh 添加至 group
    Object.keys(this.parts).forEach(partKey => {
      if (this.parts[partKey]) {
        this.rocketGroup.add(this.parts[partKey]);
      }
    });

    if (this.scene) {
      this.scene.add(this.rocketGroup);
    }

    // 根据已安装状态更新可见度
    const installed = window.storageManager ? window.storageManager.get("installedParts") : [];
    this.updateInstalledParts(installed);
  }

  /**
   * 型号 1：经典探索者号 (Classic Rocket)
   */
  createClassicRocket() {
    const colors = this.themeColors[this.currentTheme];

    const matMain = new THREE.MeshStandardMaterial({ color: colors.main, roughness: colors.roughness, metalness: colors.metalness });
    const matStripe = new THREE.MeshStandardMaterial({ color: colors.stripe, roughness: 0.2, metalness: 0.3 });
    const matFin = new THREE.MeshStandardMaterial({ color: colors.fin, roughness: 0.3 });
    const matEngine = new THREE.MeshStandardMaterial({ color: colors.engine, roughness: 0.5, metalness: 0.6 });
    const matWindow = new THREE.MeshStandardMaterial({ color: colors.window, roughness: 0.1, metalness: 0.8 });

    // 1. 主体 (body)
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 3.2, 32), matMain);
    const stripeMesh = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.08, 16, 32), matStripe);
    stripeMesh.rotation.x = Math.PI / 2;
    stripeMesh.position.y = 0.5;
    bodyMesh.add(stripeMesh);
    this.parts.body = bodyMesh;

    // 2. 头锥 (noseCone)
    const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 32), matStripe);
    noseMesh.position.y = 2.3;
    this.parts.noseCone = noseMesh;

    // 3. 发动机 (engine)
    const engineGroup = new THREE.Group();
    const engineNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 0.8, 32), matEngine);
    engineNozzle.position.y = -2.0;
    engineGroup.add(engineNozzle);
    this.parts.engine = engineGroup;

    // 4 & 5. 助推器
    const createBooster = (x) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.2, 16), matMain);
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.6, 16), matStripe);
      t.position.y = 1.4;
      g.add(b); g.add(t);
      g.position.set(x, -0.4, 0);
      return g;
    };
    this.parts.leftBooster = createBooster(-1.2);
    this.parts.rightBooster = createBooster(1.2);

    // 6 & 7. 尾翼
    const createFin = (x, flip) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), matFin);
      f.position.set(x, -1.2, 0);
      f.rotation.z = flip * 0.2;
      return f;
    };
    this.parts.leftFin = createFin(-1.0, 1);
    this.parts.rightFin = createFin(1.0, -1);

    // 8. 观察窗
    const windowGroup = new THREE.Group();
    const winGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32), matWindow);
    winGlass.rotation.x = Math.PI / 2;
    winGlass.position.set(0, 0.8, 0.82);
    windowGroup.add(winGlass);
    this.parts.window = windowGroup;

    // 9. 燃料箱
    const fuelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.4, 16), matStripe);
    fuelMesh.position.set(0, -0.2, -0.85);
    this.parts.fuelTank = fuelMesh;

    // 10. 控制舱
    const ctrlMesh = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 16, 32), matFin);
    ctrlMesh.rotation.x = Math.PI / 2;
    ctrlMesh.position.y = 1.4;
    this.parts.controlModule = ctrlMesh;
  }

  /**
   * 型号 2：SpaceX 星舰 (Starship - 亮银不锈钢流线型)
   */
  createStarshipRocket() {
    // 亮银高金属度材质
    const matSilver = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.1, metalness: 0.95 });
    const matDarkSteel = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.3, metalness: 0.8 });
    const matHeatShield = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8, metalness: 0.1 });
    const matWindow = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 });

    // 1. 主体 (Starship 圆柱不锈钢外壳)
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 3.6, 32), matSilver);
    // 背面防热瓦弧面
    const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 3.6, 32, 1, false, Math.PI, Math.PI), matHeatShield);
    bodyMesh.add(heatShield);
    this.parts.body = bodyMesh;

    // 2. 头锥 (弧形高耸不锈钢头锥)
    const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 32), matSilver);
    noseMesh.position.y = 2.7;
    this.parts.noseCone = noseMesh;

    // 3. 发动机 (猛禽 Raptor 引擎阵列)
    const engineGroup = new THREE.Group();
    const clusterBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 32), matDarkSteel);
    clusterBase.position.y = -2.0;
    // 6 个环形小喷管
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 16), matDarkSteel);
      nozzle.rotation.x = Math.PI;
      nozzle.position.set(Math.cos(angle) * 0.35, -0.3, Math.sin(angle) * 0.35);
      clusterBase.add(nozzle);
    }
    engineGroup.add(clusterBase);
    this.parts.engine = engineGroup;

    // 4 & 5. 助推器 (Super Heavy 重型第一级助推器)
    const createSuperHeavyBooster = (x) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 16), matSilver);
      const gridFin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.3), matDarkSteel);
      gridFin.position.set(0, 1.1, 0.3);
      g.add(b); g.add(gridFin);
      g.position.set(x, -0.6, 0);
      return g;
    };
    this.parts.leftBooster = createSuperHeavyBooster(-1.15);
    this.parts.rightBooster = createSuperHeavyBooster(1.15);

    // 6 & 7. 尾翼 (Starship 左右下动翼 Aero Flaps)
    const createFlap = (x, flip) => {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.6), matSilver);
      flap.position.set(x, -0.8, 0);
      flap.rotation.z = flip * 0.15;
      return flap;
    };
    this.parts.leftFin = createFlap(-0.85, 1);
    this.parts.rightFin = createFlap(0.85, -1);

    // 8. 观察窗 (星舰舷窗)
    const windowGroup = new THREE.Group();
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.08), matWindow);
    win.position.set(0, 2.2, 0.72);
    windowGroup.add(win);
    this.parts.window = windowGroup;

    // 9. 燃料箱 (甲烷液氧储罐环)
    const fuelMesh = new THREE.Mesh(new THREE.TorusGeometry(0.77, 0.05, 16, 32), matDarkSteel);
    fuelMesh.rotation.x = Math.PI / 2;
    fuelMesh.position.y = -0.5;
    this.parts.fuelTank = fuelMesh;

    // 10. 控制舱 (上前动翼与姿态控制点)
    const ctrlGroup = new THREE.Group();
    const topFlapL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.3), matSilver);
    topFlapL.position.set(-0.78, 2.8, 0);
    const topFlapR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.3), matSilver);
    topFlapR.position.set(0.78, 2.8, 0);
    ctrlGroup.add(topFlapL); ctrlGroup.add(topFlapR);
    this.parts.controlModule = ctrlGroup;
  }

  /**
   * 型号 3：猎鹰重型 (Falcon Heavy - 三芯并联运载火箭)
   */
  createFalconHeavyRocket() {
    const matWhite = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.3, metalness: 0.2 });
    const matBlack = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.3 });
    const matFalconWindow = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });

    // 1. 主体 (中央芯级)
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 3.4, 32), matWhite);
    this.parts.body = bodyMesh;

    // 2. 头锥 (整流罩 Payload Fairing)
    const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.5, 32), matWhite);
    noseMesh.position.y = 2.45;
    this.parts.noseCone = noseMesh;

    // 3. 发动机 (九章 Merlin 引擎群)
    const engineGroup = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.6, 32), matBlack);
    base.position.y = -2.0;
    engineGroup.add(base);
    this.parts.engine = engineGroup;

    // 4 & 5. 左右侧级助推器 (Side Boosters)
    const createSideCore = (x) => {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 3.0, 24), matWhite);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.8, 24), matBlack);
      cap.position.y = 1.9;
      g.add(core); g.add(cap);
      g.position.set(x, -0.2, 0);
      return g;
    };
    this.parts.leftBooster = createSideCore(-1.25);
    this.parts.rightBooster = createSideCore(1.25);

    // 6 & 7. 网格舵 (Grid Fins)
    const createGridFin = (x, flip) => {
      const gf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.08), matBlack);
      gf.position.set(x, 1.2, 0);
      return gf;
    };
    this.parts.leftFin = createGridFin(-0.7, 1);
    this.parts.rightFin = createGridFin(0.7, -1);

    // 8. 观察窗
    const windowGroup = new THREE.Group();
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 32), matFalconWindow);
    win.rotation.x = Math.PI / 2;
    win.position.set(0, 1.0, 0.67);
    windowGroup.add(win);
    this.parts.window = windowGroup;

    // 9. 燃料箱 (联结强梁与燃料管路)
    const fuelMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.3), matBlack);
    fuelMesh.position.set(0, 0.2, 0);
    this.parts.fuelTank = fuelMesh;

    // 10. 控制舱 (黑白相间姿态控制环)
    const ctrlMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.3, 32), matBlack);
    ctrlMesh.position.y = 1.4;
    this.parts.controlModule = ctrlMesh;
  }

  /**
   * 型号 4：长征重载号 (Long March 5 - 胖五大推力运载火箭)
   */
  createLongMarchRocket() {
    const matCore = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
    const matRedStripe = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2 });
    const matFlagRed = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.6 });

    // 1. 主体 (5米大直径胖五芯级)
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 3.2, 32), matCore);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.01, 1.01, 0.3, 32), matRedStripe);
    stripe.position.y = 0.8;
    bodyMesh.add(stripe);
    this.parts.body = bodyMesh;

    // 2. 头锥 (钝头大容积整流罩)
    const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.6, 32), matCore);
    noseMesh.position.y = 2.4;
    this.parts.noseCone = noseMesh;

    // 3. 发动机 (氢氧/液氧煤油发动机)
    const engineGroup = new THREE.Group();
    const nozzle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.65, 0.7, 32), matDark);
    nozzle1.position.set(-0.35, -1.95, 0);
    const nozzle2 = nozzle1.clone();
    nozzle2.position.x = 0.35;
    engineGroup.add(nozzle1); engineGroup.add(nozzle2);
    this.parts.engine = engineGroup;

    // 4 & 5. 四大助推器 (3.35米助推器对)
    const createCZBooster = (x) => {
      const g = new THREE.Group();
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.4, 20), matCore);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 20), matRedStripe);
      top.position.y = 1.55;
      g.add(b); g.add(top);
      g.position.set(x, -0.4, 0);
      return g;
    };
    this.parts.leftBooster = createCZBooster(-1.45);
    this.parts.rightBooster = createCZBooster(1.45);

    // 6 & 7. 尾翼 (助推器斜切尾翼)
    const createCZFin = (x, flip) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.6), matRedStripe);
      f.position.set(x, -1.2, 0);
      f.rotation.z = flip * 0.15;
      return f;
    };
    this.parts.leftFin = createCZFin(-1.8, 1);
    this.parts.rightFin = createCZFin(1.8, -1);

    // 8. 观察窗
    const windowGroup = new THREE.Group();
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.05), matFlagRed);
    flag.position.set(0, 0.2, 1.02);
    windowGroup.add(flag);
    this.parts.window = windowGroup;

    // 9. 燃料箱
    const fuelMesh = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.06, 16, 32), matDark);
    fuelMesh.rotation.x = Math.PI / 2;
    fuelMesh.position.y = -1.0;
    this.parts.fuelTank = fuelMesh;

    // 10. 控制舱
    const ctrlMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.01, 1.01, 0.2, 32), matRedStripe);
    ctrlMesh.position.y = 1.5;
    this.parts.controlModule = ctrlMesh;
  }

  /**
   * 型号 5：未来量子号 (Cyber Starship - 赛博霓虹能量巡航舰)
   */
  createCyberRocket() {
    const matCyberBody = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.2, metalness: 0.8 });
    const matNeonBlue = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const matNeonPink = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    // 1. 主体 (多棱体赛博舰体)
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 3.4, 8), matCyberBody);
    const energyLine = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.05, 16, 8), matNeonBlue);
    energyLine.rotation.x = Math.PI / 2;
    energyLine.position.y = 0;
    bodyMesh.add(energyLine);
    this.parts.body = bodyMesh;

    // 2. 头锥 (水晶感能量头锥)
    const noseMesh = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 8), matNeonBlue);
    noseMesh.position.y = 2.5;
    this.parts.noseCone = noseMesh;

    // 3. 发动机 (量子环形推进器)
    const engineGroup = new THREE.Group();
    const ringEngine = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.15, 16, 32), matNeonPink);
    ringEngine.rotation.x = Math.PI / 2;
    ringEngine.position.y = -1.9;
    engineGroup.add(ringEngine);
    this.parts.engine = engineGroup;

    // 4 & 5. 助推器 (双侧离子浮游炮/助推悬浮舱)
    const createCyberBooster = (x) => {
      const g = new THREE.Group();
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.2, 6), matCyberBody);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 12, 16), matNeonBlue);
      ring.rotation.x = Math.PI / 2;
      g.add(pod); g.add(ring);
      g.position.set(x, -0.2, 0);
      return g;
    };
    this.parts.leftBooster = createCyberBooster(-1.3);
    this.parts.rightBooster = createCyberBooster(1.3);

    // 6 & 7. 尾翼 (霓虹能量后翼)
    const createCyberWing = (x, flip) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 1.0), matNeonBlue);
      wing.position.set(x, -0.6, 0);
      wing.rotation.y = flip * 0.3;
      return wing;
    };
    this.parts.leftFin = createCyberWing(-1.1, 1);
    this.parts.rightFin = createCyberWing(1.1, -1);

    // 8. 观察窗 (全息视界驾驶舱)
    const windowGroup = new THREE.Group();
    const holoWindow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), matNeonBlue);
    holoWindow.position.set(0, 1.2, 0.65);
    windowGroup.add(holoWindow);
    this.parts.window = windowGroup;

    // 9. 燃料箱 (反物质能量核心)
    const fuelMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), matNeonPink);
    fuelMesh.position.set(0, -0.6, 0.8);
    this.parts.fuelTank = fuelMesh;

    // 10. 控制舱 (量子计算光环)
    const ctrlMesh = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 16, 32), matNeonPink);
    ctrlMesh.rotation.x = Math.PI / 2;
    ctrlMesh.position.y = 1.8;
    this.parts.controlModule = ctrlMesh;
  }

  /**
   * 根据已安装零件列表更新火箭展示
   */
  updateInstalledParts(installedPartIds) {
    Object.keys(this.parts).forEach(partKey => {
      if (this.parts[partKey]) {
        this.parts[partKey].visible = installedPartIds.includes(partKey);
      }
    });
  }

  /**
   * 播放 3D 零件飞向火箭姿态对齐的平滑动画
   */
  animateInstallPart(partId, callback) {
    const part = this.parts[partId];
    if (!part) {
      if (callback) callback();
      return;
    }

    part.visible = true;
    const targetY = part.position.y;
    const origScaleX = part.scale ? part.scale.x : 1;

    // 初始动画状态：从右上方飞入，带旋转与放缩
    part.position.x = 3.5;
    part.position.y = targetY + 1.5;
    part.position.z = 2.0;
    part.rotation.y = Math.PI;
    part.scale.set(0.3, 0.3, 0.3);
    
    let progress = 0;
    const duration = 30; // 30 帧平滑轨迹

    const step = () => {
      progress++;
      const ratio = progress / duration;
      // Ease-out cubic 减速曲线
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

  /**
   * 切换火箭型号 ('classic' | 'starship' | 'falconHeavy' | 'longMarch' | 'cyber')
   */
  setModel(modelName) {
    this.currentModel = modelName;
    if (window.storageManager) window.storageManager.set("selectedRocketModel", modelName);
    this.buildCurrentRocket();
  }

  /**
   * 切换火箭主题配色
   */
  setTheme(themeName) {
    if (this.themeColors[themeName]) {
      this.currentTheme = themeName;
      if (window.storageManager) window.storageManager.set("selectedRocketTheme", themeName);
      this.buildCurrentRocket();
    }
  }

  /**
   * 主渲染循环
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.controls) this.controls.update();

    if (this.rocketGroup) {
      this.rocketGroup.rotation.y += 0.005;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
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
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// 导出单例对象
window.rocketBuilder = new RocketBuilder();
