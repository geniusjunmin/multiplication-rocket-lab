/**
 * Multiplication Rocket Lab - Missions, Destinations & 3D Celestial Engine (js/missions.js)
 * Version 4.0.0 Space Adventure Progression Architecture
 * Supports 18+ Data-Driven Missions, 6 Celestial Destinations, 3D Interactive Planet Previews,
 * Side-Destinations & Dynamic Mission Generator.
 */
class DestinationManager {
  constructor() {
    this.destinations = CONFIG.DESTINATIONS;
    this.currentDestinationId = "moon";
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewPlanetMesh = null;
    this.animationId = null;
  }

  getDestination(destId) {
    return this.destinations[destId] || this.destinations.moon;
  }

  setDestination(destId) {
    if (this.destinations[destId]) {
      this.currentDestinationId = destId;
      if (window.storageManager) window.storageManager.set("selectedDestination", destId);
    }
  }

  /**
   * 3D Interactive Planet Preview Mesh Generator
   */
  initPlanetPreview(containerId, destId) {
    this.destroyPreview();

    if (typeof document === "undefined") return;
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    if (!window.WebGLRenderingContext) return;

    try {
      this.previewScene = new THREE.Scene();
      this.previewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.previewCamera.position.set(0, 0, 5);

      this.previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.previewRenderer.setSize(width, height);
      this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(this.previewRenderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      this.previewScene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
      dirLight.position.set(5, 5, 5);
      this.previewScene.add(dirLight);

      this.createPlanetMesh(destId);
      this.animatePreview();
    } catch (e) {
      console.warn("DestinationManager: Planet preview WebGL init error:", e);
    }
  }

  createPlanetMesh(destId) {
    if (this.previewPlanetMesh && this.previewScene) {
      this.previewScene.remove(this.previewPlanetMesh);
    }

    const planetGroup = new THREE.Group();

    switch (destId) {
      case "earthOrbit": {
        const geo = new THREE.SphereGeometry(1.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.1 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);

        // Atmosphere halo ring
        if (THREE.RingGeometry) {
          const haloGeo = new THREE.RingGeometry(1.55, 1.8, 32);
          const haloMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          planetGroup.add(halo);
        }
        break;
      }
      case "moon": {
        const geo = new THREE.SphereGeometry(1.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      case "mars": {
        const geo = new THREE.SphereGeometry(1.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.65 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      case "jupiter": {
        const geo = new THREE.SphereGeometry(1.6, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      case "saturn": {
        const planetGeo = new THREE.SphereGeometry(1.3, 32, 32);
        const planetMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetGroup.add(planetMesh);

        // 3D RingGeometry for Saturn Rings
        if (THREE.RingGeometry) {
          const ringGeo = new THREE.RingGeometry(1.6, 2.5, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2.5;
          planetGroup.add(ringMesh);
        }
        break;
      }
      case "deepSpace": {
        if (THREE.OctahedronGeometry) {
          const geo = new THREE.OctahedronGeometry(1.4, 3);
          const mat = new THREE.MeshStandardMaterial({ color: 0x818cf8, wireframe: true });
          const mesh = new THREE.Mesh(geo, mat);
          planetGroup.add(mesh);
        }
        break;
      }
    }

    this.previewPlanetMesh = planetGroup;
    if (this.previewScene) this.previewScene.add(this.previewPlanetMesh);
  }

  animatePreview() {
    this.animationId = requestAnimationFrame(() => this.animatePreview());
    if (this.previewPlanetMesh) {
      this.previewPlanetMesh.rotation.y += 0.01;
    }
    if (this.previewRenderer && this.previewScene && this.previewCamera) {
      this.previewRenderer.render(this.previewScene, this.previewCamera);
    }
  }

  destroyPreview() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.previewRenderer) {
      if (this.previewRenderer.domElement && this.previewRenderer.domElement.remove) {
        this.previewRenderer.domElement.remove();
      }
      if (this.previewRenderer.dispose) this.previewRenderer.dispose();
      this.previewRenderer = null;
    }
    this.previewScene = null;
    this.previewCamera = null;
    this.previewPlanetMesh = null;
  }
}

/**
 * High-Level Mission Management & Board
 */
class MissionManager {
  constructor() {
    this.missions = CONFIG.MISSION_DEFINITIONS;
    this.activeMissionId = "moon_crater_survey";
  }

  getAllMissions() {
    return Object.values(this.missions);
  }

  getMission(id) {
    return this.missions[id] || this.missions.moon_crater_survey;
  }

  getMissionsForDestination(destId) {
    return Object.values(this.missions).filter(m => m.destination === destId);
  }

  selectMission(missionId) {
    if (this.missions[missionId]) {
      this.activeMissionId = missionId;
      const m = this.missions[missionId];
      if (window.destinationManager) {
        window.destinationManager.setDestination(m.destination);
      }
      if (window.storageManager) {
        window.storageManager.set("selectedMissionId", missionId);
        window.storageManager.set("selectedDestination", m.destination);
      }
    }
  }

  getActiveMission() {
    const storedId = window.storageManager ? window.storageManager.get("selectedMissionId") : null;
    return this.getMission(storedId || this.activeMissionId);
  }
}

/**
 * Adaptive Mission Generator
 */
class MissionGenerator {
  generateCustomMission(destId, mathFocusTables = [7, 8], lengthType = "standard") {
    const dest = CONFIG.DESTINATIONS[destId] || CONFIG.DESTINATIONS.moon;
    const qCount = lengthType === "quick" ? 10 : (lengthType === "epic" ? 20 : 15);

    return {
      id: `custom_${destId}_${Date.now()}`,
      destination: destId,
      subDestination: dest.subDestinations ? dest.subDestinations[0].id : "orbit",
      titleEn: `${dest.nameEn} Special Patrol`,
      titleZh: `${dest.nameZh} 特别巡航任务`,
      storyEn: `Execute a specialized reconnaissance flight to ${dest.nameEn}.`,
      storyZh: `执行前往 ${dest.nameZh} 的专项侦察任务，检验高阶乘除法运算精准度。`,
      completionEn: `Patrol complete! All telemetry received successfully.`,
      completionZh: `巡航任务圆满完成！全部空间数据已稳定入库！`,
      lengthType,
      questionTarget: qCount,
      fuelModifier: 1.0,
      mathFocus: mathFocusTables,
      modifier: "accuracy",
      recommendedPayload: "probe",
      objectives: [
        { id: "primary", type: "complete", descEn: `Complete ${dest.nameEn} Mission`, descZh: `完成 ${dest.nameZh} 任务`, stars: 1 },
        { id: "first_try", type: "accuracy", target: 80, descEn: "First-try accuracy ≥ 80%", descZh: "首答正确率 ≥ 80%", stars: 1 },
        { id: "streak", type: "streak", target: 5, descEn: "Reach 5-answer streak", descZh: "达成 5 连胜答对", stars: 1 }
      ],
      eventPool: ["asteroid_alert", "engine_overheat"],
      reward: {
        xp: 120,
        stars: 3,
        researchPoints: 20
      }
    };
  }
}

window.destinationManager = new DestinationManager();
window.missionManager = new MissionManager();
window.missionGenerator = new MissionGenerator();

if (typeof module !== "undefined") {
  module.exports = { DestinationManager, MissionManager, MissionGenerator };
}
