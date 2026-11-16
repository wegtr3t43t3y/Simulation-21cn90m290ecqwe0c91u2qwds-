import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const $ = (selector) => document.querySelector(selector);
const root = $('#scene-root');
const ranges = {
  temperature: $('#tempRange'),
  agitation: $('#stirRange'),
  catalyst: $('#catalystRange'),
};
const presets = {
  synthesis: { name: 'Synthesis', desc: 'Molecular assembly is proceeding with high-energy transfer and stable output.', values: [72, 68, 46], colors: ['#64d6ff', '#7ef0c5', '#8a7cff'] },
  crystal: { name: 'Crystallization', desc: 'Particle ordering is accelerating as ordered lattices nucleate and expand.', values: [48, 42, 58], colors: ['#75e3ff', '#d9d0ff', '#9de9cd'] },
  combustion: { name: 'Combustion', desc: 'Rapid oxidation is producing luminous, high-velocity reaction fronts.', values: [89, 74, 34], colors: ['#ffbf69', '#ff7d5c', '#ff6d72'] },
  catalytic: { name: 'Catalytic', desc: 'The catalyst is lowering activation energy while maintaining sustained orbital flow.', values: [64, 58, 82], colors: ['#7ef0c5', '#64d6ff', '#d4b8ff'] },
};
let activePreset = 'synthesis';
let paused = false;
let scene, camera, renderer, controls, particles, fluid, fluidGlow;

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#06151e');
  scene.fog = new THREE.Fog('#06151e', 20, 42);
  camera = new THREE.PerspectiveCamera(45, root.clientWidth / root.clientHeight, 0.1, 100);
  camera.position.set(9, 7, 11);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(root.clientWidth, root.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  root.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 7;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 2.2, 0);

  scene.add(new THREE.HemisphereLight(0xbcd9ff, 0x10212a, 2));
  const key = new THREE.DirectionalLight(0xc7eeff, 2.5);
  key.position.set(6, 11, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x64d6ff, 35, 22);
  rim.position.set(-5, 6, 2);
  scene.add(rim);

  const standard = (color, metalness = 0.25, roughness = 0.7) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.8, 64), standard('#102c39', 0.35, 0.8));
  floor.position.y = -0.65;
  scene.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(11, 0.08, 10, 100), new THREE.MeshBasicMaterial({ color: '#64d6ff', transparent: true, opacity: 0.35 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.18;
  scene.add(ring);

  const wallMaterial = standard('#0b202b', 0.15, 0.95);
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 0.4), wallMaterial);
  backWall.position.set(0, 3.8, -8);
  scene.add(backWall);
  const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9, 16), wallMaterial);
  sideWall.position.set(-8.8, 3.8, 0);
  scene.add(sideWall, sideWall.clone());
  scene.children[scene.children.length - 1].position.x = 8.8;

  const benchMat = standard('#294653', 0.35, 0.75);
  for (const x of [-4.3, 4.3]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.35, 1.5), benchMat);
    bench.position.set(x, 1.25, 4.3);
    scene.add(bench);
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.8, 1.4), standard('#1b3341', 0.4));
    cabinet.position.set(x, 0.15, 4.3);
    scene.add(cabinet);
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.16), new THREE.MeshStandardMaterial({ color: '#102d3a', emissive: '#1686b3', emissiveIntensity: 1.2 }));
    monitor.position.set(x, 2.1, 4.3);
    scene.add(monitor);
  }

  const shelfMat = standard('#304b5a', 0.45);
  for (const x of [-4.1, 4.1]) {
    for (const y of [2.4, 3.25]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 0.75), shelfMat);
      shelf.position.set(x, y, -2.3);
      scene.add(shelf);
    }
  }

  const vessel = new THREE.Group();
  scene.add(vessel);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 2.6, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: '#a7ddff', transmission: 0.6, transparent: true, opacity: 0.3, roughness: 0.18, side: THREE.DoubleSide, thickness: 0.5 }));
  glass.position.y = 2.4;
  vessel.add(glass);
  fluid = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.5, 48), new THREE.MeshStandardMaterial({ color: '#64d6ff', emissive: '#64d6ff', emissiveIntensity: 0.8, transparent: true, opacity: 0.86, roughness: 0.2 }));
  fluid.position.y = 1.75;
  vessel.add(fluid);
  fluidGlow = new THREE.PointLight('#64d6ff', 22, 8);
  fluidGlow.position.set(0, 2.1, 0);
  vessel.add(fluidGlow);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.55, 32), standard('#506a78', 0.6, 0.4));
  base.position.y = 0.55;
  vessel.add(base);
  for (const x of [-2.2, 2.2]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.7, 16), standard('#426273', 0.65, 0.3));
    pipe.rotation.z = Math.PI / 2.1;
    pipe.position.set(x, 2.1, x < 0 ? 0.4 : -0.4);
    scene.add(pipe);
  }

  const count = 500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.35 + Math.random() * 1.05;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 1.2 + Math.random() * 1.1;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    const color = new THREE.Color(presets.synthesis.colors[i % 3]);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particles = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(particles);
}

function updateMetrics() {
  const [temp, agitation, catalyst] = [Number(ranges.temperature.value), Number(ranges.agitation.value), Number(ranges.catalyst.value)];
  const pressure = (temp / 42 + agitation / 76 + catalyst / 68) / 1.5;
  const yieldPercent = (temp * 0.4 + agitation * 0.28 + catalyst * 0.32) / 1.8;
  $('#pressureValue').textContent = `${pressure.toFixed(1)} bar`;
  $('#yieldValue').textContent = `${yieldPercent.toFixed(1)}%`;
  if (fluid) {
    const hue = 0.55 + (temp / 100) * 0.28 + (catalyst / 100) * 0.12;
    const color = new THREE.Color().setHSL(hue, 0.78, 0.6);
    fluid.material.color.copy(color);
    fluid.material.emissive.copy(color);
    fluidGlow.color.copy(color);
    fluidGlow.intensity = 12 + catalyst * 0.18;
  }
}

function setPreset(key) {
  const preset = presets[key];
  if (!preset) return;
  activePreset = key;
  [ranges.temperature.value, ranges.agitation.value, ranges.catalyst.value] = preset.values;
  $('#reactionTitle').textContent = preset.name;
  $('#reactionDesc').textContent = preset.desc;
  document.querySelectorAll('.reaction-btn').forEach((button) => button.classList.toggle('active', button.dataset.preset === key));
  const colors = particles.geometry.attributes.color.array;
  for (let i = 0; i < colors.length / 3; i++) {
    const c = new THREE.Color(preset.colors[i % preset.colors.length]);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  particles.geometry.attributes.color.needsUpdate = true;
  updateMetrics();
}

function animate() {
  requestAnimationFrame(animate);
  if (!paused && particles) {
    const positions = particles.geometry.attributes.position.array;
    const speed = 0.0007 + Number(ranges.agitation.value) * 0.000012;
    const heat = Number(ranges.temperature.value);
    for (let i = 0; i < positions.length; i += 3) {
      const angle = performance.now() * speed + i * 0.12;
      positions[i] += Math.cos(angle) * 0.002;
      positions[i + 2] += Math.sin(angle) * 0.002;
      positions[i + 1] += Math.sin(angle * 1.4) * 0.0015 + (heat - 50) * 0.000001;
      if (positions[i + 1] > 2.7) positions[i + 1] = 1.25;
      if (positions[i + 1] < 1.2) positions[i + 1] = 2.65;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y += speed * 1.2;
    fluid.scale.y = 1 + Math.sin(performance.now() * 0.003) * 0.08;
  }
  controls.update();
  renderer.render(scene, camera);
}

for (const range of Object.values(ranges)) range.addEventListener('input', updateMetrics);
document.querySelectorAll('.reaction-btn').forEach((button) => button.addEventListener('click', () => setPreset(button.dataset.preset)));
document.querySelectorAll('.tool-card').forEach((card) => card.addEventListener('click', () => {
  document.querySelectorAll('.tool-card').forEach((item) => item.classList.toggle('active', item === card));
}));
$('#toggleScene').addEventListener('click', (event) => {
  paused = !paused;
  event.currentTarget.textContent = paused ? 'Resume' : 'Pause';
});
window.addEventListener('resize', () => {
  camera.aspect = root.clientWidth / root.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(root.clientWidth, root.clientHeight);
});

initScene();
setPreset(activePreset);
animate();
