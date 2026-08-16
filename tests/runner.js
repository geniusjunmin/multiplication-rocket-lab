/**
 * 乘法火箭实验室 - 轻量自动化测试框架 (tests/runner.js)
 */
class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.results = [];
  }

  describe(name, fn) {
    const suite = { name, tests: [] };
    this.suites.push(suite);
    this.currentSuite = suite;
    fn();
    this.currentSuite = null;
  }

  it(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn });
    }
  }

  async runAll(onProgress, onComplete) {
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.results = [];

    // 计算总测试数
    this.suites.forEach(s => this.totalTests += s.tests.length);

    let executed = 0;

    for (const suite of this.suites) {
      const suiteResult = { name: suite.name, tests: [] };

      for (const test of suite.tests) {
        executed++;
        const testResult = { name: test.name, passed: false, error: null, timeMs: 0 };
        const startTime = Date.now();

        try {
          await test.fn();
          testResult.passed = true;
          this.passedTests++;
        } catch (e) {
          testResult.passed = false;
          testResult.error = e.message || String(e);
          this.failedTests++;
        }
        testResult.timeMs = Date.now() - startTime;
        suiteResult.tests.push(testResult);

        if (onProgress) {
          onProgress({
            executed,
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.failedTests,
            currentTest: testResult
          });
        }
      }
      this.results.push(suiteResult);
    }

    if (onComplete) {
      onComplete({
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        suites: this.results
      });
    }

    return {
      total: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      suites: this.results
    };
  }
}

class Assert {
  static isTrue(val, msg) {
    if (!val) throw new Error(msg || `Expected true, got ${val}`);
  }
  static isFalse(val, msg) {
    if (val) throw new Error(msg || `Expected false, got ${val}`);
  }
  static equal(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(msg || `Expected ${expected}, but got ${actual}`);
    }
  }
  static notEqual(actual, expected, msg) {
    if (actual === expected) {
      throw new Error(msg || `Expected value not to equal ${expected}`);
    }
  }
  static isAbove(actual, expected, msg) {
    if (actual <= expected) {
      throw new Error(msg || `Expected ${actual} > ${expected}`);
    }
  }
  static isAtLeast(actual, expected, msg) {
    if (actual < expected) {
      throw new Error(msg || `Expected ${actual} >= ${expected}`);
    }
  }
  static includes(arr, val, msg) {
    if (!arr.includes(val)) {
      throw new Error(msg || `Expected array [${arr}] to include ${val}`);
    }
  }
}

// 导出全局对象
const testRunner = new TestRunner();
const describe = (name, fn) => testRunner.describe(name, fn);
const it = (name, fn) => testRunner.it(name, fn);

if (typeof module !== "undefined") {
  module.exports = { testRunner, describe, it, Assert };
} else {
  window.testRunner = testRunner;
  window.describe = describe;
  window.it = it;
  window.Assert = Assert;
}
