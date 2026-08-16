/**
 * Node.js Command Line Automated Test Suite Runner (tests/run-node-tests.js)
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
  getElementById(id) { return createMockElement(id); },
  createElement() { return createMockElement(); },
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
  Scene: class { add() {} remove() {} traverse(fn) { fn(this); } },
  PerspectiveCamera: class { constructor() { this.position = { set() {} }; } },
  WebGLRenderer: class { constructor() { this.shadowMap = {}; this.domElement = createMockElement(); } setSize() {} setPixelRatio() {} dispose() {} render() {} },
  AmbientLight: class {},
  DirectionalLight: class { constructor() { this.position = { set() {} }; } },
  PointLight: class { constructor() { this.position = { set() {} }; } },
  Group: class { constructor() { this.position = { set() {} }; this.rotation = {}; this.children = []; } add() {} clone() { return new global.THREE.Group(); } traverse(fn) { fn(this); } },
  MeshStandardMaterial: class { dispose() {} },
  MeshBasicMaterial: class { dispose() {} },
  Mesh: class { constructor() { this.position = { set() {} }; this.rotation = {}; this.scale = {}; } add() {} clone() { const m = new global.THREE.Mesh(); m.position = { set() {} }; return m; } traverse(fn) { fn(this); } },
  CylinderGeometry: class { rotateX() {} dispose() {} },
  ConeGeometry: class { rotateX() {} dispose() {} },
  BoxGeometry: class { rotateX() {} dispose() {} },
  TorusGeometry: class { rotateX() {} dispose() {} },
  SphereGeometry: class { rotateX() {} dispose() {} },
  CircleGeometry: class { rotateX() {} dispose() {} },
  OctahedronGeometry: class { rotateX() {} dispose() {} },
  BufferGeometry: class { setAttribute() {} rotateX() {} dispose() {} },
  BufferAttribute: class {},
  PointsMaterial: class { dispose() {} },
  Points: class {},
  FogExp2: class {}
};

// Load modular scripts
const appFiles = [
  'js/config.js',
  'js/i18n.js',
  'js/profiles.js',
  'js/storage.js',
  'js/achievements.js',
  'js/missions.js',
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
  'tests/test-ui.js',
  'tests/test-i18n.js'
];

appFiles.forEach(f => {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInThisContext(code);
});

console.log("\n🚀 === Multiplication Rocket Lab Automated CLI Test Suite ===\n");

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
    console.log(`📊 Summary: Total ${summary.total} assertions | Passed: \x1b[32m${summary.passed}\x1b[0m | Failed: \x1b[31m${summary.failed}\x1b[0m`);
    console.log("------------------------------------------------\n");
    if (summary.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
);
