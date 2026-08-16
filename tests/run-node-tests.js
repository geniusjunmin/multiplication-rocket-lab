/**
 * Node.js Command Line Automated Test Suite Runner (tests/run-node-tests.js) - Version 3.0.0
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Helper to create mock DOM Element
function createMockElement(id = "") {
  return {
    id,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {
      setProperty(k, v) { this[k] = v; }
    },
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
global.window.WebGLRenderingContext = class {};
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.document = {
  querySelectorAll() { return [createMockElement(), createMockElement(), createMockElement()]; },
  querySelector() { return createMockElement(); },
  getElementById(id) { return createMockElement(id); },
  createElement() { return createMockElement(); },
  documentElement: { requestFullscreen() { return Promise.resolve(); } },
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// Mock THREE.js
global.THREE = {
  Scene: class { constructor() { this.children = []; } add(o) { if (o) this.children.push(o); } remove(o) { this.children = this.children.filter(c => c !== o); } traverse(fn) { fn(this); } },
  Color: class { lerp() { return this; } },
  PerspectiveCamera: class { constructor() { this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.fov = 50; } lookAt() {} updateProjectionMatrix() {} },
  WebGLRenderer: class { constructor() { this.shadowMap = {}; this.domElement = createMockElement(); } setSize() {} setPixelRatio() {} dispose() {} render() {} },
  AmbientLight: class {},
  DirectionalLight: class { constructor() { this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; } },
  PointLight: class { constructor() { this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.intensity = 1; } },
  Group: class {
    constructor() {
      this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy(p) { Object.assign(this, p); }, clone() { return { ...this }; } };
      this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy(r) { Object.assign(this, r); }, clone() { return { ...this }; } };
      this.scale = { x: 1, y: 1, z: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy(s) { Object.assign(this, s); }, clone() { return { ...this }; } };
      this.quaternion = { x: 0, y: 0, z: 0, w: 1, copy(q) { Object.assign(this, q); }, clone() { return { ...this }; } };
      this.children = [];
      this.visible = true;
    }
    add(o) { if (o) this.children.push(o); }
    remove(o) { this.children = this.children.filter(c => c !== o); }
    clone() {
      const g = new global.THREE.Group();
      g.children = this.children.map(c => c.clone ? c.clone() : c);
      return g;
    }
    traverse(fn) {
      fn(this);
      this.children.forEach(c => { if (c && c.traverse) c.traverse(fn); else fn(c); });
    }
  },
  MeshStandardMaterial: class { constructor(opts = {}) { Object.assign(this, opts); this.emissive = { setHex() {} }; } dispose() {} },
  MeshBasicMaterial: class { constructor(opts = {}) { Object.assign(this, opts); } dispose() {} },
  Mesh: class {
    constructor(geo, mat) {
      this.geometry = geo;
      this.material = mat;
      this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy(p) { Object.assign(this, p); }, clone() { return { ...this }; } };
      this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy(r) { Object.assign(this, r); }, clone() { return { ...this }; } };
      this.scale = { x: 1, y: 1, z: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z; }, copy(s) { Object.assign(this, s); }, clone() { return { ...this }; } };
      this.quaternion = { x: 0, y: 0, z: 0, w: 1, copy(q) { Object.assign(this, q); }, clone() { return { ...this }; } };
      this.children = [];
      this.visible = true;
    }
    add(o) { if (o) this.children.push(o); }
    remove(o) { this.children = this.children.filter(c => c !== o); }
    clone() {
      const m = new global.THREE.Mesh(this.geometry, this.material);
      m.position.copy(this.position);
      m.rotation.copy(this.rotation);
      m.scale.copy(this.scale);
      m.visible = this.visible;
      return m;
    }
    traverse(fn) {
      fn(this);
      this.children.forEach(c => { if (c && c.traverse) c.traverse(fn); else fn(c); });
    }
  },
  CylinderGeometry: class { rotateX() {} dispose() {} },
  ConeGeometry: class { rotateX() {} dispose() {} },
  BoxGeometry: class { rotateX() {} dispose() {} },
  TorusGeometry: class { rotateX() {} dispose() {} },
  SphereGeometry: class { rotateX() {} dispose() {} },
  CircleGeometry: class { rotateX() {} dispose() {} },
  RingGeometry: class { rotateX() {} dispose() {} },
  OctahedronGeometry: class { rotateX() {} dispose() {} },
  BufferGeometry: class { setAttribute() {} rotateX() {} dispose() {} },
  BufferAttribute: class {},
  PointsMaterial: class { dispose() {} },
  Points: class { constructor() { this.visible = true; } },
  FogExp2: class {},
  BackSide: 2,
  DoubleSide: 2
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

console.log("\n🚀 === Multiplication Rocket Lab 3.0 Automated CLI Test Suite ===\n");

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
