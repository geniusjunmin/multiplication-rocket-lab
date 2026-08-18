/**
 * Multiplication Rocket Lab - Cinematic Camera Director (js/vfx/camera-director.js)
 * Version 4.2.1 Cinematic Integration & Spectacle Pass
 * 
 * Provides smooth, mathematically eased multi-shot camera choreography,
 * seamless shot continuation without teleport cuts, dynamic FOV transitions,
 * Quaternion/Roll banking, and dramatic orbital/landing cinematography.
 */
class CinematicCameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.currentShot = null;
    this.shotElapsed = 0;
    this.shotDuration = 0;
    this.activeShakeIntensity = 0;
    this.targetLookAt = (typeof THREE !== "undefined" && THREE.Vector3) ? new THREE.Vector3(0, 0, 0) : { x: 0, y: 0, z: 0 };
    this.currentLookAt = (typeof THREE !== "undefined" && THREE.Vector3) ? new THREE.Vector3(0, 0, 0) : { x: 0, y: 0, z: 0 };
    this.isReducedMotion = false;
    this.isTransitioning = false;
    this.currentRoll = 0;
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setReducedMotion(isReduced) {
    this.isReducedMotion = !!isReduced;
  }

  /**
   * Mathematical Easing Functions
   */
  static easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  static easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  static smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  /**
   * Play a directed cinematic shot
   * If cut is false and fromPosition is not specified, seamlessly starts from current camera pose.
   * @param {Object} shotConfig
   */
  playShot(shotConfig) {
    if (!this.camera) return;

    // Seamless Continuation: Default to current camera position & lookAt if not hard cutting
    const isHardCut = !!shotConfig.cut;
    const currentCamPos = this.camera.position ? { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z } : { x: 0, y: 1.5, z: 9 };
    const currentTarget = this.currentLookAt ? { x: this.currentLookAt.x, y: this.currentLookAt.y, z: this.currentLookAt.z } : { x: 0, y: 0, z: 0 };

    const fromPos = (isHardCut && shotConfig.fromPosition) ? { ...shotConfig.fromPosition } : (shotConfig.fromPosition || currentCamPos);
    const toPos = shotConfig.toPosition ? { ...shotConfig.toPosition } : { ...fromPos };

    const fromTarget = (isHardCut && shotConfig.fromTarget) ? { ...shotConfig.fromTarget } : (shotConfig.fromTarget || currentTarget);
    const toTarget = shotConfig.toTarget ? { ...shotConfig.toTarget } : (shotConfig.fromTarget || fromTarget);

    const fovFrom = shotConfig.fovFrom || this.camera.fov || 50;
    const fovTo = shotConfig.fovTo || fovFrom;

    const rollFrom = (isHardCut && shotConfig.rollFrom !== undefined) ? shotConfig.rollFrom : (shotConfig.rollFrom !== undefined ? shotConfig.rollFrom : this.currentRoll);
    const rollTo = shotConfig.rollTo !== undefined ? shotConfig.rollTo : (shotConfig.roll || 0);

    this.currentShot = {
      id: shotConfig.id || "shot",
      fromPos,
      toPos,
      fromTarget,
      toTarget,
      duration: Math.max(0.1, shotConfig.duration || 2.0),
      easing: shotConfig.easing || "easeInOutCubic",
      fovFrom,
      fovTo,
      rollFrom: this.isReducedMotion ? 0 : rollFrom,
      rollTo: this.isReducedMotion ? 0 : rollTo,
      shake: this.isReducedMotion ? 0 : (shotConfig.shake || 0),
      onComplete: shotConfig.onComplete || null
    };

    this.shotElapsed = 0;
    this.shotDuration = this.currentShot.duration;
    this.activeShakeIntensity = this.currentShot.shake;
    this.isTransitioning = true;

    // Set initial position if hard cut or first shot
    if (isHardCut) {
      this.camera.position.set(fromPos.x, fromPos.y, fromPos.z);
      this.currentLookAt = { ...fromTarget };
      this.targetLookAt = { ...toTarget };
      if (this.camera.lookAt) {
        this.camera.lookAt(fromTarget.x, fromTarget.y, fromTarget.z);
      }
    }
  }

  /**
   * Update camera position, rotation, FOV, roll and shake on every frame
   * @param {number} dt Delta time in seconds
   */
  update(dt) {
    if (!this.camera || !this.currentShot) return;

    this.shotElapsed += dt;
    const rawProgress = Math.min(1.0, this.shotElapsed / this.shotDuration);
    if (rawProgress >= 1.0) {
      this.isTransitioning = false;
    }

    let easeProgress = rawProgress;
    if (this.currentShot.easing === "easeInOutCubic") {
      easeProgress = CinematicCameraDirector.easeInOutCubic(rawProgress);
    } else if (this.currentShot.easing === "easeOutQuart") {
      easeProgress = CinematicCameraDirector.easeOutQuart(rawProgress);
    } else if (this.currentShot.easing === "easeInOutQuad") {
      easeProgress = CinematicCameraDirector.easeInOutQuad(rawProgress);
    }

    const s = this.currentShot;
    // 1. Interpolate Position
    this.camera.position.x = s.fromPos.x + (s.toPos.x - s.fromPos.x) * easeProgress;
    this.camera.position.y = s.fromPos.y + (s.toPos.y - s.fromPos.y) * easeProgress;
    this.camera.position.z = s.fromPos.z + (s.toPos.z - s.fromPos.z) * easeProgress;

    // 2. Interpolate Target LookAt
    const targetX = s.fromTarget.x + (s.toTarget.x - s.fromTarget.x) * easeProgress;
    const targetY = s.fromTarget.y + (s.toTarget.y - s.fromTarget.y) * easeProgress;
    const targetZ = s.fromTarget.z + (s.toTarget.z - s.fromTarget.z) * easeProgress;
    this.currentLookAt = { x: targetX, y: targetY, z: targetZ };

    // 3. Interpolate FOV
    if (s.fovFrom !== s.fovTo && this.camera.fov !== undefined) {
      this.camera.fov = s.fovFrom + (s.fovTo - s.fovFrom) * easeProgress;
      if (this.camera.updateProjectionMatrix) {
        this.camera.updateProjectionMatrix();
      }
    }

    // 4. Look at target point
    if (this.camera.lookAt) {
      this.camera.lookAt(targetX, targetY, targetZ);
    }

    // 5. Interpolate & Apply Camera Roll
    this.currentRoll = s.rollFrom + (s.rollTo - s.rollFrom) * easeProgress;
    if (this.currentRoll !== 0 && !this.isReducedMotion && this.camera.rotation) {
      this.camera.rotation.z += this.currentRoll;
    }

    // 6. Apply Camera Shake if active
    if (this.activeShakeIntensity > 0 && !this.isReducedMotion) {
      const shakeDecay = 1.0 - easeProgress * 0.5;
      const curShake = this.activeShakeIntensity * shakeDecay;
      this.camera.position.x += (Math.random() - 0.5) * curShake;
      this.camera.position.y += (Math.random() - 0.5) * curShake;
      this.camera.position.z += (Math.random() - 0.5) * (curShake * 0.5);
    }

    // 7. Shot completion callback
    if (rawProgress >= 1.0) {
      const cb = s.onComplete;
      this.currentShot = null;
      if (cb) cb();
    }
  }

  /**
   * Stop current shot immediately and hold camera position
   */
  stopShot() {
    this.currentShot = null;
    this.activeShakeIntensity = 0;
    this.isTransitioning = false;
  }
}

// Export for browser and node
if (typeof module !== "undefined" && module.exports) {
  module.exports = CinematicCameraDirector;
}
