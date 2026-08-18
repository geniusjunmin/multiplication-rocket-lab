/**
 * Multiplication Rocket Lab - Cinematic Camera Director (js/vfx/camera-director.js)
 * Version 4.2.0 Cinematic VFX & Animation Overhaul
 * 
 * Provides smooth, mathematically eased multi-shot camera choreography,
 * continuous flight rig tracking, and dramatic orbital/landing cinematography.
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
  }

  setCamera(camera) {
    this.camera = camera;
  }

  setReducedMotion(isReduced) {
    this.isReducedMotion = !!isReduced;
  }

  /**
   * Easing Functions
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
   * @param {Object} shotConfig
   * {
   *   id: string,
   *   fromPosition: THREE.Vector3 | {x,y,z},
   *   toPosition: THREE.Vector3 | {x,y,z},
   *   fromTarget: THREE.Vector3 | {x,y,z},
   *   toTarget: THREE.Vector3 | {x,y,z},
   *   duration: number,
   *   easing: 'easeInOutCubic' | 'easeOutQuart' | 'linear' | 'easeInOutQuad',
   *   fovFrom: number,
   *   fovTo: number,
   *   shake: number,
   *   roll: number,
   *   onComplete: Function
   * }
   */
  playShot(shotConfig) {
    if (!this.camera) return;
    this.currentShot = {
      id: shotConfig.id || "shot",
      fromPos: { ...shotConfig.fromPosition },
      toPos: { ...shotConfig.toPosition },
      fromTarget: { ...(shotConfig.fromTarget || { x: 0, y: 0, z: 0 }) },
      toTarget: { ...(shotConfig.toTarget || shotConfig.fromTarget || { x: 0, y: 0, z: 0 }) },
      duration: Math.max(0.1, shotConfig.duration || 2.0),
      easing: shotConfig.easing || "easeInOutCubic",
      fovFrom: shotConfig.fovFrom || this.camera.fov || 50,
      fovTo: shotConfig.fovTo || shotConfig.fovFrom || this.camera.fov || 50,
      shake: this.isReducedMotion ? 0 : (shotConfig.shake || 0),
      roll: this.isReducedMotion ? 0 : (shotConfig.roll || 0),
      onComplete: shotConfig.onComplete || null
    };

    this.shotElapsed = 0;
    this.shotDuration = this.currentShot.duration;
    this.activeShakeIntensity = this.currentShot.shake;
    this.isTransitioning = true;

    // Set initial position
    this.camera.position.set(this.currentShot.fromPos.x, this.currentShot.fromPos.y, this.currentShot.fromPos.z);
    this.currentLookAt = { ...this.currentShot.fromTarget };
    this.targetLookAt = { ...this.currentShot.toTarget };
    if (this.camera.lookAt) {
      this.camera.lookAt(this.currentLookAt.x, this.currentLookAt.y, this.currentLookAt.z);
    }
  }

  /**
   * Update camera position, rotation, FOV, and shake on every frame
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
    // Interpolate position
    this.camera.position.x = s.fromPos.x + (s.toPos.x - s.fromPos.x) * easeProgress;
    this.camera.position.y = s.fromPos.y + (s.toPos.y - s.fromPos.y) * easeProgress;
    this.camera.position.z = s.fromPos.z + (s.toPos.z - s.fromPos.z) * easeProgress;

    // Interpolate target lookAt
    const targetX = s.fromTarget.x + (s.toTarget.x - s.fromTarget.x) * easeProgress;
    const targetY = s.fromTarget.y + (s.toTarget.y - s.fromTarget.y) * easeProgress;
    const targetZ = s.fromTarget.z + (s.toTarget.z - s.fromTarget.z) * easeProgress;
    this.currentLookAt = { x: targetX, y: targetY, z: targetZ };

    // Interpolate FOV
    if (s.fovFrom !== s.fovTo && this.camera.fov !== undefined) {
      this.camera.fov = s.fovFrom + (s.fovTo - s.fovFrom) * easeProgress;
      if (this.camera.updateProjectionMatrix) {
        this.camera.updateProjectionMatrix();
      }
    }

    // Apply Camera Shake if active
    if (this.activeShakeIntensity > 0 && !this.isReducedMotion) {
      const shakeDecay = 1.0 - easeProgress * 0.5;
      const curShake = this.activeShakeIntensity * shakeDecay;
      this.camera.position.x += (Math.random() - 0.5) * curShake;
      this.camera.position.y += (Math.random() - 0.5) * curShake;
      this.camera.position.z += (Math.random() - 0.5) * (curShake * 0.5);
    }

    // Look at target point
    if (this.camera.lookAt) {
      this.camera.lookAt(targetX, targetY, targetZ);
    }

    // Shot completion callback
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
  }
}

// Export for browser and node
if (typeof module !== "undefined" && module.exports) {
  module.exports = CinematicCameraDirector;
}
