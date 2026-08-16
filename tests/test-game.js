/**
 * Game State Machine & Concurrency Unit Tests (tests/test-game.js)
 */
describe("5. Game Engine State Machine & Concurrency (MultiplicationGame)", () => {

  it("5.1 Should transition cleanly through all valid game states", () => {
    const game = new MultiplicationGame();
    const states = Object.values(GAME_STATES);

    states.forEach(st => {
      game.setGameState(st);
      Assert.equal(game.currentState, st, `State transition to ${st} should succeed`);
    });
  });

  it("5.2 Should lock answer submission (isAnswerLocked) to prevent double score/part credit", () => {
    const game = new MultiplicationGame();
    game.startNewGameRound();
    game.currentQuestion = { id: "7x8", factorA: 7, factorB: 8, answer: 56 };
    game.score = 0;
    game.isAnswerLocked = false;

    game.submitAnswer(56);
    const scoreAfterFirst = game.score;

    // Immediate second click/Enter press during lock window
    game.submitAnswer(56);
    Assert.equal(game.score, scoreAfterFirst, "Score should not increase on repeated click during submission lock");
  });

  it("5.3 Should handle Pause and Resume without breaking state", () => {
    const game = new MultiplicationGame();
    game.setGameState(GAME_STATES.QUESTION);
    game.pauseGame();
    Assert.equal(game.currentState, GAME_STATES.PAUSED, "State should be PAUSED");

    game.resumeGame();
    Assert.equal(game.currentState, GAME_STATES.QUESTION, "State should resume to QUESTION");
  });

  it("5.4 Developer shortcut skipAllQuestions should use real part IDs and never p1..p10", () => {
    const game = new MultiplicationGame();
    game.skipAllQuestions();
    const unlocked = storageManager.get("unlockedParts");
    Assert.equal(unlocked.length, 10, "Should unlock 10 parts");
    Assert.isTrue(unlocked.includes("body"), "Should include body");
    Assert.isTrue(unlocked.includes("noseCone"), "Should include noseCone");
    Assert.isFalse(unlocked.includes("p1"), "Must NOT use legacy p1 ID");
    Assert.isFalse(unlocked.includes("p10"), "Must NOT use legacy p10 ID");
  });

  it("5.5 submitFuelAnswer should correctly clamp fuelPercentage between 0 and 100", () => {
    const game = new MultiplicationGame();
    game.fuelPercentage = 95;
    game.comboCount = 2;
    game.isAnswerLocked = false;
    game.currentQuestion = { id: "3x3", answer: 9 };

    game.submitFuelAnswer(9);
    Assert.equal(game.fuelPercentage, 100, "Fuel percentage should clamp to maximum 100%");
  });

});
