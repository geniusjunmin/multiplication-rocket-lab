/**
 * 3D 火箭构建与多型号组装引擎单元测试 (tests/test-rocket.js)
 */
describe("3. 3D 火箭构建器 (RocketBuilder)", () => {

  it("3.1 应该包含 10 个标准火箭零件定义", () => {
    const builder = new RocketBuilder();
    Assert.equal(builder.partDefinitions.length, 10, "应有 10 个零件定义");
    Assert.equal(builder.partDefinitions[0].id, "body", "第一个零件应为 body");
    Assert.equal(builder.partDefinitions[1].id, "noseCone", "第二个零件应为 noseCone");
  });

  it("3.2 应该支持 5 种前沿现代火箭型号构建", () => {
    const builder = new RocketBuilder();
    const models = ["classic", "starship", "falconHeavy", "longMarch", "cyber"];

    models.forEach(model => {
      builder.currentModel = model;
      builder.buildCurrentRocket();

      Assert.isTrue(builder.rocketGroup !== null, `型号 ${model} 对应的 rocketGroup 应成功构建`);
      Assert.equal(Object.keys(builder.parts).length, 10, `型号 ${model} 应创建 10 个零件 Mesh 对象`);
    });
  });

  it("3.3 应该根据已安装零件列表更新零件 Visible 可见性", () => {
    const builder = new RocketBuilder();
    builder.buildCurrentRocket();

    builder.updateInstalledParts(["body", "engine"]);
    Assert.isTrue(builder.parts.body.visible, "body 零件应可见");
    Assert.isTrue(builder.parts.engine.visible, "engine 零件应可见");
    Assert.isFalse(builder.parts.noseCone.visible, "未安装的 noseCone 零件应隐藏");
  });

  it("3.4 应该支持无缝切换 5 种主题涂装配色", () => {
    const builder = new RocketBuilder();
    const themes = ["explorer", "fire", "forest", "lightning", "galaxy"];

    themes.forEach(t => {
      builder.setTheme(t);
      Assert.equal(builder.currentTheme, t, `当前主题应正确切换为 ${t}`);
    });
  });

  it("3.5 应该正常执行 3D 画布销毁与内存清理", () => {
    const builder = new RocketBuilder();
    builder.destroy();
    Assert.equal(builder.animationId, null, "销毁后 animationId 应重置为 null");
    Assert.equal(builder.renderer, null, "销毁后 renderer 应重置为 null");
  });

});
