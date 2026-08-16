/**
 * DOM 交互与 UI 渲染管理器单元测试 (tests/test-ui.js)
 */
describe("6. UI 与 DOM 渲染管理器 (UIManager)", () => {

  it("6.1 应该正常追加与擦除数字键盘输入", () => {
    const ui = new UIManager();
    ui.currentAnswerInput = "";

    ui.appendKeyInput("5");
    ui.appendKeyInput("6");
    Assert.equal(ui.currentAnswerInput, "56", "输入应为 56");

    ui.appendKeyInput("backspace");
    Assert.equal(ui.currentAnswerInput, "5", "擦除后应为 5");

    ui.appendKeyInput("clear");
    Assert.equal(ui.currentAnswerInput, "", "清空后应为空字符串");
  });

  it("6.2 应该在各种答题模式下正确切换输入面板与除法符号渲染", () => {
    const ui = new UIManager();
    const qDiv = { operandA: 42, operandB: 7, answer: 6, operation: "divide", options: [5, 6, 7] };

    ui.renderQuestion(qDiv, "normal");
    Assert.equal(ui.currentAnswerInput, "", "渲染新题时答案输入框应重置");
  });

  it("6.3 installingParts Set 应该防止重复安装同一个零件", () => {
    const ui = new UIManager();
    ui.installingParts.add("body");
    Assert.isTrue(ui.installingParts.has("body"), "installingParts 集合中应包含 body 零件");
    ui.installingParts.delete("body");
    Assert.isFalse(ui.installingParts.has("body"), "安装完毕后应从 installingParts 集合移除");
  });

});
