/**
 * Storage & Profile Migration Unit Tests (tests/test-storage.js) - Version 3.0.0
 */
describe("2. Profile & Storage Persistence System 3.0 (ProfileManager & Schema V3)", () => {

  it("2.1 Should initialize profile with Schema V3 and 1~20 Multiplication & Division facts", () => {
    const active = window.profileManager.getActiveProfile();
    Assert.isTrue(active !== null, "Active profile must exist");
    Assert.equal(active.schemaVersion, 3, "Schema version must be 3");
    Assert.isTrue(active.facts["mul:7x8"] !== undefined, "Must contain mul:7x8 fact key");
    Assert.isTrue(active.facts["div:56/7"] !== undefined, "Must contain div:56/7 fact key");
  });

  it("2.2 Should record Interplanetary Destination visits in Space Passport", () => {
    window.profileManager.recordDestinationVisited("saturn");
    const active = window.profileManager.getActiveProfile();
    Assert.isTrue(active.destinationsVisited["saturn"] === true, "Saturn visit must be recorded in passport");
  });

  it("2.3 Should export Schema V3 JSON data and re-import cleanly", () => {
    const jsonStr = window.profileManager.exportDataJson();
    Assert.includes(jsonStr, "schemaVersion", "Exported JSON must contain schemaVersion");

    const importRes = window.profileManager.importDataJson(jsonStr);
    Assert.isTrue(importRes.success, "Import of V3 JSON data must succeed");
  });

  it("2.4 Should export CSV report with operation column and headers", () => {
    const csvStr = window.profileManager.exportReportCsv();
    Assert.includes(csvStr, "Fact ID,Operation,Operand A,Operand B", "CSV headers must contain Operation column");
  });

});
