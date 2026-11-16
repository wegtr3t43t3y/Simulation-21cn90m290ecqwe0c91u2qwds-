const labScene = document.getElementById('labScene');
const tempRange = document.getElementById('tempRange');
const stirRange = document.getElementById('stirRange');
const catalystRange = document.getElementById('catalystRange');
const pressureValue = document.getElementById('pressureValue');
const yieldValue = document.getElementById('yieldValue');
const reactionTitle = document.getElementById('reactionTitle');
const reactionDesc = document.getElementById('reactionDesc');
const toggleSceneBtn = document.getElementById('toggleScene');
const canvas = document.getElementById('reactionCanvas');
const ctx = canvas.getContext('2d');
const toolCards = document.querySelectorAll('.tool-card');
const reactionButtons = document.querySelectorAll('.reaction-btn');

const presets = {
  synthesis: {
    name: 'Synthesis',
    desc: 'Molecular assembly is proceeding with high-energy transfer and stable output.',
    temperature: 72,
    agitation: 68,
    catalyst: 46,
    colors: ['#64d6ff', '#7ef0c5', '#8a7cff'],
    glow: 'rgba(100,214,255,0.55)'
  },
  crystal: {
    name: 'Crystallization',
    desc: 'Particle ordering is accelerating as ordered lattices nucleate and expand.',
    temperature: 48,
    agitation: 42,
    catalyst: 58,
    colors: ['#75e3ff', '#d9d0ff', '#9de9cd'],
    glow: 'rgba(117,227,255,0.5)'
  },
  combustion: {
    name: 'Combustion',
    desc: 'Rapid oxidation is producing luminous, high-velocity reaction fronts.',
    temperature: 89,
    agitation: 74,
    catalyst: 34,
    colors: ['#ffbf69', '#ff7d5c', '#ff6d72'],
    glow: 'rgba(255,166,92,0.5)'
  },
  catalytic: {
    name: 'Catalytic',
    desc: 'The catalyst is lowering activation energy while maintaining sustained orbital flow.',
    temperature: 64,
    agitation: 58,
    catalyst: 82,
    colors: ['#7ef0c5', '#64d6ff', '#c7a9ff'],
    glow: 'rgba(126,240,197,0.5)'
  }
};

let currentPreset = 'synthesis';
let animationPaused = false;
let particles = [];
let pointerX = 0;
let pointerY = 0;

function setPreset(presetKey) {
  const preset = presets[presetKey];
  if (!preset) return;

  currentPreset = presetKey;
  tempRange.value = preset.temperature;
  stirRange.value = preset.agitation;
  catalystRange.value = preset.catalyst;

  reactionTitle.textContent = preset.name;
  reactionDesc.textContent = preset.desc;

  document.documentElement.style.setProperty('--reaction-color-1', preset.colors[0]);
  document.documentElement.style.setProperty('--reaction-color-2', preset.colors[1]);
  document.documentElement.style.setProperty('--reaction-color-3', preset.colors[2]);
  document.documentElement.style.setProperty('--ambient-glow', preset.glow);

  reactionButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.preset === presetKey);
  });

  updateMetrics();
  ensureParticleState();
}

function updateMetrics() {
  const temp = Number(tempRange.value);
  const stir = Number(stirRange.value);
  const catalyst = Number(catalystRange.value);

  const pressure = (temp / 42 + stir / 76 + catalyst / 68) / 1.5;
  const yield = (temp * 0.4 + stir * 0.28 + catalyst * 0.32) / 1.8;

  pressureValue.textContent = `${pressure.toFixed(1)} bar`;
  yieldValue.textContent = `${yield.toFixed(1)}%`;

  const liquid = document.querySelector('.liquid-surface');
  if (liquid) {
    liquid.style.filter = `hue-rotate(${temp * 1.4}deg) saturate(${1 + catalyst / 100})`;
    liquid.style.opacity = `${0.6 + catalyst / 160}`;
  }
}

function ensureParticleState() {
  const base = presets[currentPreset];
  particles = [];
  const count = 68 + Math.round(base.temperature / 2);

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.8,
      radius: 1.8 + Math.random() * 4,
      life: 1,
      color: base.colors[Math.floor(Math.random() * base.colors.length)]
    });
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawReaction() {
  if (animationPaused) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const temp = Number(tempRange.value);
  const stir = Number(stirRange.value);
  const catalyst = Number(catalystRange.value);
  const base = presets[currentPreset];

  ctx.clearRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.52, h * 0.5, 10, w * 0.52, h * 0.5, w * 0.52);
  glow.addColorStop(0, base.colors[0] + '66');
  glow.addColorStop(0.35, base.colors[1] + '44');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const centerX = w * 0.52;
  const centerY = h * 0.66;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    p.x += p.vx + ((stir - 50) / 2000) + Math.sin(i + performance.now() * 0.001) * 0.02;
    p.y += p.vy + ((temp - 50) / 3000) - (catalyst / 4000);

    if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) {
      p.x = 0.2 + Math.random() * 0.6;
      p.y = 0.2 + Math.random() * 0.6;
    }

    const px = centerX + (p.x - 0.5) * w * 0.8;
    const py = centerY + (p.y - 0.5) * h * 0.8;

    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = p.color;
    ctx.arc(px, py, p.radius + (temp / 90), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const wave = 0.5 + Math.sin(performance.now() * 0.003) * 0.08;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + 44, 88, 34 * wave, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 92, 0.35 * Math.PI, 1.65 * Math.PI);
  ctx.stroke();
}

function animate() {
  if (!animationPaused) {
    drawReaction();
  }
  requestAnimationFrame(animate);
}

function setupInteractions() {
  tempRange.addEventListener('input', updateMetrics);
  stirRange.addEventListener('input', updateMetrics);
  catalystRange.addEventListener('input', updateMetrics);

  toolCards.forEach((card) => {
    card.addEventListener('click', () => {
      toolCards.forEach((item) => item.classList.toggle('active', item === card));
    });
  });

  reactionButtons.forEach((button) => {
    button.addEventListener('click', () => setPreset(button.dataset.preset));
  });

  toggleSceneBtn.addEventListener('click', () => {
    animationPaused = !animationPaused;
    toggleSceneBtn.textContent = animationPaused ? 'Resume' : 'Pause';
    if (!animationPaused) drawReaction();
  });

  window.addEventListener('pointermove', (event) => {
    const { innerWidth, innerHeight } = window;
    const normalizedX = (event.clientX / innerWidth - 0.5) * 2;
    const normalizedY = (event.clientY / innerHeight - 0.5) * 2;

    pointerX = normalizedX * 10;
    pointerY = normalizedY * 8;
    labScene.style.setProperty('--rotate-x', `${-12 + pointerY * -0.8}deg`);
    labScene.style.setProperty('--rotate-y', `${18 + pointerX}deg`);
  });

  window.addEventListener('resize', resizeCanvas);
}

function init() {
  resizeCanvas();
  setPreset(currentPreset);
  setupInteractions();
  requestAnimationFrame(animate);
}

init();
