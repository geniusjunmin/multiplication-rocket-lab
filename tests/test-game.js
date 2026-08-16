/**
 * 游戏主逻辑与状态机单元测试 (tests/test-game.js)
 */
describe("5. 游戏主逻辑与状态机 (MultiplicationGame)", () => {

  it("5.1 应该正常在所有 16 种游戏状态间顺畅转换", () => {
    const game = new MultiplicationGame();
    const states = Object.values(GAME_STATES);

    states.forEach(st => {
      game.setGameState(st);
      Assert.equal(game.currentState, st, `游戏状态应成功切换至 ${st}`);
    });
  });

  it("5.2 应该在答对时正确计算基础分与连击加成", () => {
    const game = new MultiplicationGame();
    game.currentQuestion = { id: "3x4", factorA: 3, factorB: 4, answer: 12 };
    game.score = 0;
    game.comboCount = 0;

    // 第一次尝试答对 (100分 + 0连击加成)
    game.submitAnswer(12);
    Assert.equal(game.score, 100, "第1次答对应得 100 分");
    Assert.equal(game.comboCount, 1, "连击数应为 1");

    // 第二次尝试答对 (100分 + 10分连击加成)
    game.currentQuestion = { id: "5x5", factorA: 5, factorB: 5, answer: 25 };
    game.submitAnswer(25);
    Assert.equal(game.score, 210, "第2连击答对总分应为 210 分");
    Assert.equal(game.comboCount, 2, "连击数应为 2");
  });

  it("5.3 应该在答错时中断连击数并播放提示", () => {
    const game = new MultiplicationGame();
    game.comboCount = 5;
    game.currentQuestion = { id: "6x7", factorA: 6, factorB: 7, answer: 42 };

    game.submitAnswer(99); // 错误答案
    Assert.equal(game.comboCount, 0, "答错后连击数应归零");
  });

  it("5.4 应该在燃料挑战中正确加注燃料至 100%", () => {
    const game = new MultiplicationGame();
    game.fuelPercentage = 80;
    game.comboCount = 1;
    game.currentQuestion = { id: "2x2", factorA: 2, factorB: 2, answer: 4 };

    game.submitFuelAnswer(4);
    Assert.isAtLeast(game.fuelPercentage, 90, "加注后燃料应增加");

    game.currentQuestion = { id: "3x3", factorA: 3, factorB: 3, answer: 9 };
    game.submitFuelAnswer(9);
    Assert.equal(game.fuelPercentage, 100, "燃料上限应锁定为 100%");
  });

  it("5.5 应该在零件未满 10 个时自动扩充题数确保能解锁全部零件", () => {
    const game = new MultiplicationGame();
    game.totalQuestionsCount = 10;
    game.currentQuestionIdx = 10;

    // 假设已解锁零件不足 10 个
    window.storageManager.set("unlockedParts", ["body", "engine"]);
    game.nextQuestion();

    Assert.equal(game.totalQuestionsCount, 15, "零件未满时应自动扩充 5 道题");
  });

});
