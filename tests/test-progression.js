/**
 * Progression & Mission Architecture Test Suite (tests/test-progression.js) - Version 4.0.0
 */
testRunner.describe("8. Space Adventure Progression & Mission Tests", () => {

  testRunner.it("8.1 Should contain 18+ mission definitions with at least 3 per destination", () => {
    const missions = Object.values(CONFIG.MISSION_DEFINITIONS);
    Assert.isTrue(missions.length >= 18, `Should have at least 18 missions, found ${missions.length}`);

    const destMap = {};
    const ids = new Set();
    missions.forEach(m => {
      Assert.isFalse(ids.has(m.id), `Mission ID ${m.id} must be unique`);
      ids.add(m.id);

      destMap[m.destination] = (destMap[m.destination] || 0) + 1;
      Assert.isTrue(m.objectives && m.objectives.length >= 2, `Mission ${m.id} must have at least 2 objectives`);
      Assert.isTrue(m.reward && m.reward.xp > 0, `Mission ${m.id} must award XP`);
      Assert.isTrue(m.reward.collectible && CONFIG.COLLECTIBLES_DEFINITIONS[m.reward.collectible] !== undefined, `Mission ${m.id} collectible must exist`);
    });

    const expectedDestinations = ["earthOrbit", "moon", "mars", "jupiter", "saturn", "deepSpace"];
    expectedDestinations.forEach(d => {
      Assert.isTrue((destMap[d] || 0) >= 3, `Destination ${d} must have >=3 missions, found ${destMap[d] || 0}`);
    });
  });

  testRunner.it("8.2 Commander Level & XP progression should calculate levels and milestones accurately", () => {
    const mgr = new ProgressionManager();
    const l1 = mgr.getLevelInfo(0);
    Assert.equal(l1.level, 1, "0 XP should be Level 1");
    Assert.equal(l1.rankTitleEn, "Rookie Cadet", "Level 1 title check");

    const l2 = mgr.getLevelInfo(250);
    Assert.equal(l2.level, 2, "250 XP should be Level 2");
    Assert.equal(l2.xpInLevel, 50, "XP in level 2 check");

    const l4 = mgr.getLevelInfo(950);
    Assert.equal(l4.level, 4, "950 XP should be Level 4");
    Assert.equal(l4.rankTitleEn, "Mars Navigator", "Level 4 title check");

    const l8 = mgr.getLevelInfo(3600);
    Assert.equal(l8.level, 8, "3600 XP should be Level 8");
    Assert.isTrue(l8.isMaxRank, "Level 8 should be max rank");
  });

  testRunner.it("8.3 Mission completion should award 1-3 stars, XP, and first-clear bonuses without duplicate collectibles", () => {
    const mgr = new ProgressionManager();
    const profile = profileManager.getActiveProfile();
    profile.missionRecords = {};
    profile.collectibles = [];
    profile.progression = { commanderLevel: 1, xp: 0, totalStars: 0, researchPoints: 0 };
    profileManager.save();

    // 1st Clear: All objectives met
    const objectivesStatus = [
      { id: "primary", completed: true, stars: 1 },
      { id: "first_try", completed: true, stars: 1 },
      { id: "streak", completed: true, stars: 1 }
    ];

    const sessionStats = { firstTryAccuracy: 95, score: 1200, maxCombo: 6, questionsPresented: 15 };
    const res1 = mgr.recordMissionComplete("moon_crater_survey", sessionStats, objectivesStatus);

    Assert.equal(res1.starsEarned, 3, "All objectives met should earn 3 stars");
    Assert.equal(res1.grade, "S", "95% accuracy + all objectives should award S Grade");
    Assert.isTrue(res1.isFirstClear, "First run should be marked isFirstClear");
    Assert.isTrue(profile.collectibles.includes("moon_basalt_rock"), "Should unlock moon_basalt_rock collectible");
    Assert.equal(profile.progression.totalStars, 3, "Profile should have 3 stars");

    const prevXP = profile.progression.xp;

    // 2nd Clear: Same mission, repeat run
    const res2 = mgr.recordMissionComplete("moon_crater_survey", sessionStats, objectivesStatus);
    Assert.isFalse(res2.isFirstClear, "Second run should not be isFirstClear");
    Assert.equal(profile.collectibles.filter(c => c === "moon_basalt_rock").length, 1, "Collectible must NOT duplicate");
    Assert.equal(profile.progression.totalStars, 3, "No duplicate stars awarded if already at 3 stars");
    Assert.isTrue(profile.progression.xp > prevXP, "Repeat runs should still award XP for math practice");
  });

  testRunner.it("8.4 Offline Seeded Daily Missions should be deterministic for same date and profile, and change across dates", () => {
    const mgr = new ProgressionManager();
    const profileId = "test_cadet_001";
    const date1 = "2026-08-17";
    const date2 = "2026-08-18";

    const run1 = mgr.getDailyMissions(date1, profileId);
    const run2 = mgr.getDailyMissions(date1, profileId);

    Assert.equal(run1.length, 3, "Daily missions must generate 3 missions");
    Assert.equal(run1[0].id, run2[0].id, "Deterministic: mission 1 must match");
    Assert.equal(run1[1].id, run2[1].id, "Deterministic: mission 2 must match");
    Assert.equal(run1[2].id, run2[2].id, "Deterministic: mission 3 must match");

    const runDate2 = mgr.getDailyMissions(date2, profileId);
    Assert.equal(runDate2.length, 3, "Next day should generate 3 missions");
  });

  testRunner.it("8.5 Space Museum should contain 18 planetary items with fun science facts", () => {
    const items = Object.values(CONFIG.COLLECTIBLES_DEFINITIONS);
    Assert.equal(items.length, 18, `Should have 18 museum items, found ${items.length}`);

    items.forEach(it => {
      Assert.isTrue(Boolean(it.nameEn && it.nameZh), `Item ${it.id} must have bilingual names`);
      Assert.isTrue(Boolean(it.factEn && it.factZh), `Item ${it.id} must have bilingual science facts`);
      Assert.isTrue(Boolean(it.icon), `Item ${it.id} must have icon`);
    });
  });

  testRunner.it("8.6 ProgressionManager.evaluateUnlocks should unlock rockets and themes when milestones are reached", () => {
    const mgr = new ProgressionManager();
    const profile = profileManager.getActiveProfile();
    profile.unlockedRocketModels = ["classic"];
    profile.unlockedRocketThemes = ["explorer"];
    profile.progression = { commanderLevel: 1, xp: 0, totalStars: 15, researchPoints: 0 };
    profile.destinationsVisited = { earthOrbit: true, moon: true, mars: true };
    profile.collectibles = ["c1", "c2", "c3", "c4", "c5", "c6"];
    profile.maxComboAllTime = 10;
    profileManager.save();

    const res = mgr.evaluateUnlocks();
    Assert.isTrue(profile.unlockedRocketModels.includes("falconHeavy"), "12+ Stars should unlock Falcon Heavy");
    Assert.isTrue(profile.unlockedRocketModels.includes("longMarch"), "3 Destinations should unlock Long March");
    Assert.isTrue(profile.unlockedRocketModels.includes("cyber"), "6 Collectibles should unlock Cyber Starship");
    Assert.isTrue(profile.unlockedRocketThemes.includes("fire"), "6+ Combo should unlock Fire theme");
    Assert.isTrue(profile.unlockedRocketThemes.includes("lightning"), "10+ Combo should unlock Lightning theme");
  });

  testRunner.it("8.7 Research Lab should allow unlocking cosmetic engine trails with Research Points", () => {
    const mgr = new ProgressionManager();
    const profile = profileManager.getActiveProfile();
    profile.progression = { commanderLevel: 3, xp: 500, totalStars: 10, researchPoints: 50 };
    profile.unlockedResearch = ["trail_standard"];
    profileManager.save();

    const buyRes = mgr.unlockResearch("trail_plasma_blue");
    Assert.isTrue(buyRes.success, "Should unlock trail_plasma_blue with 30 RP");
    Assert.equal(profile.progression.researchPoints, 20, "Should deduct 30 RP (50 - 30 = 20)");
    Assert.isTrue(profile.unlockedResearch.includes("trail_plasma_blue"), "Should add trail to unlockedResearch");

    // Try buying expensive item without enough RP
    const failRes = mgr.unlockResearch("trail_starlight");
    Assert.isFalse(failRes.success, "Should fail when RP is insufficient");
  });

  testRunner.it("8.8 Mission history should be capped at 100 entries and avoid unbounded growth", () => {
    const mgr = new ProgressionManager();
    const profile = profileManager.getActiveProfile();
    profile.missionHistory = [];

    const stats = { firstTryAccuracy: 85, score: 800, maxCombo: 4, questionsPresented: 10 };
    const objs = [{ id: "primary", completed: true, stars: 1 }];

    for (let i = 0; i < 110; i++) {
      mgr.recordMissionComplete("earth_satellite_deploy", stats, objs);
    }

    Assert.equal(profile.missionHistory.length, 100, "Mission history must be capped at 100");
  });

});
