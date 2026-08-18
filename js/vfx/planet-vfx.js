/**
 * Multiplication Rocket Lab - Procedural Planet & Space Environment VFX (js/vfx/planet-vfx.js)
 * Version 4.2.0 Cinematic VFX & Animation Overhaul
 * 
 * Provides offline procedural multi-layered textures, atmospheric Fresnel halos,
 * realistic gas giant cloud bands, Cassini division rings, and deep space nebulas without external CDN assets.
 */
class PlanetVisualFactory {

  /**
   * Helper to create procedural CanvasTexture offline
   */
  static createProceduralTexture(width, height, drawFn) {
    if (typeof document === "undefined" || !document.createElement) return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx || !ctx.createLinearGradient) return null;

    try {
      drawFn(ctx, width, height);
    } catch (_) {
      return null;
    }

    if (typeof THREE !== "undefined" && THREE.CanvasTexture) {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }
    return null;
  }

  /**
   * 1. Procedural Earth with Continents, Oceans, Clouds, and Atmosphere Rim
   */
  static createEarth(radius = 8.0) {
    const group = (typeof THREE !== "undefined" && THREE.Group) ? new THREE.Group() : { add() {} };
    if (typeof THREE === "undefined") return group;

    // A. Earth Base Surface (Oceans + Continents)
    const earthTex = PlanetVisualFactory.createProceduralTexture(512, 256, (ctx, w, h) => {
      // Ocean Blue Base
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, "#0c4a6e");
      oceanGrad.addColorStop(0.5, "#0284c7");
      oceanGrad.addColorStop(1, "#0c4a6e");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // Continent Landmass Patches
      ctx.fillStyle = "#15803d"; // Forest Green
      // Eurasia & Africa
      ctx.beginPath();
      ctx.ellipse(w * 0.55, h * 0.45, w * 0.22, h * 0.28, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Americas
      ctx.fillStyle = "#166534";
      ctx.beginPath();
      ctx.ellipse(w * 0.22, h * 0.5, w * 0.12, h * 0.35, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Deserts / Savannas
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.ellipse(w * 0.52, h * 0.42, w * 0.08, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Polar Ice Caps
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, w, h * 0.08);
      ctx.fillRect(0, h * 0.92, w, h * 0.08);
    });

    const baseGeo = new THREE.SphereGeometry(radius, 48, 36);
    const baseMat = new THREE.MeshStandardMaterial({
      map: earthTex || null,
      color: earthTex ? 0xffffff : 0x0284c7,
      roughness: 0.6,
      metalness: 0.1
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    group.add(baseMesh);

    // B. Rotating Cloud Sphere
    const cloudTex = PlanetVisualFactory.createProceduralTexture(512, 256, (ctx, w, h) => {
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      for (let i = 0; i < 40; i++) {
        const cx = Math.random() * w;
        const cy = h * 0.15 + Math.random() * (h * 0.7);
        const rw = 20 + Math.random() * 60;
        const rh = 8 + Math.random() * 20;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rw, rh, Math.random() * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const cloudGeo = new THREE.SphereGeometry(radius * 1.018, 40, 30);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex || null,
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.userData = { isCloudLayer: true, rotSpeed: 0.015 };
    group.add(cloudMesh);

    // C. Atmosphere Fresnel Glow Halo
    const glowGeo = new THREE.SphereGeometry(radius * 1.08, 36, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    group.add(glowMesh);

    group.userData = { radius, baseMesh, cloudMesh, glowMesh };
    return group;
  }

  /**
   * 2. Procedural Moon with Mare & Craters
   */
  static createMoon(radius = 7.0) {
    const group = (typeof THREE !== "undefined" && THREE.Group) ? new THREE.Group() : { add() {} };
    if (typeof THREE === "undefined") return group;

    const moonTex = PlanetVisualFactory.createProceduralTexture(512, 256, (ctx, w, h) => {
      // Grey regolith base
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(0, 0, w, h);

      // Dark Lunar Mare Basalt Plains
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.ellipse(w * 0.35, h * 0.45, w * 0.18, h * 0.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.65, h * 0.4, w * 0.12, h * 0.15, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Craters with rim shadows
      for (let i = 0; i < 35; i++) {
        const cx = Math.random() * w;
        const cy = Math.random() * h;
        const cr = 4 + Math.random() * 18;

        // Crater Wall Dark
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();

        // Crater Floor
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.arc(cx + 1, cy + 1, cr * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // Crater Rim Highlight
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, Math.PI * 0.75, Math.PI * 1.75);
        ctx.stroke();
      }
    });

    const geo = new THREE.SphereGeometry(radius, 44, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: moonTex || null,
      color: moonTex ? 0xffffff : 0x94a3b8,
      roughness: 0.9,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    group.userData = { radius, baseMesh: mesh };
    return group;
  }

  /**
   * 3. Procedural Mars with Syrtis Major, Polar Ice, and Haze
   */
  static createMars(radius = 7.5) {
    const group = (typeof THREE !== "undefined" && THREE.Group) ? new THREE.Group() : { add() {} };
    if (typeof THREE === "undefined") return group;

    const marsTex = PlanetVisualFactory.createProceduralTexture(512, 256, (ctx, w, h) => {
      // Rust Red Base
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#991b1b");
      grad.addColorStop(0.5, "#ea580c");
      grad.addColorStop(1, "#991b1b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Dark Basalt Patches (Syrtis Major / Valles Marineris)
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(w * 0.45, h * 0.55, w * 0.2, h * 0.25, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.75, h * 0.45, w * 0.15, h * 0.18, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // North Polar Ice Cap
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.05, w * 0.2, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const geo = new THREE.SphereGeometry(radius, 44, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: marsTex || null,
      color: marsTex ? 0xffffff : 0xef4444,
      roughness: 0.8,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // Orange Atmospheric Haze Halo
    const hazeGeo = new THREE.SphereGeometry(radius * 1.05, 36, 24);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const hazeMesh = new THREE.Mesh(hazeGeo, hazeMat);
    group.add(hazeMesh);

    group.userData = { radius, baseMesh: mesh, glowMesh: hazeMesh };
    return group;
  }

  /**
   * 4. Procedural Jupiter with Banded Clouds & Great Red Spot
   */
  static createJupiter(radius = 11.0) {
    const group = (typeof THREE !== "undefined" && THREE.Group) ? new THREE.Group() : { add() {} };
    if (typeof THREE === "undefined") return group;

    const jupiterTex = PlanetVisualFactory.createProceduralTexture(512, 256, (ctx, w, h) => {
      // Alternating atmospheric cloud bands
      const bands = [
        { y: 0.0, color: "#fed7aa" },
        { y: 0.12, color: "#b45309" },
        { y: 0.25, color: "#fef3c7" },
        { y: 0.38, color: "#92400e" },
        { y: 0.50, color: "#fed7aa" },
        { y: 0.62, color: "#78350f" },
        { y: 0.75, color: "#fef3c7" },
        { y: 0.88, color: "#b45309" },
        { y: 1.0, color: "#fed7aa" }
      ];

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      bands.forEach(b => grad.addColorStop(b.y, b.color));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Cloud Turbulence Ripples
      for (let y = 10; y < h; y += 16) {
        ctx.fillStyle = y % 32 === 0 ? "rgba(255,255,255,0.25)" : "rgba(80,30,10,0.25)";
        ctx.beginPath();
        for (let x = 0; x < w; x += 15) {
          const dy = Math.sin(x * 0.05 + y) * 4;
          ctx.lineTo(x, y + dy);
        }
        ctx.lineTo(w, y + 6);
        ctx.lineTo(0, y + 6);
        ctx.fill();
      }

      // Great Red Spot Oval
      const spotX = w * 0.62;
      const spotY = h * 0.62;
      const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, 35);
      spotGrad.addColorStop(0, "#dc2626");
      spotGrad.addColorStop(0.6, "#b91c1c");
      spotGrad.addColorStop(1, "rgba(180, 83, 9, 0)");
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.ellipse(spotX, spotY, 36, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const geo = new THREE.SphereGeometry(radius, 48, 36);
    const mat = new THREE.MeshStandardMaterial({
      map: jupiterTex || null,
      color: jupiterTex ? 0xffffff : 0xf59e0b,
      roughness: 0.7,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // Orbiting Io Moon
    const moonGeo = new THREE.SphereGeometry(0.6, 16, 12);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 });
    const ioMoon = new THREE.Mesh(moonGeo, moonMat);
    ioMoon.position.set(radius * 1.7, 1.2, radius * 0.8);
    group.add(ioMoon);

    group.userData = { radius, baseMesh: mesh, ioMoon };
    return group;
  }

  /**
   * 5. Procedural Saturn with Multi-Band Rings and Cassini Division
   */
  static createSaturn(radius = 9.5) {
    const group = (typeof THREE !== "undefined" && THREE.Group) ? new THREE.Group() : { add() {} };
    if (typeof THREE === "undefined") return group;

    // Body
    const saturnTex = PlanetVisualFactory.createProceduralTexture(512, 256, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#e2e8f0");
      grad.addColorStop(0.2, "#fde68a");
      grad.addColorStop(0.4, "#d97706");
      grad.addColorStop(0.6, "#fef08a");
      grad.addColorStop(0.8, "#b45309");
      grad.addColorStop(1, "#cbd5e1");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    const bodyGeo = new THREE.SphereGeometry(radius, 44, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: saturnTex || null,
      color: saturnTex ? 0xffffff : 0xeab308,
      roughness: 0.75,
      metalness: 0.05
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(bodyMesh);

    // Multi-Band Rings with Cassini Division
    const ringTex = PlanetVisualFactory.createProceduralTexture(256, 16, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      // Inner C Ring (Faint)
      grad.addColorStop(0.0, "rgba(180, 160, 120, 0.0)");
      grad.addColorStop(0.15, "rgba(210, 190, 150, 0.4)");
      // B Ring (Dense & Bright)
      grad.addColorStop(0.2, "rgba(240, 220, 180, 0.9)");
      grad.addColorStop(0.55, "rgba(220, 200, 160, 0.85)");
      // Cassini Division (Dark Gap)
      grad.addColorStop(0.58, "rgba(0, 0, 0, 0.05)");
      grad.addColorStop(0.64, "rgba(0, 0, 0, 0.05)");
      // A Ring
      grad.addColorStop(0.68, "rgba(230, 210, 170, 0.75)");
      grad.addColorStop(0.92, "rgba(190, 170, 130, 0.5)");
      grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    const innerR = radius * 1.35;
    const outerR = radius * 2.45;
    const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
    ringGeo.rotateX(Math.PI / 2);

    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex || null,
      color: ringTex ? 0xffffff : 0xfde047,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = 0.38; // 22 degree axial tilt
    ringMesh.rotation.z = 0.15;
    group.add(ringMesh);

    group.userData = { radius, baseMesh: bodyMesh, ringMesh };
    return group;
  }

  /**
   * 6. Procedural Deep Space Nebula & Cosmic Cluster (Replaces Wireframes!)
   */
  static createDeepSpace(radius = 10.0) {
    const group = (typeof THREE !== "undefined" && THREE.Group) ? new THREE.Group() : { add() {} };
    if (typeof THREE === "undefined") return group;

    // Glowing Cosmic Core Pulsar
    const coreGeo = new THREE.SphereGeometry(3.5, 32, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Multi-Layered Translucent Nebula Clouds
    const nebulaTex = PlanetVisualFactory.createProceduralTexture(128, 128, (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
      grad.addColorStop(0, "rgba(192, 132, 252, 0.9)");
      grad.addColorStop(0.35, "rgba(147, 51, 234, 0.6)");
      grad.addColorStop(0.7, "rgba(59, 130, 246, 0.25)");
      grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    const cloudColors = [0xa855f7, 0x6366f1, 0x38bdf8, 0xec4899];
    for (let i = 0; i < 8; i++) {
      const spriteMat = new THREE.SpriteMaterial({
        map: nebulaTex || null,
        color: cloudColors[i % cloudColors.length],
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(spriteMat);
      const angle = (i / 8) * Math.PI * 2;
      const dist = 6.0 + Math.random() * 8.0;
      sprite.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 4.0, Math.sin(angle) * dist);
      const s = 14 + Math.random() * 12;
      sprite.scale.set(s, s, 1);
      group.add(sprite);
    }

    group.userData = { radius, baseMesh: coreMesh };
    return group;
  }
}

// Export for browser and node
if (typeof module !== "undefined" && module.exports) {
  module.exports = PlanetVisualFactory;
}
