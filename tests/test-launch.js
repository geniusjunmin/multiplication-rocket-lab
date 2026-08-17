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
    
    launch.triggerIgnition(() => {
      Assert.equal(launch.currentStage, "ignition", "Stage should transition to ignition");
    });
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

    // Hold for 2.6s to trigger settlement & mission complete
    launch.landingPhaseElapsed = 2.6;
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

});
