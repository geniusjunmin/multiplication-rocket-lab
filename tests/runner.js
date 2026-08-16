/**
 * Multiplication Rocket Lab - Lightweight Test Runner (tests/runner.js)
 */
class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
  }

  describe(name, fn) {
    const suite = { name, tests: [] };
    this.suites.push(suite);
    this.currentSuite = suite;
    fn();
  }

  it(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn });
    }
  }

  runAll(onProgress, onComplete) {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let executed = 0;

    this.suites.forEach(s => total += s.tests.length);

    for (const suite of this.suites) {
      this.currentSuite = suite;
      for (const test of suite.tests) {
        executed++;
        const startTime = Date.now();
        let isPass = false;
        let errStr = "";

        try {
          test.fn();
          isPass = true;
          passed++;
        } catch (e) {
          failed++;
          errStr = e.message || String(e);
        }

        const duration = Date.now() - startTime;
        if (onProgress) {
          onProgress({
            executed,
            total,
            passed,
            failed,
            currentTest: {
              name: test.name,
              passed: isPass,
              error: errStr,
              timeMs: duration
            }
          });
        }
      }
    }

    if (onComplete) {
      onComplete({ total, executed, passed, failed });
    }
  }
}

const Assert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  },
  isTrue(val, message) {
    if (val !== true) {
      throw new Error(message || `Expected true, but got ${val}`);
    }
  },
  isFalse(val, message) {
    if (val !== false) {
      throw new Error(message || `Expected false, but got ${val}`);
    }
  },
  includes(arrOrStr, item, message) {
    if (!arrOrStr || (typeof arrOrStr.includes === "function" && !arrOrStr.includes(item))) {
      throw new Error(message || `Expected ${arrOrStr} to include ${item}`);
    }
  },
  isAtLeast(val, min, message) {
    if (val < min) {
      throw new Error(message || `Expected ${val} >= ${min}`);
    }
  },
  isAtMost(val, max, message) {
    if (val > max) {
      throw new Error(message || `Expected ${val} <= ${max}`);
    }
  }
};

if (typeof module !== "undefined") {
  module.exports = { TestRunner, Assert };
  global.TestRunner = TestRunner;
  global.Assert = Assert;
  global.describe = (name, fn) => testRunner.describe(name, fn);
  global.it = (name, fn) => testRunner.it(name, fn);
  global.testRunner = new TestRunner();
} else {
  window.testRunner = new TestRunner();
  window.describe = (name, fn) => window.testRunner.describe(name, fn);
  window.it = (name, fn) => window.testRunner.it(name, fn);
  window.Assert = Assert;
}
