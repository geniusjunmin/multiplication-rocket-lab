/**
 * Multiplication Rocket Lab - Interplanetary Mission & Destination Manager (js/missions.js)
 * Supports 6 Planets/Destinations, 3D Planet Previews, Space Passport Stamps & Mission History
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
      this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(this.previewRenderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      this.previewScene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
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

    const dest = this.getDestination(destId);
    const planetGroup = new THREE.Group();

    switch (destId) {
      case "earthOrbit": {
        const geo = new THREE.SphereGeometry(1.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      case "moon": {
        const geo = new THREE.SphereGeometry(1.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
      case "mars": {
        const geo = new THREE.SphereGeometry(1.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
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
        const ringGeo = new THREE.RingGeometry(1.6, 2.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.5;
        planetGroup.add(ringMesh);
        break;
      }
      case "deepSpace": {
        const geo = new THREE.OctahedronGeometry(1.4, 3);
        const mat = new THREE.MeshStandardMaterial({ color: 0x818cf8, wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        planetGroup.add(mesh);
        break;
      }
    }

    this.previewPlanetMesh = planetGroup;
    this.previewScene.add(this.previewPlanetMesh);
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
      if (this.previewRenderer.domElement) this.previewRenderer.domElement.remove();
      this.previewRenderer.dispose();
      this.previewRenderer = null;
    }
    this.previewScene = null;
    this.previewCamera = null;
    this.previewPlanetMesh = null;
  }
}

window.destinationManager = new DestinationManager();
