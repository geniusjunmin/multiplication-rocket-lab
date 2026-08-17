/**
 * Math Engine & Fact Family Unit Tests (tests/test-math.js) - Version 3.1.0
 */
describe("1. Universal Math & Fact Family Engine (MathEngine 3.0)", () => {

  it("1.1 Should generate 9x9 Starter multiplication facts without >9 factors", () => {
    const math = new MathEngine();
    math.setChallengeConfig(CONFIG.MATH_CHALLENGE_PRESETS.times9);

    for (let i = 0; i < 30; i++) {
      const q = math.generateQuestion();
      Assert.isAtMost(q.operandA, 9, "operandA <= 9");
      Assert.isAtMost(q.operandB, 9, "operandB <= 9");
      Assert.equal(q.operation, "multiply", "Operation must be multiply");
      Assert.equal(q.answer, q.operandA * q.operandB, "answer = operandA * operandB");
    }
  });

  it("1.2 Should generate 20x20 Advanced multiplication facts (e.g. 17x14, 19x8)", () => {
    const math = new MathEngine();
    math.setChallengeConfig(CONFIG.MATH_CHALLENGE_PRESETS.times20);

    let foundHighFactor = false;
    for (let i = 0; i < 50; i++) {
      const q = math.generateQuestion();
      if (q.operandA > 12 || q.operandB > 12) foundHighFactor = true;
      Assert.isAtMost(q.operandA, 20, "operandA <= 20");
      Assert.isAtMost(q.operandB, 20, "operandB <= 20");
      Assert.equal(q.answer, q.operandA * q.operandB, "answer = operandA * operandB");
    }
    Assert.isTrue(foundHighFactor, "Should generate high factors > 12 in 20x20 mode");
  });

  it("1.3 Should generate exact integer division facts without decimals", () => {
    const math = new MathEngine();
    math.setChallengeConfig({ operations: ["divide"], factorAMin: 1, factorAMax: 12, factorBMin: 1, factorBMax: 12 });

    for (let i = 0; i < 30; i++) {
      const q = math.generateQuestion();
      Assert.equal(q.operation, "divide", "Operation must be divide");
      Assert.equal(q.operandA % q.operandB, 0, "Dividend must be exact multiple of divisor (no remainder)");
      Assert.equal(q.answer, q.operandA / q.operandB, "answer = operandA / operandB");
    }
  });

  it("1.4 Should link multiplication and division to the same Fact Family key", () => {
    const math = new MathEngine();
    const mulQ = math.formatQuestionObject("multiply", 7, 8);
    const divQ = math.formatQuestionObject("divide", 56, 7);

    Assert.equal(mulQ.factFamilyKey, "family:7:8", "7x8 belongs to family:7:8");
    Assert.equal(divQ.factFamilyKey, "family:7:8", "56÷7 belongs to family:7:8");
  });

  it("1.5 Should generate division smart hints (Think: b × ? = a)", () => {
    const math = new MathEngine();
    const divQ = math.formatQuestionObject("divide", 56, 7);

    Assert.equal(divQ.hint.type, "thinkMul", "Division should yield thinkMul hint");
    Assert.includes(divQ.hint.textEn, "7 × ? = 56", "Hint text must suggest reverse multiplication");
  });

  it("1.6 Should generate 2-level hints where Level 1 hides final answer and Level 2 reveals solution", () => {
    const math = new MathEngine();
    
    // Multiplication: 7 × 8 = 56
    const hintL1 = math.getSmartHint("multiply", 7, 8, 56, 1);
    const hintL2 = math.getSmartHint("multiply", 7, 8, 56, 2);

    Assert.isFalse(hintL1.textZh.includes("= 56"), "Level 1 hint must NOT expose the final answer '= 56'");
    Assert.isTrue(hintL2.textZh.includes("= 56"), "Level 2 hint must contain the worked solution '= 56'");

    // Division: 56 ÷ 7 = 8
    const divL1 = math.getSmartHint("divide", 56, 7, 8, 1);
    const divL2 = math.getSmartHint("divide", 56, 7, 8, 2);

    Assert.isFalse(divL1.textZh.includes("= 8"), "Division Level 1 hint must NOT expose '= 8'");
    Assert.isTrue(divL2.textZh.includes("= 8"), "Division Level 2 hint must contain solution '= 8'");
  });

  it("1.7 First-try accuracy must calculate (firstTryCorrect / questionsPresented) and track all attempt counters", () => {
    const math = new MathEngine();
    math.resetSessionStats();

    // 10 questions presented:
    // 8 answered correctly on 1st try
    // 2 failed on 1st try, retry failed once more, then succeeded on 3rd attempt
    for (let i = 0; i < 8; i++) {
      const q = math.formatQuestionObject("multiply", 2, i + 1);
      math.recordResult(q, true, true, 1200); // 1st try correct
    }

    for (let i = 0; i < 2; i++) {
      const q = math.formatQuestionObject("multiply", 7, i + 1);
      math.recordResult(q, false, true, 2000);  // 1st try wrong
      math.recordResult(q, false, false, 1800); // 2nd try wrong
      math.recordResult(q, true, false, 1500);  // 3rd try correct
    }

    const stats = math.sessionStats;
    Assert.equal(stats.questionsPresented, 10, "Total questions presented should be 10");
    Assert.equal(stats.firstTryCorrect, 8, "First try correct should be 8");
    Assert.equal(stats.wrongAttempts, 4, "Total wrong attempts should be 4 (2 questions × 2 wrong tries)");
    Assert.equal(stats.totalAttempts, 14, "Total attempts should be 14 (8 + 2*3)");
    Assert.equal(stats.correctFinalAnswers, 10, "Correct final answers should be 10");

    const firstTryAcc = math.getFirstTryAccuracy();
    Assert.equal(firstTryAcc, 80, "First-try accuracy MUST be 80% (8/10), never inflated to 100%");

    const completionRate = math.getFinalCompletionRate();
    Assert.equal(completionRate, 100, "Final completion rate should be 100% (10/10 completed)");
  });

  it("1.8 getTableMasteryReport should return averageMastery and percentage for achievement check compatibility", () => {
    const math = new MathEngine();
    const rep = math.getTableMasteryReport();
    Assert.equal(rep.length, 12, "Should report on 12 times tables");
    rep.forEach(r => {
      Assert.isTrue(typeof r.table === "number", "table should be number");
      Assert.isTrue(typeof r.averageMastery === "number", "averageMastery should be number");
      Assert.isTrue(typeof r.percentage === "number", "percentage should be number");
      Assert.equal(r.percentage, r.averageMastery, "percentage should equal averageMastery");
    });
  });

});

