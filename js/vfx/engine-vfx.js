/**
 * Multiplication Rocket Lab - Advanced Engine VFX System (js/vfx/engine-vfx.js)
 * Version 4.2.0 Cinematic VFX & Animation Overhaul
 * 
 * Implements additive white-hot core, gradient plume, 3-5 shock diamonds,
 * soft bloom glow sprite, dynamic trailing ribbon, and atmospheric vs vacuum transitions.
 */
class EngineVFXSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = (typeof THREE !== "undefined" && THREE.Group) ? new THREE.Group() : { add() {}, remove() {}, position: { set() {} }, visible: true };
    this.state = {
      throttle: 1.0,
      targetThrottle: 1.0,
      plumeLength: 1.0,
      plumeWidth: 1.0,
      flicker: 1.0,
      vacuumExpansion: 0.0, // 0 = Atmosphere, 1 = Vacuum Deep Space
      colorMode: "atmosphere", // "atmosphere" | "vacuum" | "hyper"
      visible: false
    };

    this.coreMesh = null;
    this.plumeMesh = null;
    this.outerPlumeMesh = null;
    this.shockDiamonds = [];
    this.glowSprite = null;
    this.trailRibbon = null;
    this.trailPositions = [];
    this.maxTrailPoints = 30;
    this.trailGeometry = null;

    this.initMeshes();
  }

  get engineVfxState() {
    return this.state;
  }

  initMeshes() {
    if (typeof THREE === "undefined") return;

    // 1. White-Hot Core Cone
    const coreGeo = new THREE.ConeGeometry(0.32, 2.2, 16);
    coreGeo.rotateX(Math.PI);
    coreGeo.translate(0, -1.1, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.coreMesh);

    // 2. Main Plume Cone
    const plumeGeo = new THREE.ConeGeometry(0.55, 3.8, 20);
    plumeGeo.rotateX(Math.PI);
    plumeGeo.translate(0, -1.9, 0);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0xff7722,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
    this.group.add(this.plumeMesh);

    // 3. Outer Vacuum Plume (Expands in high altitude/vacuum)
    const outerGeo = new THREE.ConeGeometry(0.85, 4.5, 20);
    outerGeo.rotateX(Math.PI);
    outerGeo.translate(0, -2.25, 0);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.outerPlumeMesh = new THREE.Mesh(outerGeo, outerMat);
    this.outerPlumeMesh.visible = false;
    this.group.add(this.outerPlumeMesh);

    // 4. Supersonic Shock Diamonds (4 Glowing Diamonds along axis)
    const shockCount = 4;
    for (let i = 0; i < shockCount; i++) {
      const diaGeo = new THREE.OctahedronGeometry(0.18 - i * 0.025, 1);
      const diaMat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const diaMesh = new THREE.Mesh(diaGeo, diaMat);
      diaMesh.position.y = -0.7 - i * 0.75;
      diaMesh.scale.set(0.8, 1.6, 0.8);
      this.shockDiamonds.push(diaMesh);
      this.group.add(diaMesh);
    }

    // 5. Bloom Glow Sprite (Procedural Canvas Glow)
    const glowTex = EngineVFXSystem.createGlowTexture();
    if (glowTex) {
      const glowMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffaa44,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.glowSprite = new THREE.Sprite(glowMat);
      this.glowSprite.scale.set(2.5, 2.5, 1.0);
      this.glowSprite.position.set(0, -0.5, 0);
      this.group.add(this.glowSprite);
    }

    this.group.visible = false;
  }

  static createGlowTexture() {
    if (typeof document === "undefined" || !document.createElement) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx || !ctx.createRadialGradient) return null;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.3, "rgba(255, 180, 60, 0.8)");
    grad.addColorStop(0.7, "rgba(255, 80, 20, 0.3)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    if (typeof THREE !== "undefined" && THREE.CanvasTexture) {
      return new THREE.CanvasTexture(canvas);
    }
    return null;
  }

  /**
   * Set engine throttle smoothly (0.0 to 1.0)
   */
  setThrottle(val, immediate = true) {
    this.state.targetThrottle = Math.max(0, Math.min(1.5, val));
    this.state.throttle = this.state.targetThrottle;
  }

  setVacuumExpansion(val) {
    this.state.vacuumExpansion = Math.max(0, Math.min(1.0, val));
  }

  /**
   * Set mode: atmosphere (orange/white, narrow) vs vacuum (blue/white, wide)
   */
  setEnvironmentMode(mode = "atmosphere", vacuumProgress = 0) {
    this.state.colorMode = mode;
    this.setVacuumExpansion(vacuumProgress);

    if (this.plumeMesh && this.plumeMesh.material) {
      if (mode === "vacuum") {
        this.plumeMesh.material.color.setHex(0x38bdf8); // Cyan-blue vacuum plasma
        if (this.glowSprite) this.glowSprite.material.color.setHex(0x60a5fa);
      } else if (mode === "hyper") {
        this.plumeMesh.material.color.setHex(0xa855f7); // Deep space purple warp
        if (this.glowSprite) this.glowSprite.material.color.setHex(0xc084fc);
      } else {
        this.plumeMesh.material.color.setHex(0xff7722); // Atmospheric orange-gold
        if (this.glowSprite) this.glowSprite.material.color.setHex(0xffaa44);
      }
    }
  }

  setVisible(vis) {
    this.state.visible = !!vis;
    this.group.visible = !!vis;
  }

  /**
   * Update engine VFX animation frame with deltaTime
   * @param {number} dt Delta time in seconds
   * @param {number} time Global timestamp in seconds
   */
  update(dt, time = 0) {
    if (!this.group.visible) return;

    // Smooth throttle interpolation
    const lerpRate = Math.min(1.0, dt * 10);
    this.state.throttle += (this.state.targetThrottle - this.state.throttle) * lerpRate;

    const th = this.state.throttle;
    if (th <= 0.01) {
      this.group.visible = false;
      return;
    }
    this.group.visible = this.state.visible;

    // Supersonic flicker oscillation
    const flicker = 1.0 + Math.sin(time * 45) * 0.08 + Math.cos(time * 30) * 0.05;
    this.state.flicker = flicker;

    const vac = this.state.vacuumExpansion;
    const lengthMultiplier = (1.0 + vac * 0.8) * th * flicker;
    const widthMultiplier = (1.0 + vac * 1.5) * (0.85 + th * 0.15);

    // 1. Core scale
    if (this.coreMesh) {
      this.coreMesh.scale.set(widthMultiplier * 0.9, lengthMultiplier * 0.95, widthMultiplier * 0.9);
      this.coreMesh.material.opacity = Math.min(0.98, 0.6 + th * 0.4);
    }

    // 2. Main Plume scale
    if (this.plumeMesh) {
      this.plumeMesh.scale.set(widthMultiplier, lengthMultiplier, widthMultiplier);
      this.plumeMesh.material.opacity = Math.min(0.85, 0.4 + th * 0.45);
    }

    // 3. Outer Vacuum Plume
    if (this.outerPlumeMesh) {
      if (vac > 0.1 && th > 0.2) {
        this.outerPlumeMesh.visible = true;
        this.outerPlumeMesh.scale.set(widthMultiplier * 1.4, lengthMultiplier * 1.2, widthMultiplier * 1.4);
        this.outerPlumeMesh.material.opacity = vac * 0.35 * th;
      } else {
        this.outerPlumeMesh.visible = false;
      }
    }

    // 4. Shock Diamonds dynamic oscillation
    this.shockDiamonds.forEach((dia, idx) => {
      const diaOffset = (idx + 1) * (0.7 + vac * 0.35) * th;
      dia.position.y = -diaOffset;
      const diaScale = (1.0 - idx * 0.15) * th * (0.9 + Math.sin(time * 40 + idx) * 0.1);
      dia.scale.set(diaScale * (1.0 + vac * 0.8), diaScale * 1.6, diaScale * (1.0 + vac * 0.8));
      dia.visible = th > 0.35;
    });

    // 5. Glow Sprite
    if (this.glowSprite) {
      const gScale = (2.2 + vac * 1.2) * th * flicker;
      this.glowSprite.scale.set(gScale, gScale, 1.0);
      this.glowSprite.material.opacity = Math.min(0.9, 0.3 + th * 0.6);
    }
  }

  dispose() {
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
    if (this.group && typeof this.group.traverse === "function") {
      this.group.traverse(child => {
        if (child && child.geometry && child.geometry.dispose) child.geometry.dispose();
        if (child && child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m && m.dispose && m.dispose());
          else if (child.material.dispose) child.material.dispose();
        }
      });
    }
  }
}

// Export for browser and node
if (typeof module !== "undefined" && module.exports) {
  module.exports = EngineVFXSystem;
}
