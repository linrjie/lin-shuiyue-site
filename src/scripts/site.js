import './guestbook.js';
import './pet.js';
import './music.js';
import './barrage.js';

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const clock = document.getElementById('clock');
const calendar = document.getElementById('calendar');

function updateClock() {
  const now = new Date();
  if (clock) {
    clock.textContent = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(now);
    clock.dateTime = now.toISOString();
  }
  if (calendar) {
    const solar = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now);
    let lunar = '';
    try {
      lunar = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { month: 'long', day: 'numeric' }).format(now);
    } catch {}
    calendar.textContent = lunar ? `${solar} · 农历${lunar}` : solar;
  }
}

updateClock();
if (clock) window.setInterval(updateClock, 1000);

const themeToggle = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeKey = 'lin-shuiyue-theme';

function applyTheme(theme) {
  const isNight = theme === 'night';
  document.documentElement.dataset.theme = isNight ? 'night' : 'day';
  themeToggle?.setAttribute('aria-pressed', String(isNight));
  if (themeToggle) themeToggle.textContent = isNight ? '昼' : '夜';
  themeMeta?.setAttribute('content', isNight ? '#080f24' : '#eaf1ff');
}

let savedTheme = null;
try { savedTheme = localStorage.getItem(themeKey); } catch {}
applyTheme(savedTheme === 'night' ? 'night' : 'day');

themeToggle?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'night' ? 'day' : 'night';
  applyTheme(nextTheme);
  try { localStorage.setItem(themeKey, nextTheme); } catch {}
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const animatedElements = document.querySelectorAll('.project-card, .about-copy');
if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  animatedElements.forEach((element) => {
    element.classList.add('will-animate');
    observer.observe(element);
  });
}

const siteHeader = document.querySelector('.site-header');
const navPeek = document.getElementById('nav-peek');
navPeek?.addEventListener('click', () => {
  const expanded = siteHeader?.classList.toggle('is-expanded') || false;
  navPeek.setAttribute('aria-expanded', String(expanded));
});
siteHeader?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  siteHeader.classList.remove('is-expanded');
  navPeek?.setAttribute('aria-expanded', 'false');
}));
document.addEventListener('pointerdown', (event) => {
  if (!siteHeader?.classList.contains('is-expanded') || siteHeader.contains(event.target)) return;
  siteHeader.classList.remove('is-expanded');
  navPeek?.setAttribute('aria-expanded', 'false');
});

const defaultProfile = {
  intro: '我是林水月。平时喜欢发现生活里那些微不足道、但会让人开心的小事。建这个网站没什么宏大理由——就是想让朋友来的时候，有个地方能多了解我一点。',
  now: '继续完善这个写给朋友的小站',
  snack: '薯片、巧克力和冰冰的饮料',
  goal: '把喜欢的事慢慢做成长期习惯',
  anime: '《葬送的芙莉莲》《孤独摇滚！》',
  xp: '蓝白配色、反差感、优雅又有点闹腾的角色'
};
const siteDataKey = 'lin-shuiyue-site-data-v1';
const profileFields = {
  now: document.getElementById('profile-now'), snack: document.getElementById('profile-snack'),
  goal: document.getElementById('profile-goal'), anime: document.getElementById('profile-anime'), xp: document.getElementById('profile-xp')
};
const aboutIntro = document.getElementById('about-intro');
const settingsPanel = document.getElementById('site-settings');
const settingsBackdrop = document.getElementById('settings-backdrop');
const settingsTrigger = document.getElementById('settings-trigger');
const settingsClose = document.getElementById('settings-close');
const settingsStatus = document.getElementById('settings-status');
const profileForm = document.getElementById('profile-form');
const settingsBackground = [siteHeader, document.querySelector('main'), document.querySelector('footer'), document.getElementById('pet-console'), document.getElementById('site-pet')].filter(Boolean);
let storedSiteData = {};
let profile = { ...defaultProfile };
let settingsReturnFocus = null;
let settingsBackdropTimer = 0;

try {
  storedSiteData = JSON.parse(localStorage.getItem(siteDataKey)) || {};
  if (storedSiteData.profile) profile = { ...defaultProfile, ...storedSiteData.profile };
} catch {}

function renderProfile() {
  if (aboutIntro) aboutIntro.textContent = profile.intro;
  Object.entries(profileFields).forEach(([key, element]) => { if (element) element.textContent = profile[key]; });
}

function fillProfileForm() {
  if (!profileForm) return;
  Object.entries(profile).forEach(([key, value]) => {
    const field = profileForm.elements.namedItem(key);
    if (field) field.value = value;
  });
}

function openSettings() {
  if (!settingsPanel || !settingsBackdrop) return;
  settingsReturnFocus = document.activeElement;
  fillProfileForm();
  window.clearTimeout(settingsBackdropTimer);
  settingsBackdrop.hidden = false;
  settingsPanel.removeAttribute('inert');
  settingsBackground.forEach((element) => element.setAttribute('inert', ''));
  settingsPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('settings-open');
  requestAnimationFrame(() => settingsPanel.classList.add('is-open'));
  settingsClose?.focus();
}

function closeSettings() {
  if (!settingsPanel || !settingsBackdrop) return;
  settingsPanel.classList.remove('is-open');
  settingsPanel.setAttribute('aria-hidden', 'true');
  settingsPanel.setAttribute('inert', '');
  settingsBackground.forEach((element) => element.removeAttribute('inert'));
  document.body.classList.remove('settings-open');
  window.clearTimeout(settingsBackdropTimer);
  settingsBackdropTimer = window.setTimeout(() => { settingsBackdrop.hidden = true; }, 320);
  settingsReturnFocus?.focus?.();
}

settingsTrigger?.addEventListener('click', () => {
  siteHeader?.classList.remove('is-expanded');
  navPeek?.setAttribute('aria-expanded', 'false');
  openSettings();
});
settingsClose?.addEventListener('click', closeSettings);
settingsBackdrop?.addEventListener('click', closeSettings);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    siteHeader?.classList.remove('is-expanded');
    navPeek?.setAttribute('aria-expanded', 'false');
    if (settingsPanel?.classList.contains('is-open')) closeSettings();
  }
});

profileForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(profileForm);
  profile = Object.fromEntries(['intro', 'now', 'snack', 'goal', 'anime', 'xp'].map((key) => [key, String(data.get(key) || '').trim()]));
  try {
    storedSiteData = { ...storedSiteData, profile };
    localStorage.setItem(siteDataKey, JSON.stringify(storedSiteData));
    renderProfile();
    if (settingsStatus) settingsStatus.textContent = '关于我已保存。';
  } catch {
    if (settingsStatus) settingsStatus.textContent = '保存失败：浏览器拒绝了本地存储。';
  }
});

renderProfile();
