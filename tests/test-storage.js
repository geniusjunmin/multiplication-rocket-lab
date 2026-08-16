/**
 * LocalStorage 存档管理器单元测试 (tests/test-storage.js)
 */
describe("2. 存档系统 (StorageManager)", () => {

  it("2.1 应该正常读取默认存储结构", () => {
    const storage = new StorageManager();
    Assert.equal(storage.get("playerName"), "小宇航员", "默认玩家昵称应为小宇航员");
    Assert.equal(storage.get("difficulty"), "normal", "默认难度应为 normal");
    Assert.equal(storage.get("selectedRocketModel"), "starship", "默认火箭型号应为 starship");
  });

  it("2.2 应该正常写入与读取键值数据", () => {
    const storage = new StorageManager();
    storage.set("score", 1500);
    Assert.equal(storage.get("score"), 1500, "读取得分应等于写入的 1500");

    storage.update({ playerName: "航天小霸王", score: 2000 });
    Assert.equal(storage.get("playerName"), "航天小霸王", "批量更新昵称应生效");
    Assert.equal(storage.get("score"), 2000, "批量更新得分应生效");
  });

  it("2.3 应该支持解包与标记零件安装", () => {
    const storage = new StorageManager();
    storage.clearAll();

    storage.unlockPart("body");
    storage.unlockPart("noseCone");
    Assert.equal(storage.get("unlockedParts").length, 2, "应有 2 个已解锁零件");

    storage.installPart("body");
    Assert.equal(storage.get("installedParts").length, 1, "应有 1 个已安装零件");
    Assert.includes(storage.get("installedParts"), "body", "已安装列表中应包含 body");
  });

  it("2.4 应该避免重复解包或安装同一个零件", () => {
    const storage = new StorageManager();
    storage.clearAll();

    storage.unlockPart("engine");
    storage.unlockPart("engine");
    Assert.equal(storage.get("unlockedParts").length, 1, "重复解锁零件不应新增数组元素");
  });

  it("2.5 应该正常发放成就勋章", () => {
    const storage = new StorageManager();
    storage.clearAll();

    const isNew = storage.awardBadge("first_launch");
    Assert.isTrue(isNew, "首次获得勋章应返回 true");

    const isDuplicate = storage.awardBadge("first_launch");
    Assert.isFalse(isDuplicate, "再次获得相同勋章应返回 false");
  });

  it("2.6 应该正常重置与清空所有存档", () => {
    const storage = new StorageManager();
    storage.set("score", 9999);
    storage.clearAll();

    Assert.equal(storage.get("score"), 0, "清空存档后得分应重置为 0");
    Assert.equal(storage.get("unlockedParts").length, 0, "清空存档后已解锁零件应为空");
  });

});
