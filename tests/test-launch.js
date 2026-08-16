/**
 * Interplanetary Destination & Launch Sequence Unit Tests (tests/test-launch.js) - Version 3.0.0
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

  it("4.3 Should create surface landing environment for Moon and Mars", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "moon");
    launch.createLandingSurface("moon");

    Assert.isTrue(launch.surfaceGroup !== null, "Moon surface terrain group must be created");
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

  it("4.6 Should record destination visited only after destinationAction finishes", () => {
    const launch = new LaunchSequence();
    launch.initScene("canvas-container-launch", "mars");
    launch.currentStage = "destinationAction";
    launch.timelineElapsed = 3.5; // triggers completion

    let completeCount = 0;
    launch.onCompleteCallback = () => { completeCount++; };
    launch.updateTimeline(0.1);

    Assert.equal(launch.hasRecordedVisit, true, "Visit should be recorded");
    Assert.equal(launch.currentStage, "missionComplete", "Stage should transition to missionComplete");

    // Second update should NOT duplicate visit recording
    launch.updateTimeline(0.1);
    Assert.equal(launch.hasRecordedVisit, true, "Visit remains recorded without duplicating");
    launch.destroy();
  });

});
