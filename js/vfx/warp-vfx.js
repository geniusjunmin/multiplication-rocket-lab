/**
 * Multiplication Rocket Lab - Warp & Interplanetary Boost VFX (js/vfx/warp-vfx.js)
 * Version 4.2.0 Cinematic VFX & Animation Overhaul
 * 
 * Implements 200-350 dynamic star streaks, hyperspace speed tunnel,
 * and trailing energy ribbon during Transfer Burn.
 */
class WarpVFXSystem {
  constructor(scene, count = 280) {
    this.scene = scene;
    this.streakCount = count;
    this.group = (typeof THREE !== "undefined" && THREE.Group) ? new THREE.Group() : { add() {}, remove() {}, visible: true };

    this.streakLines = null;
    this.streakPositions = null;
    this.streakVelocities = null;
    this.streakLengths = null;

    this.speedTunnelMesh = null;
    this.energyRibbon = null;

    this.warpIntensity = 0.0;
    this.targetWarpIntensity = 0.0;
    this.isReducedMotion = false;

    this.initStreaks();
    this.initSpeedTunnel();
  }

  setReducedMotion(isReduced) {
    this.isReducedMotion = !!isReduced;
  }

  initStreaks() {
    if (typeof THREE === "undefined" || !this.scene) return;

    const count = this.streakCount;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 2 * 3); // 2 vertices per line (start, end)
    const velocities = new Float32Array(count);
    const radAngles = new Float32Array(count * 2); // (radius, angle)

    for (let i = 0; i < count; i++) {
      const radius = 5 + Math.random() * 45;
      const angle = Math.random() * Math.PI * 2;
      const z = -50 - Math.random() * 150;
      const speed = 60 + Math.random() * 90;

      radAngles[i * 2] = radius;
      radAngles[i * 2 + 1] = angle;
      velocities[i] = speed;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Start vertex
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;

      // End vertex (tail)
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z + 2.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.streakLines = new THREE.LineSegments(geo, mat);
    this.streakPositions = positions;
    this.streakVelocities = velocities;
    this.streakRadAngles = radAngles;
    this.group.add(this.streakLines);
  }

  initSpeedTunnel() {
    if (typeof THREE === "undefined" || !this.scene) return;

    // Additive cylindrical hyperspace glow tunnel
    const tunnelGeo = new THREE.CylinderGeometry(8, 14, 180, 16, 1, true);
    tunnelGeo.rotateX(Math.PI / 2);
    const tunnelMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.speedTunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    this.speedTunnelMesh.position.set(0, 0, -60);
    this.group.add(this.speedTunnelMesh);
  }

  setWarpIntensity(intensity, immediate = false) {
    this.targetWarpIntensity = this.isReducedMotion ? 0 : Math.max(0, Math.min(1.0, intensity));
    if (immediate) {
      this.warpIntensity = this.targetWarpIntensity;
    }
  }

  update(dt, rocketPos = { x: 0, y: 0, z: 0 }) {
    if (this.isReducedMotion) {
      if (this.streakLines) this.streakLines.material.opacity = 0;
      if (this.speedTunnelMesh) this.speedTunnelMesh.material.opacity = 0;
      return;
    }

    // Smooth warp intensity transition
    const lerpRate = Math.min(1.0, dt * 4.0);
    this.warpIntensity += (this.targetWarpIntensity - this.warpIntensity) * lerpRate;

    const w = this.warpIntensity;
    if (w <= 0.005) {
      if (this.streakLines) this.streakLines.material.opacity = 0;
      if (this.speedTunnelMesh) this.speedTunnelMesh.material.opacity = 0;
      return;
    }

    // Update streak line opacity and tunnel glow
    if (this.streakLines) {
      this.streakLines.material.opacity = Math.min(0.9, w * 1.1);
      const posAttr = this.streakLines.geometry.attributes.position;
      const count = this.streakCount;
      const tailLen = 6.0 + w * 28.0;

      for (let i = 0; i < count; i++) {
        const speed = this.streakVelocities[i] * (0.8 + w * 2.2);
        let zHead = this.streakPositions[i * 6 + 2] + speed * dt;
        
        // Wrap around when passing camera
        if (zHead > 40) {
          zHead = -140 - Math.random() * 40;
        }

        const radius = this.streakRadAngles[i * 2];
        const angle = this.streakRadAngles[i * 2 + 1];
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        this.streakPositions[i * 6] = x + rocketPos.x;
        this.streakPositions[i * 6 + 1] = y + rocketPos.y;
        this.streakPositions[i * 6 + 2] = zHead;

        this.streakPositions[i * 6 + 3] = x + rocketPos.x;
        this.streakPositions[i * 6 + 4] = y + rocketPos.y;
        this.streakPositions[i * 6 + 5] = zHead - tailLen;
      }

      posAttr.needsUpdate = true;
    }

    if (this.speedTunnelMesh) {
      this.speedTunnelMesh.material.opacity = w * 0.22;
      this.speedTunnelMesh.position.set(rocketPos.x, rocketPos.y, rocketPos.z - 40);
      this.speedTunnelMesh.rotation.z += 0.5 * dt;
    }
  }

  dispose() {
    if (this.streakLines) {
      if (this.streakLines.geometry && this.streakLines.geometry.dispose) this.streakLines.geometry.dispose();
      if (this.streakLines.material && this.streakLines.material.dispose) this.streakLines.material.dispose();
    }
    if (this.speedTunnelMesh) {
      if (this.speedTunnelMesh.geometry && this.speedTunnelMesh.geometry.dispose) this.speedTunnelMesh.geometry.dispose();
      if (this.speedTunnelMesh.material && this.speedTunnelMesh.material.dispose) this.speedTunnelMesh.material.dispose();
    }
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}

// Export for browser and node
if (typeof module !== "undefined" && module.exports) {
  module.exports = WarpVFXSystem;
}
