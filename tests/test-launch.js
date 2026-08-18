/**
 * Interplanetary Destination & Launch Sequence Unit Tests (tests/test-launch.js) - Version 3.1.0
 */
describe("4. Interplanetary Launch Engine & Planet Arrival Scenes (LaunchSequence)", () => {

  it("4.1 Should initialize 3D launch environment for all 6 Interplanetary Destinations", () => {
    const launch = new LaunchSequence();
    const destinations = ["earthOrbit", "moon", "mars", "jupiter", "saturn", "deepSpace"];

    destinations.forEach(destId => {
      launch.initScene("canvas-container-launch", destId);
      Assert.equal(launch.destinationId, destId, `Destination must set to ${destId}`);
      Assert.isTrue(launch.destinationMesh !== null, "Destination planet mesh must be created");
      launch.destroy();
    });
  });

  it("4.2 Should create 3D Saturn RingGeometry for Saturn destination", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "saturn");

    Assert.isTrue(launch.saturnRingMesh !== null, "Saturn ring mesh must be instantiated for Saturn destination");
    launch.destroy();
  });

  it("4.3 Should create surface landing environment situated at GROUND_Y = 0, z = 0", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "moon");
    launch.createLandingSurface("moon");

    Assert.isTrue(launch.surfaceGroup !== null, "Moon surface terrain group must be created");
    Assert.equal(launch.surfaceGroup.position.x, 0, "Surface X must be 0");
    Assert.equal(launch.surfaceGroup.position.y, 0, "Surface Y must be 0");
    Assert.equal(launch.surfaceGroup.position.z, 0, "Surface Z must be 0 in local landing frame");
    Assert.isTrue(launch.contactShadow !== null, "Contact shadow mesh must be created");
    launch.destroy();
  });

  it("4.4 Should execute multi-stage countdown, ignition and liftoff", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "mars");
    
    launch.triggerIgnition();
    Assert.equal(launch.currentStage, "ignition", "Stage should transition to ignition");
    launch.liftoff();
    Assert.equal(launch.currentStage, "liftoff", "Stage should transition to liftoff");
    launch.destroy();
  });

  it("4.5 Should safely dispose 3D scene objects and GPU memory on destroy()", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "moon");
    launch.destroy();

    Assert.equal(launch.scene, null, "Scene must be null after destroy()");
    Assert.equal(launch.renderer, null, "Renderer must be null after destroy()");
  });

  it("4.6 Should calculate touchdown Y across all 5 rocket models accurately at GROUND_Y = 0", () => {
    const launch = new LaunchSequence();
    const models = ["classic", "starship", "falconHeavy", "longMarch", "cyber"];

    models.forEach(model => {
      storageManager.set("currentRocketModel", model);
      launch.initScene("canvas-container-launch", "moon");
      launch.calculateRocketDimensions();

      const physicalLowestY = launch.touchdownRocketY + launch.rocketLocalMinY;
      Assert.isTrue(Math.abs(physicalLowestY - launch.GROUND_Y) <= 0.08, `Model ${model} lowest point (${physicalLowestY}) must contact ground Y (${launch.GROUND_Y}) within tolerance`);
      launch.destroy();
    });
  });

  it("4.7 Should execute 4-phase landing timeline and cut off engine flame upon touchdown", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "moon");
    launch.createLandingSurface("moon");
    launch.surfaceGroup.visible = true;

    launch.currentStage = "destinationAction";
    launch.landingPhase = "finalDescent";
    launch.landingPhaseElapsed = 1.6; // triggers touchdown
    launch.updateLandingSystem(0.1);

    Assert.equal(launch.landingPhase, "touchdownHold", "Landing phase should transition to touchdownHold");
    Assert.equal(launch.rocket.position.y, launch.touchdownRocketY, "Rocket Y must be set to calculated touchdown height");
    Assert.equal(launch.flameMesh.visible, false, "Flame must be turned OFF at touchdown");
    Assert.equal(launch.engineLight.intensity, 0, "Engine light must be cut off at touchdown");

    // Hold for 3.8s to trigger settlement & mission complete
    launch.landingPhaseElapsed = 3.8;
    launch.updateLandingSystem(0.1);

    Assert.equal(launch.hasRecordedVisit, true, "Visit should be recorded only after touchdown hold settles");
    Assert.equal(launch.currentStage, "missionComplete", "Stage should be missionComplete");
    launch.destroy();
  });

  it("4.8 Should emit radial dust particles only within proximity to ground (<8m)", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "mars");
    
    // High altitude (> 8m) -> no dust emitted
    launch.emitRadialDust(15.0);
    const activeHigh = launch.dustPool.filter(p => p.life > 0);
    Assert.equal(activeHigh.length, 0, "No dust should emit at altitude > 8m");

    // Low altitude (1.5m) -> radial dust emitted
    launch.emitRadialDust(1.5);
    const activeLow = launch.dustPool.filter(p => p.life > 0);
    Assert.isTrue(activeLow.length > 0, "Dust particles should emit when approaching ground (<2m)");
    launch.destroy();
  });

  it("4.9 Should support landing replay without state corruption", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "moon");
    launch.createLandingSurface("moon");
    launch.surfaceGroup.visible = true;

    launch.replayLanding();
    Assert.equal(launch.rocket.position.y, 32, "Replay should reset rocket to descent altitude 32m");
    Assert.equal(launch.landingPhase, "highDescent", "Replay should re-enter Phase A highDescent");
    Assert.equal(launch.flameMesh.visible, true, "Flame should re-ignite for landing replay");
    launch.destroy();
  });

  it("4.10 Should specify increasing fuel requirements and flight profile durations for further destinations", () => {
    Assert.equal(CONFIG.DESTINATIONS.earthOrbit.fuelRequired, 50, "Earth Orbit requires 50 fuel");
    Assert.equal(CONFIG.DESTINATIONS.moon.fuelRequired, 70, "Moon requires 70 fuel");
    Assert.equal(CONFIG.DESTINATIONS.mars.fuelRequired, 100, "Mars requires 100 fuel");
    Assert.equal(CONFIG.DESTINATIONS.jupiter.fuelRequired, 120, "Jupiter requires 120 fuel");
    Assert.equal(CONFIG.DESTINATIONS.saturn.fuelRequired, 140, "Saturn requires 140 fuel");
    Assert.equal(CONFIG.DESTINATIONS.deepSpace.fuelRequired, 160, "Deep Space requires 160 fuel");

    const eoTime = CONFIG.DESTINATIONS.earthOrbit.cinematic.transferSeconds;
    const saturnTime = CONFIG.DESTINATIONS.saturn.cinematic.transferSeconds;
    const deepSpaceTime = CONFIG.DESTINATIONS.deepSpace.cinematic.transferSeconds;

    Assert.isTrue(saturnTime > eoTime, "Saturn flight duration must exceed Earth Orbit");
    Assert.isTrue(deepSpaceTime >= saturnTime, "Deep space duration must equal or exceed Saturn");
  });

  it("4.11 Should support AnimationLab and jumpToStage for instant animation testing", () => {
    const launch = new LaunchSequence();
    launch.speedMultiplier = 2.0;
    Assert.equal(launch.speedMultiplier, 2.0, "Speed multiplier should be set");

    const testStages = ["liftoff", "atmospheric", "earthOrbit", "transfer", "destinationApproach", "destinationAction", "missionComplete"];
    testStages.forEach(st => {
      launch.jumpToStage(st, "mars", "canvas-container-launch");
      Assert.isTrue(launch.currentStage !== "idle", `Stage ${st} should be active`);
    });
    launch.destroy();

    const animLab = new AnimationLab();
    Assert.equal(animLab.currentDest, "earthOrbit", "Default destination should be earthOrbit");
    animLab.setSpeed(4.0);
    Assert.equal(animLab.speedMultiplier, 4.0, "Animation lab speed should be 4x");
  });

  it("4.12 CinematicCameraDirector should execute storyboard shots with smooth interpolation", () => {
    const cam = new THREE.PerspectiveCamera(50, 1.0, 0.1, 1000);
    const director = new CinematicCameraDirector(cam);

    director.playShot({
      id: "shot1_pad_hero",
      fromPosition: { x: 4.5, y: 0.5, z: 7.5 },
      toPosition: { x: 3.5, y: 0.2, z: 6.0 },
      fromTarget: { x: 0, y: 1.0, z: 0 },
      toTarget: { x: 0, y: 1.8, z: 0 },
      duration: 3.0,
      easing: "easeInOutCubic"
    });

    Assert.equal(director.currentShot.id, "shot1_pad_hero", "Active shot must be shot1_pad_hero");
    Assert.equal(director.isTransitioning, true, "Camera transition should be active");

    // Advance 1.5s (50% progress)
    director.update(1.5);
    Assert.equal(director.shotElapsed, 1.5, "Shot elapsed should be 1.5s");
    Assert.isTrue(cam.position.x < 4.5 && cam.position.x > 3.5, "Camera X position should interpolate between start and end");

    // Advance to end
    director.update(2.0);
    Assert.equal(director.isTransitioning, false, "Camera transition should complete after duration");
  });

  it("4.13 EngineVFXSystem should manage single-source-of-truth throttle, vacuum mode, and shock diamonds", () => {
    const scene = new THREE.Scene();
    const engine = new EngineVFXSystem(scene, { plumeLength: 3.0, plumeWidth: 0.8 });

    engine.setVisible(true);
    Assert.equal(engine.group.visible, true, "Engine group must be visible");

    engine.setThrottle(0.85);
    Assert.equal(engine.engineVfxState.throttle, 0.85, "Engine VFX state throttle must update");

    engine.setVacuumExpansion(1.0);
    Assert.equal(engine.engineVfxState.vacuumExpansion, 1.0, "Vacuum expansion state must update");

    engine.update(0.016, 1.0);
    Assert.isTrue(engine.shockDiamonds.length === 4, "Shock diamonds array must contain 4 supersonic disks");
    engine.dispose();
  });

  it("4.14 ParticleSystem should update smoke and radial dust using deltaTime", () => {
    const scene = new THREE.Scene();
    const ps = new ParticleSystem(scene, "high");

    // Horizontal launch trench smoke blast
    ps.emitLaunchTrenchSmoke({ x: 0, y: 0, z: 0 }, 12);
    const activeSmoke = ps.smokePool.filter(p => p.active);
    Assert.isTrue(activeSmoke.length >= 10, "Launch pad smoke trench blast must activate smoke particles");

    // DeltaTime physics update
    const initialLife = activeSmoke[0].life;
    ps.update(0.1);
    Assert.isTrue(activeSmoke[0].life < initialLife, "Particle life must decrease by deltaTime");

    ps.dispose();
  });

  it("4.15 WarpVFXSystem should render 280 speed streak lines and handle intensity modulation", () => {
    const scene = new THREE.Scene();
    const warp = new WarpVFXSystem(scene, 280);

    Assert.equal(warp.streakCount, 280, "Streak count must be 280");
    warp.setWarpIntensity(0.95);
    Assert.equal(warp.targetWarpIntensity, 0.95, "Target warp intensity must be 0.95");

    warp.update(0.05, { x: 0, y: 0, z: 0 });
    Assert.isTrue(warp.warpIntensity > 0, "Warp intensity should smoothly ramp up");
    warp.dispose();
  });

  it("4.16 PlanetVisualFactory should generate procedural geometry for all 6 worlds", () => {
    const earth = PlanetVisualFactory.createEarth(18.0);
    const moon = PlanetVisualFactory.createMoon(12.0);
    const mars = PlanetVisualFactory.createMars(14.0);
    const jupiter = PlanetVisualFactory.createJupiter(24.0);
    const saturn = PlanetVisualFactory.createSaturn(18.0);
    const deepSpace = PlanetVisualFactory.createDeepSpace(20.0);

    Assert.isTrue(earth !== null && earth.userData.radius === 18.0, "Earth procedural group must be created");
    Assert.isTrue(moon !== null && moon.userData.radius === 12.0, "Moon procedural group must be created");
    Assert.isTrue(mars !== null && mars.userData.radius === 14.0, "Mars procedural group must be created");
    Assert.isTrue(jupiter !== null && jupiter.userData.radius === 24.0, "Jupiter procedural group must be created");
    Assert.isTrue(saturn !== null && saturn.userData.ringMesh !== null, "Saturn ring mesh must be created");
    Assert.isTrue(deepSpace !== null && deepSpace.userData.radius === 20.0, "Deep Space procedural group must be created");
  });

  it("4.17 AnimationLab should isolate labOverrides and NEVER mutate player storage or profile", () => {
    const animLab = new AnimationLab();
    const profile = window.profileManager ? window.profileManager.getActiveProfile() : { currentRocketModel: "classic" };
    const originalModel = profile.currentRocketModel;

    animLab.applyCustomization("starship", "neon", "rover", "trail_rainbow");
    Assert.equal(animLab.labOverrides.model, "starship", "Lab override model must be starship");
    Assert.equal(profile.currentRocketModel, originalModel, "Real player profile model must NOT be mutated by Animation Lab");
  });

  it("4.18 DOM Contract Test: critical IDs must exist in DOM contract", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "moon");

    const ids = ["countdown-num", "check-item-1", "check-item-2", "check-item-3", "check-item-4", "launch-stage-banner", "space-victory-banner", "victory-title-text"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      Assert.isTrue(el !== null, `DOM element #${id} must exist in document contract`);
    });
    launch.destroy();
  });

  it("4.19 Real API Integration Test: startLaunch canonical API and backward-compatible alias", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "moon");

    Assert.equal(typeof launch.startLaunch, "function", "startLaunch canonical API must be a function");
    Assert.equal(typeof launch.startLaunchSequence, "function", "startLaunchSequence backward-compatible alias must be a function");

    let completed = false;
    launch.startLaunch({
      destinationId: "moon",
      onComplete: () => { completed = true; }
    });
    Assert.equal(launch.currentStage, "countdown", "startLaunch must transition to countdown");

    launch.destroy();
  });

  it("4.20 Single-Fire Skip Countdown should transition immediately to ignition", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "moon");
    launch.startLaunch();

    Assert.equal(launch.currentStage, "countdown", "Must start in countdown stage");
    launch.skipCountdown();

    Assert.equal(launch.countdownValue, 0, "Countdown value should immediately snap to 0");
    Assert.equal(launch.currentStage, "ignition", "Skip countdown must trigger ignition immediately");
    Assert.equal(launch.hasSkippedCountdown, true, "hasSkippedCountdown flag must be set to prevent duplicate triggers");

    // Second call should be a no-op
    launch.skipCountdown();
    Assert.equal(launch.currentStage, "ignition", "Second skip call should be safe no-op");
    launch.destroy();
  });

  it("4.21 Lifecycle & Timer Leak Test: destroy() must clean all timeouts, intervals, RAFs, and audio loops", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "mars");
    launch.startLaunch();

    launch.scheduleTimeout(() => {}, 5000);
    launch.scheduleInterval(() => {}, 1000);

    launch.destroy();

    Assert.equal(launch.activeTimeouts.length, 0, "activeTimeouts must be 0 after destroy");
    Assert.equal(launch.activeIntervals.length, 0, "activeIntervals must be 0 after destroy");
    Assert.equal(launch.activeRafs.size, 0, "activeRafs must be empty after destroy");
    Assert.equal(launch.scene, null, "scene must be null after destroy");
    Assert.isFalse(document.body.classList.contains("cinematic-mode-active"), "cinematic-mode-active class must be removed on destroy");
  });

  it("4.22 EngineVFXSystem should support cosmetic trail styles matching research unlocks", () => {
    const scene = new THREE.Scene();
    const engine = new EngineVFXSystem(scene);

    const styles = ["trail_standard", "trail_plasma_blue", "trail_ion_green", "trail_solar_flare", "trail_starlight"];
    styles.forEach(styleId => {
      engine.setTrailStyle(styleId);
      Assert.equal(engine.state.trailStyle, styleId, `Engine trailStyle must match ${styleId}`);
      Assert.isTrue(engine.plumeMesh.material.color !== null, `Plume mesh color must update for ${styleId}`);
    });
    engine.dispose();
  });

});
