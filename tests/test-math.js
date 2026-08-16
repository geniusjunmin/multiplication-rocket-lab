/**
 * 数学计算与题目生成引擎单元测试 (tests/test-math.js)
 */
describe("1. 数学引擎 (MathEngine)", () => {

  it("1.1 应该正确在 1x1 ~ 9x9 范围内生成题目", () => {
    const math = new MathEngine();
    math.setTables([2, 3, 4, 5, 6, 7, 8, 9]);

    for (let i = 0; i < 50; i++) {
      const q = math.generateQuestion();
      Assert.isAtLeast(q.factorA, 1, "factorA 应 >= 1");
      Assert.isAtLeast(q.factorB, 1, "factorB 应 >= 1");
      Assert.equal(q.answer, q.factorA * q.factorB, "answer 应等于 factorA * factorB");
    }
  });

  it("1.2 应该尊重玩家选中的乘法表范围", () => {
    const math = new MathEngine();
    math.setTables([7, 8]);

    for (let i = 0; i < 30; i++) {
      const q = math.generateQuestion();
      const hasSelectedFactor = (q.factorA === 7 || q.factorA === 8 || q.factorB === 7 || q.factorB === 8);
      Assert.isTrue(hasSelectedFactor, "生成题目因数应至少包含选中的乘法表(7或8)");
    }
  });

  it("1.3 应该生成 3 个无重复的选择题答案，且包含正确答案", () => {
    const math = new MathEngine();

    for (let a = 2; a <= 9; a++) {
      for (let b = 2; b <= 9; b++) {
        const correct = a * b;
        const choices = math.generateDistractors(a, b, correct);
        
        Assert.equal(choices.length, 3, "选择题应恰好包含 3 个选项");
        Assert.includes(choices, correct, "选择题选项中应包含正确答案");
        
        const uniqueChoices = new Set(choices);
        Assert.equal(uniqueChoices.size, 3, "选择题选项中不能包含重复数值");
      }
    }
  });

  it("1.4 应该正确记录错题并加入错题重练队列", () => {
    const math = new MathEngine();
    const q = math.generateQuestion();

    math.recordResult(q, false, true); // 答错
    Assert.includes(math.wrongQuestionQueue.map(item => item.id), q.id, "答错题目应加入错题队列");
  });

  it("1.5 应该生成点阵阵列可视化数据与加法分解公式", () => {
    const math = new MathEngine();
    const data = math.getVisualArrayData(3, 4);

    Assert.equal(data.rows, 3, "行数应等于 factorA (3)");
    Assert.equal(data.cols, 4, "列数应等于 factorB (4)");
    Assert.includes(data.additionFormula, "4 + 4 + 4 = 12", "加法分解公式应正确");
  });

  it("1.6 应该准确计算 2~9 乘法表掌握度报告", () => {
    const math = new MathEngine();
    math.setTables([2, 5]);

    const q1 = { id: "2x3", factorA: 2, factorB: 3, answer: 6 };
    math.recordResult(q1, true, true);
    math.recordResult(q1, true, true);

    const report = math.getTableMasteryReport();
    Assert.equal(report.length, 8, "掌握度报告应包含 2 至 9 乘法表共 8 条数据");
    
    const table2Report = report.find(r => r.table === 2);
    Assert.equal(table2Report.percentage, 100, "2 的乘法表正确率应为 100%");
  });

});
