/**
 * Adaptive Learning Engine & 1-12 Math Unit Tests (tests/test-math.js)
 */
describe("1. Adaptive Learning & 1-12 Math Engine (MathEngine)", () => {

  it("1.1 Should generate multiplication facts within 1x1 ~ 12x12 range", () => {
    const math = new MathEngine();
    math.setTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    for (let i = 0; i < 50; i++) {
      const q = math.generateQuestion();
      Assert.isAtLeast(q.factorA, 1, "factorA >= 1");
      Assert.isAtLeast(q.factorB, 1, "factorB >= 1");
      Assert.equal(q.answer, q.factorA * q.factorB, "answer == factorA * factorB");
    }
  });

  it("1.2 Should respect UK Curriculum Presets (Year 2: x2, x5, x10)", () => {
    const math = new MathEngine();
    const presetY2 = CONFIG.CURRICULUM_PRESETS.year2;
    math.setTables(presetY2.tables);

    for (let i = 0; i < 30; i++) {
      const q = math.generateQuestion();
      const hasPresetFactor = presetY2.tables.includes(q.factorA) || presetY2.tables.includes(q.factorB);
      Assert.isTrue(hasPresetFactor, "Question factor must contain Year 2 preset tables (2, 5, 10)");
    }
  });

  it("1.3 Should generate 3 unique distractors within valid range, including correct answer", () => {
    const math = new MathEngine();

    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        const correct = a * b;
        const choices = math.generateDistractors(a, b, correct);
        
        Assert.equal(choices.length, 3, "Must have exactly 3 choice options");
        Assert.includes(choices, correct, "Must include the correct answer");
        
        const uniqueChoices = new Set(choices);
        Assert.equal(uniqueChoices.size, 3, "All choices must be unique");
      }
    }
  });

  it("1.4 Should generate pedagogical smart strategy hints based on factors", () => {
    const math = new MathEngine();
    const hint2 = math.getSmartHint(2, 8);
    Assert.equal(hint2.type, "double", "x2 table should yield double hint");

    const hint5 = math.getSmartHint(5, 7);
    Assert.equal(hint5.type, "count5", "x5 table should yield count5 hint");

    const hint9 = math.getSmartHint(9, 6);
    Assert.equal(hint9.type, "subNine", "x9 table should yield subNine hint");
  });

  it("1.5 Should accurately calculate fact mastery scores (0-100) and 12x12 Parent Report", () => {
    const math = new MathEngine();
    const fact = { attempts: 10, firstTryCorrect: 9, streak: 4, averageResponseTime: 2500, wrongCount: 1 };
    const score = math.calculateMastery(fact);

    Assert.isAtLeast(score, 70, "Mastery score for 90% accuracy & 4 streak should be >= 70%");
    
    const report = math.getTableMasteryReport();
    Assert.equal(report.length, 12, "Parent report must contain 12 tables (1 to 12)");
  });

});
