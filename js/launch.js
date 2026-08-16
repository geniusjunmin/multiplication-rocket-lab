/**
 * 乘法火箭实验室 - Three.js 3D 发射与升空动画序列引擎 (launch.js)
 */
class LaunchSequence {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.rocket = null;
    this.flameMesh = null;
    this.starsGroup = null;
    this.earthMesh = null;
    this.animationId = null;
    this.currentStage = "idle";
    this.countdownValue = 5;
    this.countdownTimer = null;
    this.timeouts = [];
    this.cameraShakeIntensity = 0;
  }

  /**
   * 初始化 3D 发射与太空场景并销毁旧场景资源
   */
  initScene(containerId) {
    this.destroy();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0b0e1b, 0.015);

    // 2. Camera (仰视起飞角度)
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    this.camera.position.set(0, 1.5, 9);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 15);
    this.scene.add(dirLight);

    this.engineLight = new THREE.PointLight(0xff4500, 0, 20);
    this.engineLight.position.set(0, -2, 0);
    this.scene.add(this.engineLight);

    // 5. Environment Elements & Rocket
    this.createLaunchPad();
    this.createSpaceEnvironment();
    this.createRocketCopy();

    // 6. Reset HUD UI state
    this.resetHUDUI();

    // 7. Start Loop
    this.animate();
  }

  /**
   * 重置发射 HUD UI 视图状态
   */
  resetHUDUI() {
    document.getElementById("launch-checklist")?.classList.remove("hidden");
    document.getElementById("launch-countdown-box")?.classList.add("hidden");
    document.getElementById("space-victory-banner")?.classList.add("hidden");

    const checkItems = [
      { id: 1, text: "⚙️ 控制系统", status: "检查中..." },
      { id: 2, text: "🔥 发动机点火器", status: "待命" },
      { id: 3, text: "⛽ 乘法高能燃料", status: "待命" },
      { id: 4, text: "🛰️ 太空导航罗盘", status: "待命" }
    ];

    checkItems.forEach(item => {
      const el = document.getElementById(`check-item-${item.id}`);
      if (el) {
        el.querySelector(".status").innerText = item.status;
        el.querySelector(".status").style.color = "";
      }
    });
  }

  /**
   * 创建地面发射平台与发射塔
   */
  createLaunchPad() {
    this.launchPadGroup = new THREE.Group();

    const padGeo = new THREE.CylinderGeometry(6, 6.5, 0.6, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = -2.3;
    this.launchPadGroup.add(pad);

    const towerGeo = new THREE.BoxGeometry(0.8, 12, 0.8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-2.5, 3.5, -1);
    this.launchPadGroup.add(tower);

    this.scene.add(this.launchPadGroup);
  }

  /**
   * 创建深空星云与地球弧面
   */
  createSpaceEnvironment() {
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 400;
      positions[i + 1] = Math.random() * 300 + 20;
      positions[i + 2] = (Math.random() - 0.5) * 400;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.9 });
    this.starsGroup = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.starsGroup);

    const earthGeo = new THREE.SphereGeometry(60, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.position.set(0, -65, -30);
    this.earthMesh.visible = false;
    this.scene.add(this.earthMesh);
  }

  /**
   * 从 RocketBuilder 复制或重建当前玩家选中的 3D 火箭模型
   */
  createRocketCopy() {
    if (window.rocketBuilder) {
      window.rocketBuilder.buildCurrentRocket();
      this.rocket = window.rocketBuilder.rocketGroup.clone();
      this.rocket.position.set(0, 0, 0);
      if (this.scene && this.rocket) {
        this.scene.add(this.rocket);
      }

      this.rocket.children.forEach(child => {
        child.visible = true;
      });

      const flameGeo = new THREE.ConeGeometry(0.8, 3.0, 32);
      flameGeo.rotateX(Math.PI);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.85
      });
      this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
      this.flameMesh.position.set(0, -3.0, 0);
      this.flameMesh.visible = false;
      this.rocket.add(this.flameMesh);
    }
  }

  /**
   * 启动流畅快速的发射序列
   */
  startLaunchSequence(onComplete) {
    this.currentStage = "checking";
    this.resetHUDUI();
    
    // 阶段 1: 检查表亮绿灯 (快速 0.3s 每项)
    const checkItems = [1, 2, 3, 4];
    checkItems.forEach((item, idx) => {
      const t = setTimeout(() => {
        const el = document.getElementById(`check-item-${item}`);
        if (el) {
          el.querySelector(".status").innerHTML = "✅ 正常";
          el.querySelector(".status").style.color = "#34d399";
        }
        if (window.audioManager) window.audioManager.playBeep(false);
      }, (idx + 1) * 300);
      this.timeouts.push(t);
    });

    // 阶段 2: 切换到倒计时
    const t2 = setTimeout(() => {
      document.getElementById("launch-checklist")?.classList.add("hidden");
      document.getElementById("launch-countdown-box")?.classList.remove("hidden");
      this.startCountdown(() => {
        // 阶段 3: 点火
        this.triggerIgnition(() => {
          // 阶段 4: 升空
          this.triggerLiftoff(onComplete);
        });
      });
    }, 1400);
    this.timeouts.push(t2);
  }

  /**
   * 5s 倒计时
   */
  startCountdown(onFinished) {
    this.countdownValue = 5;
    const numEl = document.getElementById("countdown-num");
    if (numEl) numEl.innerText = 5;

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = setInterval(() => {
      if (numEl) numEl.innerText = this.countdownValue > 0 ? this.countdownValue : "点火！";
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

  /**
   * 点火引擎与短暂震动
   */
  triggerIgnition(onFinished) {
    this.currentStage = "ignition";
    if (this.flameMesh) this.flameMesh.visible = true;
    if (this.engineLight) this.engineLight.intensity = 4.0;
    this.cameraShakeIntensity = 0.15;

    if (window.audioManager) window.audioManager.playIgnition();

    const t = setTimeout(() => {
      if (onFinished) onFinished();
    }, 800);
    this.timeouts.push(t);
  }

  /**
   * 火箭高速离地升空与镜头跟随
   */
  triggerLiftoff(onComplete) {
    this.currentStage = "liftoff";
    let speed = 0.08;

    const liftLoop = () => {
      if (this.currentStage !== "liftoff" && this.currentStage !== "space") return;
      if (this.rocket) {
        this.rocket.position.y += speed;
        speed += 0.015; // 持续加速冲向天际

        if (this.camera) this.camera.position.y = this.rocket.position.y + 1.5;

        if (this.rocket.position.y > 40 && this.currentStage !== "space") {
          this.currentStage = "space";
          if (this.scene) this.scene.fog = new THREE.FogExp2(0x000000, 0.001);
          if (this.earthMesh) this.earthMesh.visible = true;
          this.cameraShakeIntensity = 0;

          document.getElementById("space-victory-banner")?.classList.remove("hidden");
          if (window.audioManager) window.audioManager.playVictory();
          if (onComplete) onComplete();
        }

        if (this.rocket.position.y < 160) {
          requestAnimationFrame(liftLoop);
        }
      }
    };
    liftLoop();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.cameraShakeIntensity > 0 && this.camera) {
      this.camera.position.x = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.z = 9 + (Math.random() - 0.5) * this.cameraShakeIntensity;
    }

    if (this.flameMesh && this.flameMesh.visible) {
      this.flameMesh.scale.y = 1 + Math.sin(Date.now() * 0.02) * 0.2;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
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
