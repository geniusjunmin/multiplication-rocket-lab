/**
 * Node.js 命令行自动测试脚本 (tests/run-node-tests.js)
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Helper to create mock DOM Element
function createMockElement(id = "") {
  return {
    id,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {},
    innerText: "",
    innerHTML: "",
    value: "",
    disabled: false,
    appendChild() {},
    remove() {},
    setAttribute() {},
    getAttribute() { return ""; },
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { return [createMockElement(), createMockElement(), createMockElement()]; },
    querySelector() { return createMockElement(); },
    getContext() { return {}; }
  };
}

// Mock Node global DOM environment
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.document = {
  querySelectorAll() { return [createMockElement(), createMockElement(), createMockElement()]; },
  querySelector() { return createMockElement(); },
  getElementById(id) {
    return createMockElement(id);
  },
  createElement() {
    return createMockElement();
  },
  documentElement: { requestFullscreen() { return Promise.resolve(); } }
};

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// Mock THREE.js
global.THREE = {
  Scene: class { add() {} remove() {} },
  PerspectiveCamera: class { constructor() { this.position = { set() {} }; } },
  WebGLRenderer: class { constructor() { this.shadowMap = {}; this.domElement = createMockElement(); } setSize() {} setPixelRatio() {} dispose() {} render() {} },
  AmbientLight: class {},
  DirectionalLight: class { constructor() { this.position = { set() {} }; } },
  PointLight: class { constructor() { this.position = { set() {} }; } },
  Group: class { constructor() { this.position = { set() {} }; this.rotation = {}; this.children = []; } add() {} clone() { return new global.THREE.Group(); } },
  MeshStandardMaterial: class {},
  MeshBasicMaterial: class {},
  Mesh: class { constructor() { this.position = { set() {} }; this.rotation = {}; this.scale = {}; } add() {} clone() { const m = new global.THREE.Mesh(); m.position = { set() {} }; return m; } },
  CylinderGeometry: class { rotateX() {} },
  ConeGeometry: class { rotateX() {} },
  BoxGeometry: class { rotateX() {} },
  TorusGeometry: class { rotateX() {} },
  SphereGeometry: class { rotateX() {} },
  OctahedronGeometry: class { rotateX() {} },
  BufferGeometry: class { setAttribute() {} rotateX() {} },
  BufferAttribute: class {},
  PointsMaterial: class {},
  Points: class {},
  FogExp2: class {}
};

// 1. 加载测试框架与组件文件
const appFiles = [
  'js/storage.js',
  'js/audio.js',
  'js/math.js',
  'js/rocket.js',
  'js/launch.js',
  'js/ui.js',
  'js/game.js',
  'tests/runner.js',
  'tests/test-math.js',
  'tests/test-storage.js',
  'tests/test-rocket.js',
  'tests/test-launch.js',
  'tests/test-game.js',
  'tests/test-ui.js'
];

appFiles.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

// 2. 执行自动化测试集
console.log("\n🚀 === 乘法火箭实验室 命令行自动化测试开始 ===\n");

testRunner.runAll(
  (progress) => {
    const symbol = progress.currentTest.passed ? "✓" : "✕";
    const color = progress.currentTest.passed ? "\x1b[32m" : "\x1b[31m";
    console.log(`${color}${symbol} [${progress.executed}/${progress.total}] ${progress.currentTest.name}\x1b[0m (${progress.currentTest.timeMs}ms)`);
    if (!progress.currentTest.passed) {
      console.error(`   \x1b[31mError: ${progress.currentTest.error}\x1b[0m`);
    }
  },
  (summary) => {
    console.log("\n------------------------------------------------");
    console.log(`📊 测试总结: 总计 ${summary.total} 项断言 | 通过: \x1b[32m${summary.passed}\x1b[0m | 失败: \x1b[31m${summary.failed}\x1b[0m`);
    console.log("------------------------------------------------\n");
    if (summary.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
);
