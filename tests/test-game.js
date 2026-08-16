/**
 * State Machine & Game Flow Test Suite (tests/test-game.js)
 */
testRunner.describe("5. Game Flow & State Machine Tests", () => {

  testRunner.it("5.1 Should transition cleanly through all valid game states", () => {
    const game = new MultiplicationGame();
    game.init();

    Assert.equal(game.currentState, GAME_STATES.HOME, "Initial state should be HOME");

    game.setGameState(GAME_STATES.BLUEPRINT);
    Assert.equal(game.currentState, GAME_STATES.BLUEPRINT, "State should transition to BLUEPRINT");

    game.setGameState(GAME_STATES.QUESTION);
    Assert.equal(game.currentState, GAME_STATES.QUESTION, "State should transition to QUESTION");
  });

  testRunner.it("5.2 Should lock answer submission (isAnswerLocked) to prevent double score/part credit", () => {
    const game = new MultiplicationGame();
    game.init();
    game.startNewGameRound();

    game.isAnswerLocked = false;
    game.currentQuestion = { id: "7x8", operandA: 7, operandB: 8, answer: 56, operation: "multiply" };
    game.questionShownAt = Date.now();

    game.submitAnswer(56);
    Assert.equal(game.isAnswerLocked, true, "Answer submission must lock immediately after first call");

    const prevScore = game.score;
    game.submitAnswer(56);
    Assert.equal(game.score, prevScore, "Duplicate submission while locked must not award points");
  });

  testRunner.it("5.3 Should handle Pause and Resume without breaking state", () => {
    const game = new MultiplicationGame();
    game.init();
    game.setGameState(GAME_STATES.QUESTION);

    game.pauseGame();
    Assert.equal(game.currentState, GAME_STATES.PAUSED, "State should be PAUSED");

    game.resumeGame();
    Assert.equal(game.currentState, GAME_STATES.QUESTION, "State should resume to QUESTION");
  });

  testRunner.it("5.4 Developer shortcut skipAllQuestions should use real part IDs and never p1..p10", () => {
    const game = new MultiplicationGame();
    game.skipAllQuestions();
    const unlocked = storageManager.get("unlockedParts");
    Assert.equal(unlocked.length, 10, "Should unlock 10 parts");
    Assert.isTrue(unlocked.includes("body"), "Should include body");
    Assert.isTrue(unlocked.includes("noseCone"), "Should include noseCone");
    Assert.isFalse(unlocked.includes("p1"), "Must NOT use legacy p1 ID");
    Assert.isFalse(unlocked.includes("p10"), "Must NOT use legacy p10 ID");
  });

  testRunner.it("5.5 submitFuelAnswer should correctly clamp fuelPercentage between 0 and 100", () => {
    const game = new MultiplicationGame();
    game.fuelPercentage = 95;
    game.comboCount = 2;
    game.isAnswerLocked = false;
    game.currentQuestion = { id: "3x3", answer: 9 };

    game.submitFuelAnswer(9);
    Assert.equal(game.fuelPercentage, 100, "Fuel percentage should clamp to maximum 100%");
  });

  testRunner.it("5.6 Should strictly enforce assembly completion before entering FUEL_CHALLENGE", () => {
    const game = new MultiplicationGame();
    storageManager.set("installedParts", ["body", "noseCone"]); // Only 2 parts installed

    game.setGameState(GAME_STATES.FUEL_CHALLENGE);
    Assert.equal(game.currentState, GAME_STATES.ASSEMBLY, "Must redirect to ASSEMBLY if parts < 10");

    // Install all 10 parts
    const allParts = ["body", "noseCone", "leftBooster", "rightBooster", "leftFin", "rightFin", "engine", "window", "fuelTank", "controlModule"];
    storageManager.set("installedParts", allParts);

    game.setGameState(GAME_STATES.FUEL_CHALLENGE);
    Assert.equal(game.currentState, GAME_STATES.FUEL_CHALLENGE, "State should transition to FUEL_CHALLENGE once all 10 parts are installed");
  });

  testRunner.it("5.7 Should support MISSION_COMPLETE state and clean lifecycle exit", () => {
    const game = new MultiplicationGame();
    game.init();
    Assert.isTrue(GAME_STATES.MISSION_COMPLETE !== undefined, "GAME_STATES.MISSION_COMPLETE must exist");

    game.setGameState(GAME_STATES.ASSEMBLY);
    game.setGameState(GAME_STATES.HOME);
    Assert.equal(game.currentState, GAME_STATES.HOME, "State transition with teardown should complete cleanly");
  });

});
