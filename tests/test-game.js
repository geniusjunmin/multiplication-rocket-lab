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

});
