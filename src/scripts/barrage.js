const barrageContainer = document.getElementById('barrage-physics');
const blogStage = document.getElementById('blog-stage');
const barrageReplay = document.getElementById('barrage-replay');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const messages = [
  '月色很好', '正在施工', '听歌时间', '欢迎光临', '灵感掉落', '记录生活', '随手记', '摸鱼中',
  '别急，慢慢来', '朋友来过', '芙宁娜', '晚安', '好奇心', '今日份开心', '水月のblog', '喵？',
  '发呆五分钟', '收藏此刻', '今天也要开心', '灵感加载中', '夜猫子', '再看一集', '发呆也是正事',
  '小站施工队', '来杯可乐', '收藏快乐', '保持好奇', '水神巡演', '摸鱼批准', '下次见'
];
const tones = ['blue', 'pink', 'mint', 'yellow', 'violet'];
let bodies = [];
let frame = 0;
let started = false;
let visible = false;
let lastTime = 0;
let elapsed = 0;
let motionOverride = false;
const motionEnabled = () => !prefersReducedMotion || motionOverride;

if (barrageReplay && prefersReducedMotion) barrageReplay.textContent = '播放弹幕';

function createBodies() {
  if (!barrageContainer || started) return;
  started = true;
  const width = barrageContainer.clientWidth;
  const selected = window.innerWidth < 700 ? messages.slice(0, 16) : messages;
  bodies = selected.map((message, index) => {
    const element = document.createElement('span');
    element.className = 'barrage-pill';
    element.dataset.tone = tones[index % tones.length];
    element.textContent = message;
    barrageContainer.append(element);
    const body = {
      element, x: 14 + Math.random() * Math.max(1, width - element.offsetWidth - 28),
      y: -element.offsetHeight - 8, width: element.offsetWidth, height: element.offsetHeight,
      vx: (Math.random() - 0.5) * 76, vy: 0, angle: (Math.random() - 0.5) * 20,
      angularVelocity: (Math.random() - 0.5) * 48, dropAt: index * 125 + Math.random() * 150, active: false
    };
    element.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.angle}deg)`;
    return body;
  });
  if (!motionEnabled()) {
    const height = barrageContainer.clientHeight;
    bodies.forEach((body, index) => {
      const columns = window.innerWidth < 700 ? 3 : 6;
      const column = index % columns;
      const row = Math.floor(index / columns);
      body.x = 12 + column * ((width - body.width - 24) / Math.max(1, columns - 1));
      body.y = Math.max(74, height - body.height - 50 - row * 48);
      body.active = true;
      body.element.classList.add('is-active');
      body.element.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.angle * 0.35}deg)`;
    });
  }
}

function constrain(body, width, floor) {
  if (body.x < 8) { body.x = 8; body.vx = Math.abs(body.vx) * 0.5; }
  else if (body.x + body.width > width - 8) { body.x = width - body.width - 8; body.vx = -Math.abs(body.vx) * 0.5; }
  if (body.y + body.height > floor) {
    body.y = floor - body.height;
    body.vy = Math.abs(body.vy) < 34 ? 0 : -Math.abs(body.vy) * 0.28;
    body.vx *= 0.96;
    body.angularVelocity *= 0.88;
  }
}

function resolveCollisions(width, floor) {
  for (let pass = 0; pass < 5; pass += 1) {
    for (let i = 0; i < bodies.length; i += 1) {
      const a = bodies[i];
      if (!a.active) continue;
      for (let j = i + 1; j < bodies.length; j += 1) {
        const b = bodies[j];
        if (!b.active) continue;
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        if (overlapX < overlapY) {
          const normal = a.x + a.width / 2 < b.x + b.width / 2 ? 1 : -1;
          a.x -= normal * overlapX * 0.51;
          b.x += normal * overlapX * 0.51;
          const velocity = (b.vx - a.vx) * normal;
          if (velocity < 0) { const impulse = -velocity * 0.68; a.vx -= impulse * normal; b.vx += impulse * normal; }
        } else {
          const normal = a.y + a.height / 2 < b.y + b.height / 2 ? 1 : -1;
          a.y -= normal * overlapY * 0.51;
          b.y += normal * overlapY * 0.51;
          const velocity = (b.vy - a.vy) * normal;
          if (velocity < 0) { const impulse = -velocity * 0.58; a.vy -= impulse * normal; b.vy += impulse * normal; }
          a.vx *= 0.985; b.vx *= 0.985;
        }
        a.angularVelocity += (b.vx - a.vx) * 0.035;
        b.angularVelocity -= (b.vx - a.vx) * 0.035;
      }
    }
    bodies.forEach((body) => { if (body.active) constrain(body, width, floor); });
  }
}

function run(timestamp) {
  if (!visible || !motionEnabled() || !barrageContainer) return;
  const delta = Math.min(0.032, Math.max(0.008, (timestamp - lastTime) / 1000 || 0.016));
  lastTime = timestamp;
  const width = barrageContainer.clientWidth;
  const floor = barrageContainer.clientHeight - 42;
  const steps = delta > 0.02 ? 2 : 1;
  const step = delta / steps;
  elapsed += delta * 1000;
  bodies.forEach((body) => {
    if (!body.active && elapsed >= body.dropAt) { body.active = true; body.element.classList.add('is-active'); }
  });
  for (let substep = 0; substep < steps; substep += 1) {
    bodies.forEach((body) => {
      if (!body.active) return;
      body.vy += 880 * step;
      body.x += body.vx * step;
      body.y += body.vy * step;
      body.angle += body.angularVelocity * step;
      constrain(body, width, floor);
    });
    resolveCollisions(width, floor);
  }
  bodies.forEach((body) => { body.element.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.angle}deg)`; });
  frame = requestAnimationFrame(run);
}

if (blogStage && barrageContainer) {
  new IntersectionObserver((entries) => entries.forEach((entry) => {
    visible = entry.isIntersecting;
    if (visible) {
      createBodies();
      if (motionEnabled()) { cancelAnimationFrame(frame); lastTime = performance.now(); frame = requestAnimationFrame(run); }
    } else cancelAnimationFrame(frame);
  }), { threshold: 0.25 }).observe(blogStage);
}

barrageReplay?.addEventListener('click', () => {
  if (!barrageContainer) return;
  barrageReplay.textContent = '重放弹幕';
  cancelAnimationFrame(frame);
  motionOverride = true;
  elapsed = 0;
  bodies = [];
  started = false;
  visible = true;
  barrageContainer.replaceChildren();
  createBodies();
  lastTime = performance.now();
  frame = requestAnimationFrame(run);
});

window.addEventListener('resize', () => {
  if (!barrageContainer || !bodies.length) return;
  const width = barrageContainer.clientWidth;
  const floor = barrageContainer.clientHeight - 42;
  bodies.forEach((body) => {
    body.x = Math.max(8, Math.min(body.x, width - body.width - 8));
    body.y = Math.min(body.y, floor - body.height);
  });
});
