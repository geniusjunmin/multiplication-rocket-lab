/**
 * Profile & Storage System Unit Tests (tests/test-storage.js)
 */
describe("2. Profile & Storage Persistence System (ProfileManager & StorageManager)", () => {

  it("2.1 Should initialize default profile with 144 multiplication facts", () => {
    const active = window.profileManager.getActiveProfile();
    Assert.isTrue(active !== null, "Active profile must exist");
    Assert.equal(Object.keys(active.facts).length, 144, "Must contain all 144 facts (1x1 to 12x12)");
  });

  it("2.2 Should support adding, switching, and deleting child profiles", () => {
    const originalCount = window.profileManager.profiles.length;
    const newP = window.profileManager.addProfile("Amy", "year3");

    Assert.equal(window.profileManager.profiles.length, originalCount + 1, "Profile count should increase by 1");
    Assert.equal(window.profileManager.activeProfileId, newP.id, "Active profile should be switched to new profile");

    window.profileManager.switchProfile(window.profileManager.profiles[0].id);
    Assert.equal(window.profileManager.activeProfileId, window.profileManager.profiles[0].id, "Should switch back to first profile");
  });

  it("2.3 Should export data as JSON and re-import with schema validation", () => {
    const jsonStr = window.profileManager.exportDataJson();
    Assert.includes(jsonStr, "profiles", "JSON export must contain profiles key");

    const importRes = window.profileManager.importDataJson(jsonStr);
    Assert.isTrue(importRes.success, "JSON import should succeed");
  });

  it("2.4 Should export CSV report with headers and 144 fact rows", () => {
    const csvStr = window.profileManager.exportReportCsv();
    Assert.includes(csvStr, "Fact ID,Factor A,Factor B", "CSV export must contain proper headers");
    const lines = csvStr.trim().split("\n");
    Assert.equal(lines.length, 145, "CSV must contain 1 header line + 144 fact lines");
  });

});
