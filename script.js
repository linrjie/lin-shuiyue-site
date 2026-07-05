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
