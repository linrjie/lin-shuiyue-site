const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const clock = document.getElementById('clock');
const calendar = document.getElementById('calendar');

function updateClock() {
  const now = new Date();
  if (clock) {
    const clockText = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(now);
    clock.textContent = clockText;
    clock.dateTime = now.toISOString();
  }

  if (calendar) {
    const solar = new Intl.DateTimeFormat('zh-CN', {
      month: 'long', day: 'numeric', weekday: 'long'
    }).format(now);
    let lunar = '';
    try {
      lunar = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
        month: 'long', day: 'numeric'
      }).format(now);
    } catch {
      lunar = '';
    }
    calendar.textContent = lunar ? `${solar} · 农历${lunar}` : solar;
  }
}

updateClock();
setInterval(updateClock, 1000);

const themeToggle = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeKey = 'lin-shuiyue-theme';

function applyTheme(theme) {
  const isNight = theme === 'night';
  document.documentElement.dataset.theme = isNight ? 'night' : 'day';
  themeToggle?.setAttribute('aria-pressed', String(isNight));
  if (themeToggle) themeToggle.textContent = isNight ? '昼' : '夜';
  themeMeta?.setAttribute('content', isNight ? '#171923' : '#f5f0e8');
}

let savedTheme = null;
try {
  savedTheme = localStorage.getItem(themeKey);
} catch {
  savedTheme = null;
}
applyTheme(savedTheme === 'night' ? 'night' : 'day');

themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'night' ? 'day' : 'night';
  applyTheme(nextTheme);
  try {
    localStorage.setItem(themeKey, nextTheme);
  } catch {
    // 隐私模式禁止本地存储时，主题仍可在当前页面生效。
  }
});

const animatedElements = document.querySelectorAll('.project-card, .about-copy');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  animatedElements.forEach((element) => {
    element.classList.add('will-animate');
    observer.observe(element);
  });
}

const style = document.createElement('style');
style.textContent = '.will-animate{opacity:0;transform:translateY(28px);transition:opacity .6s ease,transform .6s ease}.visible{opacity:1;transform:translateY(0)}';
document.head.appendChild(style);

const guestbookForm = document.getElementById('guestbook-form');
const guestbookList = document.getElementById('guestbook-list');
const storageKey = 'lin-shuiyue-guestbook';

function readMessages() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function renderMessages() {
  if (!guestbookList) return;
  const messages = readMessages();
  guestbookList.replaceChildren();

  messages.forEach(({ name, message, date }) => {
    const card = document.createElement('article');
    card.className = 'guest-message';
    const author = document.createElement('strong');
    const content = document.createElement('p');
    const time = document.createElement('small');
    author.textContent = name;
    content.textContent = message;
    time.textContent = date;
    card.append(author, content, time);
    guestbookList.append(card);
  });
}

guestbookForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(guestbookForm);
  const message = String(data.get('message') || '').trim();
  if (!message) return;

  const messages = readMessages();
  messages.unshift({
    name: String(data.get('name') || '').trim() || '一位神秘朋友',
    message,
    date: new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date())
  });
  localStorage.setItem(storageKey, JSON.stringify(messages.slice(0, 12)));
  guestbookForm.reset();
  renderMessages();
});

renderMessages();

const pet = document.getElementById('site-pet');
const petSpeech = document.getElementById('pet-speech');
const petStatus = document.getElementById('pet-status');
const petConsole = document.getElementById('pet-console');
const consoleHandle = document.getElementById('console-handle');
const petSize = document.getElementById('pet-size');
const petPositionKey = 'lin-shuiyue-pet-position';
const petSizeKey = 'lin-shuiyue-pet-size';
const petLines = [
  '哼哼，正义的神明登场！',
  '今天也要优雅地生活哦。',
  '你是在召唤我吗？',
  '掌声在哪里？',
  '这片月色，勉强配得上我的舞台。',
  '别只顾着看，陪我逛逛嘛！'
];
let speechTimer = 0;
let dragState = null;

function showPetSpeech(line) {
  if (!pet || !petSpeech) return;
  petSpeech.textContent = line || petLines[Math.floor(Math.random() * petLines.length)];
  petSpeech.classList.add('is-visible');
  pet.classList.remove('is-reacting');
  void pet.offsetWidth;
  pet.classList.add('is-reacting');
  if (petStatus) petStatus.textContent = petSpeech.textContent;
  window.clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => petSpeech.classList.remove('is-visible'), 3200);
}

function clampPetPosition(left, top) {
  if (!pet) return { left, top };
  const width = pet.offsetWidth;
  const height = pet.offsetHeight;
  return {
    left: Math.max(0, Math.min(left, window.innerWidth - width)),
    top: Math.max(0, Math.min(top, window.innerHeight - height))
  };
}

function setPetPosition(left, top, save = true) {
  if (!pet) return;
  const next = clampPetPosition(left, top);
  pet.style.left = `${next.left}px`;
  pet.style.top = `${next.top}px`;
  pet.style.right = 'auto';
  pet.style.bottom = 'auto';
  if (save) {
    try {
      localStorage.setItem(petPositionKey, JSON.stringify({
        x: next.left / Math.max(1, window.innerWidth - pet.offsetWidth),
        y: next.top / Math.max(1, window.innerHeight - pet.offsetHeight)
      }));
    } catch {
      // 本地存储不可用时，拖动功能仍然正常。
    }
  }
}

function resetPetPosition() {
  if (!pet) return;
  setPetPosition(window.innerWidth - pet.offsetWidth - 24, window.innerHeight - pet.offsetHeight - 12);
  showPetSpeech('我回到最适合登场的位置啦！');
}

function restorePetSettings() {
  if (!pet) return;
  try {
    const size = Number(localStorage.getItem(petSizeKey));
    if (size >= 110 && size <= 240) {
      pet.style.width = `${size}px`;
      if (petSize) petSize.value = String(size);
    }
    const saved = JSON.parse(localStorage.getItem(petPositionKey));
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      requestAnimationFrame(() => setPetPosition(
        saved.x * Math.max(1, window.innerWidth - pet.offsetWidth),
        saved.y * Math.max(1, window.innerHeight - pet.offsetHeight),
        false
      ));
    }
  } catch {
    // 使用默认状态。
  }
}

pet?.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  const rect = pet.getBoundingClientRect();
  dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
  pet.setPointerCapture(event.pointerId);
  event.preventDefault();
});

pet?.addEventListener('pointermove', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  if (Math.hypot(dx, dy) > 5) dragState.moved = true;
  setPetPosition(dragState.left + dx, dragState.top + dy, false);
});

pet?.addEventListener('pointerup', (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  const wasMoved = dragState.moved;
  const rect = pet.getBoundingClientRect();
  dragState = null;
  pet.releasePointerCapture(event.pointerId);
  setPetPosition(rect.left, rect.top, true);
  if (!wasMoved) showPetSpeech();
});

pet?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    showPetSpeech();
  }
});

consoleHandle?.addEventListener('click', () => {
  const open = petConsole?.classList.toggle('is-open') || false;
  consoleHandle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('[data-pet-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.petAction;
    if (action === 'speak') showPetSpeech();
    if (action === 'reset') resetPetPosition();
    if (action === 'wander' && pet) {
      pet.classList.add('is-wandering');
      setPetPosition(
        Math.random() * Math.max(1, window.innerWidth - pet.offsetWidth),
        Math.random() * Math.max(1, window.innerHeight - pet.offsetHeight)
      );
      showPetSpeech('换个地方继续我的巡演！');
      window.setTimeout(() => pet.classList.remove('is-wandering'), 550);
    }
    if (action === 'toggle' && pet) {
      const hidden = pet.classList.toggle('is-hidden');
      button.textContent = hidden ? '召唤回来' : '暂时隐藏';
      if (petStatus) petStatus.textContent = hidden ? '芙宁娜暂时退场了。' : '芙宁娜重新登场！';
      if (!hidden) showPetSpeech('华丽回归！有没有想我？');
    }
  });
});

petSize?.addEventListener('input', () => {
  if (!pet) return;
  pet.style.width = `${petSize.value}px`;
  const rect = pet.getBoundingClientRect();
  setPetPosition(rect.left, rect.top);
  try {
    localStorage.setItem(petSizeKey, petSize.value);
  } catch {
    // 忽略存储失败。
  }
});

window.addEventListener('resize', () => {
  if (!pet || pet.classList.contains('is-hidden')) return;
  const rect = pet.getBoundingClientRect();
  setPetPosition(rect.left, rect.top, false);
});

restorePetSettings();
window.setTimeout(() => petSpeech?.classList.remove('is-visible'), 3600);

const audio = document.getElementById('pet-audio');
const musicConsole = document.querySelector('.music-console');
const musicTitle = document.getElementById('music-title');
const musicPlay = document.getElementById('music-play');
const musicPrev = document.getElementById('music-prev');
const musicNext = document.getElementById('music-next');
const musicProgress = document.getElementById('music-progress');
const musicCurrent = document.getElementById('music-current');
const musicDuration = document.getElementById('music-duration');
const musicVolume = document.getElementById('music-volume');
const musicStateKey = 'lin-shuiyue-music';
const musicTracks = [
  { title: '月下漫游', src: 'assets/music/moonwalk.wav' },
  { title: '水色剧场', src: 'assets/music/aqua-theatre.wav' },
  { title: '星海晚安', src: 'assets/music/starlight-goodnight.wav' }
];
let musicIndex = 0;

function formatAudioTime(value) {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function saveMusicState() {
  if (!audio) return;
  try {
    localStorage.setItem(musicStateKey, JSON.stringify({ index: musicIndex, volume: audio.volume }));
  } catch {
    // 本地存储不可用时继续播放，但不记忆设置。
  }
}

function loadMusicTrack(index, autoplay = false) {
  if (!audio) return;
  musicIndex = (index + musicTracks.length) % musicTracks.length;
  const track = musicTracks[musicIndex];
  audio.src = track.src;
  audio.load();
  if (musicTitle) musicTitle.textContent = track.title;
  if (musicProgress) musicProgress.value = '0';
  if (musicCurrent) musicCurrent.textContent = '0:00';
  saveMusicState();
  if (autoplay) audio.play().catch(() => {});
}

if (audio) audio.volume = 0.55;
try {
  const savedMusic = JSON.parse(localStorage.getItem(musicStateKey));
  if (savedMusic && Number.isInteger(savedMusic.index)) musicIndex = savedMusic.index;
  if (audio && savedMusic && Number.isFinite(savedMusic.volume)) audio.volume = Math.max(0, Math.min(1, savedMusic.volume));
} catch {
  // 使用默认曲目和音量。
}
if (musicVolume && audio) musicVolume.value = String(audio.volume);
loadMusicTrack(musicIndex);

musicPlay?.addEventListener('click', () => {
  if (!audio) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
});

musicPrev?.addEventListener('click', () => loadMusicTrack(musicIndex - 1, !audio?.paused));
musicNext?.addEventListener('click', () => loadMusicTrack(musicIndex + 1, !audio?.paused));

audio?.addEventListener('play', () => {
  if (musicPlay) {
    musicPlay.textContent = 'Ⅱ';
    musicPlay.setAttribute('aria-label', '暂停');
  }
  musicConsole?.classList.add('is-playing');
});

audio?.addEventListener('pause', () => {
  if (musicPlay) {
    musicPlay.textContent = '▶';
    musicPlay.setAttribute('aria-label', '播放');
  }
  musicConsole?.classList.remove('is-playing');
});

audio?.addEventListener('loadedmetadata', () => {
  if (musicProgress) musicProgress.max = String(audio.duration || 48);
  if (musicDuration) musicDuration.textContent = formatAudioTime(audio.duration || 48);
});

audio?.addEventListener('timeupdate', () => {
  if (musicProgress && document.activeElement !== musicProgress) musicProgress.value = String(audio.currentTime);
  if (musicCurrent) musicCurrent.textContent = formatAudioTime(audio.currentTime);
});

audio?.addEventListener('ended', () => loadMusicTrack(musicIndex + 1, true));

musicProgress?.addEventListener('input', () => {
  if (!audio || audio.readyState === 0) return;
  audio.currentTime = Number(musicProgress.value);
  if (musicCurrent) musicCurrent.textContent = formatAudioTime(audio.currentTime);
});

musicVolume?.addEventListener('input', () => {
  if (!audio) return;
  audio.volume = Number(musicVolume.value);
  saveMusicState();
});

const siteHeader = document.querySelector('.site-header');
const navPeek = document.getElementById('nav-peek');

navPeek?.addEventListener('click', () => {
  const expanded = siteHeader?.classList.toggle('is-expanded') || false;
  navPeek.setAttribute('aria-expanded', String(expanded));
});

siteHeader?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteHeader.classList.remove('is-expanded');
    navPeek?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('pointerdown', (event) => {
  if (!siteHeader?.classList.contains('is-expanded') || siteHeader.contains(event.target)) return;
  siteHeader.classList.remove('is-expanded');
  navPeek?.setAttribute('aria-expanded', 'false');
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  siteHeader?.classList.remove('is-expanded');
  navPeek?.setAttribute('aria-expanded', 'false');
});

const barrageContainer = document.getElementById('barrage-physics');
const blogStage = document.getElementById('blog-stage');
const barrageMessages = [
  '月色很好', '正在施工', '听歌时间', '欢迎光临',
  '灵感掉落', '记录生活', '随手记', '摸鱼中',
  '别急，慢慢来', '朋友来过', '芙宁娜', '晚安',
  '好奇心', '今日份开心', '水月のblog', '喵？',
  '发呆五分钟', '收藏此刻'
];
const barrageTones = ['blue', 'pink', 'mint', 'yellow', 'violet'];
let barrageBodies = [];
let barrageFrame = 0;
let barrageStarted = false;
let barrageVisible = false;
let lastPhysicsTime = 0;

function createBarrageBodies() {
  if (!barrageContainer || barrageStarted) return;
  barrageStarted = true;
  const width = barrageContainer.clientWidth;

  barrageBodies = barrageMessages.map((message, index) => {
    const element = document.createElement('span');
    element.className = 'barrage-pill';
    element.dataset.tone = barrageTones[index % barrageTones.length];
    element.textContent = message;
    barrageContainer.append(element);
    const bodyWidth = element.offsetWidth;
    const bodyHeight = element.offsetHeight;
    const x = 14 + Math.random() * Math.max(1, width - bodyWidth - 28);
    const y = -bodyHeight - index * (34 + Math.random() * 24);
    return {
      element,
      x,
      y,
      width: bodyWidth,
      height: bodyHeight,
      vx: (Math.random() - 0.5) * 100,
      vy: Math.random() * 30,
      angle: (Math.random() - 0.5) * 20,
      angularVelocity: (Math.random() - 0.5) * 60
    };
  });

  if (prefersReducedMotion) {
    const height = barrageContainer.clientHeight;
    barrageBodies.forEach((body, index) => {
      const columns = window.innerWidth < 700 ? 3 : 6;
      const column = index % columns;
      const row = Math.floor(index / columns);
      body.x = 12 + column * ((width - body.width - 24) / Math.max(1, columns - 1));
      body.y = Math.min(height - body.height - 50, 95 + row * 58);
      body.element.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.angle * 0.35}deg)`;
    });
  }
}

function resolveBarrageCollisions() {
  for (let i = 0; i < barrageBodies.length; i += 1) {
    const a = barrageBodies[i];
    for (let j = i + 1; j < barrageBodies.length; j += 1) {
      const b = barrageBodies[j];
      const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (overlapX <= 0 || overlapY <= 0) continue;

      if (overlapX < overlapY) {
        const aLeft = a.x + a.width / 2 < b.x + b.width / 2;
        const direction = aLeft ? -1 : 1;
        a.x += direction * overlapX * 0.5;
        b.x -= direction * overlapX * 0.5;
        const velocity = a.vx;
        a.vx = b.vx * 0.7;
        b.vx = velocity * 0.7;
      } else {
        const aAbove = a.y + a.height / 2 < b.y + b.height / 2;
        const direction = aAbove ? -1 : 1;
        a.y += direction * overlapY * 0.5;
        b.y -= direction * overlapY * 0.5;
        const velocity = a.vy;
        a.vy = b.vy * 0.58;
        b.vy = velocity * 0.58;
      }
      a.angularVelocity += (Math.random() - 0.5) * 22;
      b.angularVelocity += (Math.random() - 0.5) * 22;
    }
  }
}

function runBarragePhysics(timestamp) {
  if (!barrageVisible || prefersReducedMotion || !barrageContainer) return;
  const delta = Math.min(0.032, Math.max(0.008, (timestamp - lastPhysicsTime) / 1000 || 0.016));
  lastPhysicsTime = timestamp;
  const width = barrageContainer.clientWidth;
  const floor = barrageContainer.clientHeight - 42;

  barrageBodies.forEach((body) => {
    body.vy += 760 * delta;
    body.x += body.vx * delta;
    body.y += body.vy * delta;
    body.angle += body.angularVelocity * delta;

    if (body.x < 8) {
      body.x = 8;
      body.vx = Math.abs(body.vx) * 0.62;
    } else if (body.x + body.width > width - 8) {
      body.x = width - body.width - 8;
      body.vx = -Math.abs(body.vx) * 0.62;
    }

    if (body.y + body.height > floor) {
      body.y = floor - body.height;
      body.vy = Math.abs(body.vy) < 28 ? 0 : -Math.abs(body.vy) * 0.42;
      body.vx *= 0.985;
      body.angularVelocity *= 0.94;
    }
  });

  resolveBarrageCollisions();
  barrageBodies.forEach((body) => {
    body.element.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.angle}deg)`;
  });
  barrageFrame = requestAnimationFrame(runBarragePhysics);
}

if (blogStage && barrageContainer) {
  const barrageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      barrageVisible = entry.isIntersecting;
      if (entry.isIntersecting) {
        createBarrageBodies();
        if (!prefersReducedMotion) {
          cancelAnimationFrame(barrageFrame);
          lastPhysicsTime = performance.now();
          barrageFrame = requestAnimationFrame(runBarragePhysics);
        }
      } else {
        cancelAnimationFrame(barrageFrame);
      }
    });
  }, { threshold: 0.25 });
  barrageObserver.observe(blogStage);
}

window.addEventListener('resize', () => {
  if (!barrageContainer || !barrageBodies.length) return;
  const width = barrageContainer.clientWidth;
  const floor = barrageContainer.clientHeight - 42;
  barrageBodies.forEach((body) => {
    body.x = Math.max(8, Math.min(body.x, width - body.width - 8));
    body.y = Math.min(body.y, floor - body.height);
  });
});
