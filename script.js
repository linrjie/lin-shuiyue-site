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
  '发呆五分钟', '收藏此刻', '今天也要开心', '灵感加载中',
  '夜猫子', '再看一集', '发呆也是正事', '小站施工队',
  '来杯可乐', '收藏快乐', '保持好奇', '水神巡演',
  '摸鱼批准', '下次见'
];
const barrageTones = ['blue', 'pink', 'mint', 'yellow', 'violet'];
let barrageBodies = [];
let barrageFrame = 0;
let barrageStarted = false;
let barrageVisible = false;
let lastPhysicsTime = 0;
let barrageElapsed = 0;

function createBarrageBodies() {
  if (!barrageContainer || barrageStarted) return;
  barrageStarted = true;
  const width = barrageContainer.clientWidth;
  const visibleMessages = window.innerWidth < 700 ? barrageMessages.slice(0, 16) : barrageMessages;

  barrageBodies = visibleMessages.map((message, index) => {
    const element = document.createElement('span');
    element.className = 'barrage-pill';
    element.dataset.tone = barrageTones[index % barrageTones.length];
    element.textContent = message;
    barrageContainer.append(element);
    const bodyWidth = element.offsetWidth;
    const bodyHeight = element.offsetHeight;
    const x = 14 + Math.random() * Math.max(1, width - bodyWidth - 28);
    const body = {
      element,
      x,
      y: -bodyHeight - 8,
      width: bodyWidth,
      height: bodyHeight,
      vx: (Math.random() - 0.5) * 76,
      vy: 0,
      angle: (Math.random() - 0.5) * 20,
      angularVelocity: (Math.random() - 0.5) * 48,
      dropAt: index * 125 + Math.random() * 150,
      active: false
    };
    element.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.angle}deg)`;
    return body;
  });

  if (prefersReducedMotion) {
    const height = barrageContainer.clientHeight;
    barrageBodies.forEach((body, index) => {
      const columns = window.innerWidth < 700 ? 3 : 6;
      const column = index % columns;
      const row = Math.floor(index / columns);
      body.x = 12 + column * ((width - body.width - 24) / Math.max(1, columns - 1));
      body.y = Math.min(height - body.height - 50, 95 + row * 58);
      body.active = true;
      body.element.classList.add('is-active');
      body.element.style.transform = `translate3d(${body.x}px,${body.y}px,0) rotate(${body.angle * 0.35}deg)`;
    });
  }
}

function constrainBarrageBody(body, width, floor) {
  if (body.x < 8) {
    body.x = 8;
    body.vx = Math.abs(body.vx) * 0.5;
  } else if (body.x + body.width > width - 8) {
    body.x = width - body.width - 8;
    body.vx = -Math.abs(body.vx) * 0.5;
  }
  if (body.y + body.height > floor) {
    body.y = floor - body.height;
    body.vy = Math.abs(body.vy) < 34 ? 0 : -Math.abs(body.vy) * 0.28;
    body.vx *= 0.96;
    body.angularVelocity *= 0.88;
  }
}

function resolveBarrageCollisions(width, floor) {
  for (let pass = 0; pass < 5; pass += 1) {
    for (let i = 0; i < barrageBodies.length; i += 1) {
      const a = barrageBodies[i];
      if (!a.active) continue;
      for (let j = i + 1; j < barrageBodies.length; j += 1) {
        const b = barrageBodies[j];
        if (!b.active) continue;
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
          const normal = a.x + a.width / 2 < b.x + b.width / 2 ? 1 : -1;
          a.x -= normal * overlapX * 0.51;
          b.x += normal * overlapX * 0.51;
          const relativeVelocity = (b.vx - a.vx) * normal;
          if (relativeVelocity < 0) {
            const impulse = -relativeVelocity * 0.68;
            a.vx -= impulse * normal;
            b.vx += impulse * normal;
          }
        } else {
          const normal = a.y + a.height / 2 < b.y + b.height / 2 ? 1 : -1;
          a.y -= normal * overlapY * 0.51;
          b.y += normal * overlapY * 0.51;
          const relativeVelocity = (b.vy - a.vy) * normal;
          if (relativeVelocity < 0) {
            const impulse = -relativeVelocity * 0.58;
            a.vy -= impulse * normal;
            b.vy += impulse * normal;
          }
          a.vx *= 0.985;
          b.vx *= 0.985;
        }
        a.angularVelocity += (b.vx - a.vx) * 0.035;
        b.angularVelocity -= (b.vx - a.vx) * 0.035;
      }
    }
    barrageBodies.forEach((body) => {
      if (body.active) constrainBarrageBody(body, width, floor);
    });
  }
}

function runBarragePhysics(timestamp) {
  if (!barrageVisible || prefersReducedMotion || !barrageContainer) return;
  const delta = Math.min(0.032, Math.max(0.008, (timestamp - lastPhysicsTime) / 1000 || 0.016));
  lastPhysicsTime = timestamp;
  const width = barrageContainer.clientWidth;
  const floor = barrageContainer.clientHeight - 42;
  const steps = delta > 0.02 ? 2 : 1;
  const step = delta / steps;
  barrageElapsed += delta * 1000;

  barrageBodies.forEach((body) => {
    if (!body.active && barrageElapsed >= body.dropAt) {
      body.active = true;
      body.element.classList.add('is-active');
    }
  });

  for (let substep = 0; substep < steps; substep += 1) {
    barrageBodies.forEach((body) => {
      if (!body.active) return;
      body.vy += 880 * step;
      body.x += body.vx * step;
      body.y += body.vy * step;
      body.angle += body.angularVelocity * step;
      constrainBarrageBody(body, width, floor);
    });
    resolveBarrageCollisions(width, floor);
  }

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

const siteDataKey = 'lin-shuiyue-site-data-v1';
const defaultSiteData = {
  profile: {
    intro: '我是林水月。平时喜欢发现生活里那些微不足道、但会让人开心的小事。建这个网站没什么宏大理由——就是想让朋友来的时候，有个地方能多了解我一点。',
    now: '继续完善这个写给朋友的小站',
    snack: '薯片、巧克力和冰冰的饮料',
    goal: '把喜欢的事慢慢做成长期习惯',
    anime: '《葬送的芙莉莲》《孤独摇滚！》',
    xp: '蓝白配色、反差感、优雅又有点闹腾的角色'
  },
  contents: [
    { id: 'welcome-article', type: 'article', title: '这个小站为什么存在', body: '想给朋友留一个随时可以推门进来的角落，也顺便收藏那些不想忘记的瞬间。', date: '初次见面' },
    { id: 'today-note', type: 'note', title: '今日碎碎念', body: '网页又多了一点可以亲手摆放的东西，慢慢搭建也很有意思。', date: '最近更新' },
    { id: 'moon-image', type: 'image', title: '月夜工作台', body: '今晚的背景，以及还没有写完的故事。', image: 'assets/blog-stage-bg.png', date: '相片夹' }
  ]
};

const aboutIntro = document.getElementById('about-intro');
const profileFields = {
  now: document.getElementById('profile-now'),
  snack: document.getElementById('profile-snack'),
  goal: document.getElementById('profile-goal'),
  anime: document.getElementById('profile-anime'),
  xp: document.getElementById('profile-xp')
};
const contentGrid = document.getElementById('content-grid');
const contentEmpty = document.getElementById('content-empty');
const settingsPanel = document.getElementById('site-settings');
const settingsBackdrop = document.getElementById('settings-backdrop');
const settingsTrigger = document.getElementById('settings-trigger');
const settingsClose = document.getElementById('settings-close');
const settingsStatus = document.getElementById('settings-status');
const settingsContentList = document.getElementById('settings-content-list');
const settingsCount = document.getElementById('settings-count');
const profileForm = document.getElementById('profile-form');
const contentForm = document.getElementById('content-form');
const contentTypeLabels = { article: 'ARTICLE · 文章', note: 'NOTE · 笔记', image: 'IMAGE · 图片' };
let settingsReturnFocus = null;

function cloneDefaultSiteData() {
  return JSON.parse(JSON.stringify(defaultSiteData));
}

function readSiteData() {
  try {
    const saved = JSON.parse(localStorage.getItem(siteDataKey));
    if (!saved?.profile || !Array.isArray(saved.contents)) return cloneDefaultSiteData();
    return saved;
  } catch {
    return cloneDefaultSiteData();
  }
}

let siteData = readSiteData();

function saveSiteData(nextData) {
  try {
    localStorage.setItem(siteDataKey, JSON.stringify(nextData));
    siteData = nextData;
    return true;
  } catch {
    if (settingsStatus) settingsStatus.textContent = '保存失败：本地空间可能已满，请换一张更小的图片。';
    return false;
  }
}

function renderProfile() {
  if (aboutIntro) aboutIntro.textContent = siteData.profile.intro;
  Object.entries(profileFields).forEach(([key, element]) => {
    if (element) element.textContent = siteData.profile[key];
  });
}

function renderContents() {
  if (!contentGrid || !settingsContentList) return;
  contentGrid.replaceChildren();
  settingsContentList.replaceChildren();
  contentEmpty.hidden = siteData.contents.length > 0;
  if (settingsCount) settingsCount.textContent = `${siteData.contents.length} ITEMS`;

  siteData.contents.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'project-card content-card';
    card.dataset.type = item.type;

    const visual = document.createElement('div');
    visual.className = 'project-visual';
    if (item.image) {
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.title;
      image.loading = 'lazy';
      visual.append(image);
    } else {
      visual.textContent = item.type === 'article' ? 'READ' : item.type === 'note' ? 'NOTE' : 'IMG';
    }

    const content = document.createElement('div');
    content.className = 'project-content';
    const type = document.createElement('p');
    const title = document.createElement('h3');
    const body = document.createElement('span');
    type.textContent = `${contentTypeLabels[item.type] || 'CONTENT'} · ${item.date}`;
    title.textContent = item.title;
    body.textContent = item.body || '没有说明，只留下这一刻。';
    content.append(type, title, body);
    card.append(visual, content);
    contentGrid.append(card);

    const row = document.createElement('div');
    row.className = 'settings-item';
    const summary = document.createElement('div');
    const rowTitle = document.createElement('strong');
    const rowType = document.createElement('small');
    const remove = document.createElement('button');
    rowTitle.textContent = item.title;
    rowType.textContent = contentTypeLabels[item.type] || '内容';
    remove.type = 'button';
    remove.dataset.removeContent = item.id;
    remove.textContent = '删除';
    summary.append(rowTitle, rowType);
    row.append(summary, remove);
    settingsContentList.append(row);
  });
}

function fillProfileForm() {
  if (!profileForm) return;
  Object.entries(siteData.profile).forEach(([key, value]) => {
    const field = profileForm.elements.namedItem(key);
    if (field) field.value = value;
  });
}

function openSettings() {
  if (!settingsPanel || !settingsBackdrop) return;
  settingsReturnFocus = document.activeElement;
  fillProfileForm();
  settingsBackdrop.hidden = false;
  settingsPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('settings-open');
  requestAnimationFrame(() => settingsPanel.classList.add('is-open'));
  settingsClose?.focus();
}

function closeSettings() {
  if (!settingsPanel || !settingsBackdrop) return;
  settingsPanel.classList.remove('is-open');
  settingsPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('settings-open');
  window.setTimeout(() => { settingsBackdrop.hidden = true; }, 320);
  settingsReturnFocus?.focus?.();
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

settingsTrigger?.addEventListener('click', () => {
  siteHeader?.classList.remove('is-expanded');
  navPeek?.setAttribute('aria-expanded', 'false');
  openSettings();
});
settingsClose?.addEventListener('click', closeSettings);
settingsBackdrop?.addEventListener('click', closeSettings);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && settingsPanel?.classList.contains('is-open')) closeSettings();
});

profileForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(profileForm);
  const nextData = {
    ...siteData,
    profile: Object.fromEntries(['intro', 'now', 'snack', 'goal', 'anime', 'xp'].map((key) => [key, String(data.get(key) || '').trim()]))
  };
  if (!saveSiteData(nextData)) return;
  renderProfile();
  if (settingsStatus) settingsStatus.textContent = '关于我已保存。';
});

contentForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(contentForm);
  const type = String(data.get('type'));
  const file = data.get('imageFile');
  let image = String(data.get('imageUrl') || '').trim();

  if (file instanceof File && file.size > 0) {
    if (file.size > 900000) {
      if (settingsStatus) settingsStatus.textContent = '这张图片超过 900 KB，请压缩后再试。';
      return;
    }
    image = await readImageFile(file);
  }
  if (type === 'image' && !image) {
    if (settingsStatus) settingsStatus.textContent = '图片类型需要填写图片链接或选择本地图片。';
    return;
  }

  const nextItem = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title: String(data.get('title') || '').trim(),
    body: String(data.get('body') || '').trim(),
    image,
    date: new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date())
  };
  const nextData = { ...siteData, contents: [nextItem, ...siteData.contents] };
  if (!saveSiteData(nextData)) return;
  contentForm.reset();
  renderContents();
  if (settingsStatus) settingsStatus.textContent = '新内容已添加到页面。';
});

settingsContentList?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-content]');
  if (!button) return;
  const item = siteData.contents.find(({ id }) => id === button.dataset.removeContent);
  if (!item || !window.confirm(`删除“${item.title}”？`)) return;
  const nextData = { ...siteData, contents: siteData.contents.filter(({ id }) => id !== item.id) };
  if (!saveSiteData(nextData)) return;
  renderContents();
  if (settingsStatus) settingsStatus.textContent = '内容已删除。';
});

renderProfile();
renderContents();
