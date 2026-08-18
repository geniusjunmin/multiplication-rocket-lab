/**
 * Multiplication Rocket Lab - Particle & Atmosphere System (js/vfx/particle-system.js)
 * Version 4.2.0 Cinematic VFX & Animation Overhaul
 * 
 * Implements soft canvas sprite smoke, deltaTime-driven particle physics,
 * ground shockwave expansion, radial landing dust, cloud punch-through, and ring ice fields.
 */
class ParticleSystem {
  constructor(scene, quality = "high") {
    this.scene = scene;
    this.quality = quality; // "high" | "medium" | "low"

    this.smokePool = [];
    this.dustPool = [];
    this.sparkPool = [];
    this.ringIceParticles = null;
    this.cloudLayers = [];

    this.softSmokeTexture = null;
    this.softDustTexture = null;

    this.initTextures();
    this.initPools();
  }

  static getQualityConfig(tier = "high") {
    const configs = {
      high: { smoke: 120, dust: 100, sparks: 80, ringIce: 600 },
      medium: { smoke: 70, dust: 60, sparks: 40, ringIce: 300 },
      low: { smoke: 35, dust: 30, sparks: 20, ringIce: 120 }
    };
    return configs[tier] || configs.high;
  }

  initTextures() {
    if (typeof document === "undefined" || !document.createElement) return;

    // 1. Soft Smoke Radial Gradient Texture
    const smokeCanvas = document.createElement("canvas");
    smokeCanvas.width = 64;
    smokeCanvas.height = 64;
    const sCtx = smokeCanvas.getContext("2d");
    if (sCtx && sCtx.createRadialGradient) {
      const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(240, 240, 245, 0.95)");
      grad.addColorStop(0.3, "rgba(200, 205, 215, 0.7)");
      grad.addColorStop(0.7, "rgba(160, 165, 180, 0.25)");
      grad.addColorStop(1.0, "rgba(100, 110, 130, 0)");
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 64, 64);

      if (typeof THREE !== "undefined" && THREE.CanvasTexture) {
        this.softSmokeTexture = new THREE.CanvasTexture(smokeCanvas);
      }
    }

    // 2. Soft Dust Radial Gradient Texture (Planetary Landing Dust)
    const dustCanvas = document.createElement("canvas");
    dustCanvas.width = 64;
    dustCanvas.height = 64;
    const dCtx = dustCanvas.getContext("2d");
    if (dCtx && dCtx.createRadialGradient) {
      const grad = dCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(230, 210, 180, 0.9)");
      grad.addColorStop(0.35, "rgba(190, 160, 130, 0.6)");
      grad.addColorStop(0.7, "rgba(150, 120, 90, 0.2)");
      grad.addColorStop(1.0, "rgba(100, 80, 60, 0)");
      dCtx.fillStyle = grad;
      dCtx.fillRect(0, 0, 64, 64);

      if (typeof THREE !== "undefined" && THREE.CanvasTexture) {
        this.softDustTexture = new THREE.CanvasTexture(dustCanvas);
      }
    }
  }

  initPools() {
    if (typeof THREE === "undefined" || !this.scene) return;

    const q = ParticleSystem.getQualityConfig(this.quality);

    // 1. Soft Smoke Sprite Pool
    const smokeMat = new THREE.SpriteMaterial({
      map: this.softSmokeTexture || null,
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    for (let i = 0; i < q.smoke; i++) {
      const sprite = new THREE.Sprite(smokeMat.clone());
      sprite.visible = false;
      this.scene.add(sprite);
      this.smokePool.push({
        mesh: sprite,
        active: false,
        life: 0,
        maxLife: 2.0,
        vx: 0, vy: 0, vz: 0,
        baseScale: 1.0,
        growthRate: 2.5,
        rotationSpeed: (Math.random() - 0.5) * 2.0
      });
    }

    // 2. Landing Dust Sprite Pool
    const dustMat = new THREE.SpriteMaterial({
      map: this.softDustTexture || null,
      color: 0xd1d5db,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });

    for (let i = 0; i < q.dust; i++) {
      const sprite = new THREE.Sprite(dustMat.clone());
      sprite.visible = false;
      this.scene.add(sprite);
      this.dustPool.push({
        mesh: sprite,
        active: false,
        life: 0,
        maxLife: 1.8,
        vx: 0, vy: 0, vz: 0,
        baseScale: 0.8,
        growthRate: 3.5
      });
    }

    // 3. Ignition Spark Ember Pool
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sparkGeo = new THREE.OctahedronGeometry(0.06, 0);

    for (let i = 0; i < q.sparks; i++) {
      const mesh = new THREE.Mesh(sparkGeo, sparkMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.sparkPool.push({
        mesh: mesh,
        active: false,
        life: 0,
        maxLife: 0.8,
        vx: 0, vy: 0, vz: 0
      });
    }
  }

  /**
   * Emit expanding launch ignition smoke burst horizontally along pad
   */
  emitLaunchTrenchSmoke(origin = { x: 0, y: 0, z: 0 }, count = 12) {
    this.emitIgnitionSmoke(origin.x || 0, origin.y || 0, origin.z || 0, count);
  }

  emitIgnitionSmoke(originX = 0, originY = 0, originZ = 0, count = 12) {
    let emitted = 0;
    for (let i = 0; i < this.smokePool.length && emitted < count; i++) {
      const p = this.smokePool[i];
      if (!p.active) {
        p.active = true;
        p.life = 2.0 + Math.random() * 0.8;
        p.maxLife = p.life;
        p.mesh.position.set(
          originX + (Math.random() - 0.5) * 1.5,
          originY + Math.random() * 0.5,
          originZ + (Math.random() - 0.5) * 1.5
        );
        // Horizontal outward blast velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = 4.0 + Math.random() * 6.0;
        p.vx = Math.cos(angle) * speed;
        p.vy = 0.5 + Math.random() * 2.0; // slight billow upwards
        p.vz = Math.sin(angle) * speed;
        p.baseScale = 1.2 + Math.random() * 0.8;
        p.mesh.scale.set(p.baseScale, p.baseScale, 1);
        p.mesh.material.opacity = 0.85;
        p.mesh.visible = true;
        emitted++;
      }
    }
  }

  /**
   * Emit trailing flight smoke behind rocket
   */
  emitFlightSmoke(pos, count = 2) {
    let emitted = 0;
    for (let i = 0; i < this.smokePool.length && emitted < count; i++) {
      const p = this.smokePool[i];
      if (!p.active) {
        p.active = true;
        p.life = 1.4 + Math.random() * 0.6;
        p.maxLife = p.life;
        p.mesh.position.set(
          pos.x + (Math.random() - 0.5) * 0.4,
          pos.y - 2.0,
          pos.z + (Math.random() - 0.5) * 0.4
        );
        p.vx = (Math.random() - 0.5) * 1.2;
        p.vy = -3.0 - Math.random() * 2.0;
        p.vz = (Math.random() - 0.5) * 1.2;
        p.baseScale = 0.9 + Math.random() * 0.5;
        p.mesh.scale.set(p.baseScale, p.baseScale, 1);
        p.mesh.material.opacity = 0.7;
        p.mesh.visible = true;
        emitted++;
      }
    }
  }

  /**
   * Emit radial landing dust upon retro-propulsion contact with surface
   */
  emitLandingDust(pos, surfaceColor = 0xd1d5db, count = 6) {
    let emitted = 0;
    for (let i = 0; i < this.dustPool.length && emitted < count; i++) {
      const p = this.dustPool[i];
      if (!p.active) {
        p.active = true;
        p.life = 1.6 + Math.random() * 0.8;
        p.maxLife = p.life;
        p.mesh.material.color.setHex(surfaceColor);
        p.mesh.position.set(
          pos.x + (Math.random() - 0.5) * 0.6,
          0.1 + Math.random() * 0.3,
          pos.z + (Math.random() - 0.5) * 0.6
        );
        const angle = Math.random() * Math.PI * 2;
        const speed = 3.5 + Math.random() * 5.0;
        p.vx = Math.cos(angle) * speed;
        p.vy = 0.2 + Math.random() * 1.2;
        p.vz = Math.sin(angle) * speed;
        p.baseScale = 0.8 + Math.random() * 0.6;
        p.mesh.scale.set(p.baseScale, p.baseScale, 1);
        p.mesh.material.opacity = 0.75;
        p.mesh.visible = true;
        emitted++;
      }
    }
  }

  /**
   * Emit ignition sparks
   */
  emitIgnitionSparks(pos, count = 8) {
    let emitted = 0;
    for (let i = 0; i < this.sparkPool.length && emitted < count; i++) {
      const p = this.sparkPool[i];
      if (!p.active) {
        p.active = true;
        p.life = 0.4 + Math.random() * 0.4;
        p.maxLife = p.life;
        p.mesh.position.set(pos.x, pos.y, pos.z);
        const angle = Math.random() * Math.PI * 2;
        const speed = 4.0 + Math.random() * 8.0;
        p.vx = Math.cos(angle) * speed;
        p.vy = -1.0 + Math.random() * 4.0;
        p.vz = Math.sin(angle) * speed;
        p.mesh.visible = true;
        emitted++;
      }
    }
  }

  /**
   * Create Saturn Ring Ice Particle Field (300-600 points)
   */
  createSaturnIceField(count = 500) {
    if (typeof THREE === "undefined" || !this.scene) return;
    if (this.ringIceParticles) {
      this.scene.remove(this.ringIceParticles);
      this.ringIceParticles.geometry.dispose();
      this.ringIceParticles.material.dispose();
    }

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 25 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.8; // Flat ring plane
      pos[i * 3 + 2] = Math.sin(theta) * r;

      vel[i * 3] = -Math.sin(theta) * 2.0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = Math.cos(theta) * 2.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.25,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.ringIceParticles = new THREE.Points(geo, mat);
    this.ringIceParticles.userData = { vel, count };
    this.scene.add(this.ringIceParticles);
  }

  /**
   * Update all particle systems using strictly DeltaTime (dt in seconds)
   */
  update(dt) {
    if (dt <= 0) return;

    // 1. Update Smoke Particles (DeltaTime)
    for (let i = 0; i < this.smokePool.length; i++) {
      const p = this.smokePool[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }

        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        // Decelerate horizontal blast
        p.vx *= (1.0 - dt * 1.5);
        p.vz *= (1.0 - dt * 1.5);

        // Expand and fade
        const progress = 1.0 - p.life / p.maxLife;
        const curScale = p.baseScale * (1.0 + progress * p.growthRate);
        p.mesh.scale.set(curScale, curScale, 1);
        p.mesh.material.opacity = Math.max(0, (1.0 - progress) * 0.8);
      }
    }

    // 2. Update Dust Particles (DeltaTime)
    for (let i = 0; i < this.dustPool.length; i++) {
      const p = this.dustPool[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }

        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        p.vx *= (1.0 - dt * 2.0);
        p.vz *= (1.0 - dt * 2.0);

        const progress = 1.0 - p.life / p.maxLife;
        const curScale = p.baseScale * (1.0 + progress * p.growthRate);
        p.mesh.scale.set(curScale, curScale, 1);
        p.mesh.material.opacity = Math.max(0, (1.0 - progress) * 0.75);
      }
    }

    // 3. Update Sparks (DeltaTime)
    for (let i = 0; i < this.sparkPool.length; i++) {
      const p = this.sparkPool[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }

        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 9.8 * dt; // Gravity on sparks
      }
    }

    // 4. Update Saturn Ice Particles
    if (this.ringIceParticles && this.ringIceParticles.visible && this.ringIceParticles.geometry && this.ringIceParticles.geometry.attributes) {
      const posAttr = this.ringIceParticles.geometry.attributes.position;
      const count = (this.ringIceParticles.userData && this.ringIceParticles.userData.count) || 0;
      if (posAttr && typeof posAttr.getX === "function") {
        for (let i = 0; i < count; i++) {
          let x = posAttr.getX(i);
          let z = posAttr.getZ(i);
          // Orbital rotation
          const angle = 0.08 * dt;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          const nx = x * cosA - z * sinA;
          const nz = x * sinA + z * cosA;
          posAttr.setX(i, nx);
          posAttr.setZ(i, nz);
        }
        posAttr.needsUpdate = true;
      }
    }
  }

  dispose() {
    this.smokePool.forEach(p => {
      if (p && p.mesh) {
        if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
        if (p.mesh.material && p.mesh.material.dispose) p.mesh.material.dispose();
      }
    });
    this.dustPool.forEach(p => {
      if (p && p.mesh) {
        if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
        if (p.mesh.material && p.mesh.material.dispose) p.mesh.material.dispose();
      }
    });
    this.sparkPool.forEach(p => {
      if (p && p.mesh) {
        if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
        if (p.mesh.geometry && p.mesh.geometry.dispose) p.mesh.geometry.dispose();
        if (p.mesh.material && p.mesh.material.dispose) p.mesh.material.dispose();
      }
    });
    if (this.ringIceParticles) {
      if (this.ringIceParticles.parent) this.ringIceParticles.parent.remove(this.ringIceParticles);
      if (this.ringIceParticles.geometry && this.ringIceParticles.geometry.dispose) this.ringIceParticles.geometry.dispose();
      if (this.ringIceParticles.material && this.ringIceParticles.material.dispose) this.ringIceParticles.material.dispose();
      this.ringIceParticles = null;
    }
    if (this.softSmokeTexture && typeof this.softSmokeTexture.dispose === "function") this.softSmokeTexture.dispose();
    if (this.softDustTexture && typeof this.softDustTexture.dispose === "function") this.softDustTexture.dispose();
  }
}

// Export for browser and node
if (typeof module !== "undefined" && module.exports) {
  module.exports = ParticleSystem;
}
